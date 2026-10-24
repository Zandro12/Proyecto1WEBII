const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Band = require('../models/Band');
const Musician = require('../models/Musician');
const Equipment = require('../models/Equipment');
const Loan = require('../models/Loan');

// Función auxiliar para obtener fecha actual en formato YYYY-MM-DD
const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Función auxiliar para validar reglas de negocio comunes de reserva
const validateBookingRules = async ({ roomId, bandId, date, startHour, endHour, excludeBookingId = null, session = null }) => {
  // 1. Validar horas
  if (typeof startHour !== 'number' || typeof endHour !== 'number') {
    const error = new Error('Las horas de inicio y fin deben ser numéricas');
    error.statusCode = 400;
    throw error;
  }

  if (endHour <= startHour) {
    const error = new Error('La hora de fin debe ser estrictamente mayor que la hora de inicio');
    error.statusCode = 400;
    throw error;
  }

  if (endHour - startHour > 3) {
    const error = new Error('La reserva dura como máximo 3 horas');
    error.statusCode = 400;
    throw error;
  }

  // 2. Validar fecha (hoy o posterior)
  const todayStr = getTodayString();
  if (date < todayStr) {
    const error = new Error('La fecha debe ser hoy o un día posterior');
    error.statusCode = 400;
    throw error;
  }

  // 3. Validar Sala
  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    const error = new Error('El ID de sala no es válido');
    error.statusCode = 404;
    throw error;
  }

  const roomQuery = Room.findById(roomId);
  if (session) roomQuery.session(session);
  const room = await roomQuery;

  if (!room) {
    const error = new Error('La sala especificada no existe');
    error.statusCode = 404;
    throw error;
  }

  if (room.status !== 'disponible') {
    const error = new Error('La sala no está disponible (se encuentra en mantenimiento)');
    error.statusCode = 409;
    throw error;
  }

  // 4. Validar Banda
  if (!mongoose.Types.ObjectId.isValid(bandId)) {
    const error = new Error('El ID de banda no es válido');
    error.statusCode = 404;
    throw error;
  }

  const bandQuery = Band.findById(bandId);
  if (session) bandQuery.session(session);
  const band = await bandQuery;

  if (!band) {
    const error = new Error('La banda especificada no existe');
    error.statusCode = 404;
    throw error;
  }

  if (!band.active) {
    const error = new Error('La banda no está activa');
    error.statusCode = 409;
    throw error;
  }

  // 5. Validar músicos activos de la banda
  const musicianCountQuery = Musician.countDocuments({ band: bandId, active: true });
  if (session) musicianCountQuery.session(session);
  const activeMusiciansCount = await musicianCountQuery;

  if (activeMusiciansCount === 0) {
    const error = new Error('La banda debe tener al menos un músico activo');
    error.statusCode = 409;
    throw error;
  }

  if (activeMusiciansCount > room.capacity) {
    const error = new Error(
      `Los músicos activos de la banda (${activeMusiciansCount}) exceden la capacidad de la sala (${room.capacity})`
    );
    error.statusCode = 409;
    throw error;
  }

  // 6. Validar traslape
  // Inicio pedido < Fin existente Y Fin pedido > Inicio existente
  const overlapCriteria = {
    room: roomId,
    date: date,
    status: { $in: ['apartada', 'confirmada'] },
    startHour: { $lt: endHour },
    endHour: { $gt: startHour }
  };

  if (excludeBookingId) {
    overlapCriteria._id = { $ne: excludeBookingId };
  }

  const overlapQuery = Booking.findOne(overlapCriteria);
  if (session) overlapQuery.session(session);
  const overlappingBooking = await overlapQuery;

  if (overlappingBooking) {
    const error = new Error('Existe un traslape de horario con otra reserva apartada o confirmada en la misma sala');
    error.statusCode = 409;
    throw error;
  }

  return { room, band, activeMusiciansCount };
};

// POST /api/bookings
// Transacción multi-colección con startSession y withTransaction
const createBooking = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    let result = null;

    await session.withTransaction(async () => {
      const { room, band, date, startHour, endHour, notes, equipment = [] } = req.body;

      if (!room || !band || !date || startHour === undefined || endHour === undefined) {
        const error = new Error('Los campos room, band, date, startHour y endHour son obligatorios');
        error.statusCode = 400;
        throw error;
      }

      // Validar reglas de negocio dentro de la transacción
      await validateBookingRules({
        roomId: room,
        bandId: band,
        date,
        startHour,
        endHour,
        session
      });

      // Validar arreglo de equipo
      if (!Array.isArray(equipment)) {
        const error = new Error('El campo equipment debe ser un arreglo');
        error.statusCode = 400;
        throw error;
      }

      // Verificar que no se repita el mismo equipo en múltiples líneas
      const equipmentIdsSeen = new Set();
      for (const item of equipment) {
        if (!item.equipmentId || !mongoose.Types.ObjectId.isValid(item.equipmentId)) {
          const error = new Error('Cada ítem de equipo debe tener un equipmentId válido');
          error.statusCode = 400;
          throw error;
        }

        const idStr = item.equipmentId.toString();
        if (equipmentIdsSeen.has(idStr)) {
          const error = new Error('No se pueden pedir dos líneas del mismo equipo en la misma reserva');
          error.statusCode = 400;
          throw error;
        }
        equipmentIdsSeen.add(idStr);

        const units = Number(item.units);
        if (!Number.isInteger(units) || units <= 0) {
          const error = new Error('Las unidades de equipo deben ser un número entero mayor que 0');
          error.statusCode = 400;
          throw error;
        }
      }

      // Validar disponibilidad de inventario de cada equipo
      const equipmentDocsToUpdate = [];
      for (const item of equipment) {
        const eqDoc = await Equipment.findById(item.equipmentId).session(session);
        if (!eqDoc) {
          const error = new Error(`El equipo con ID ${item.equipmentId} no existe`);
          error.statusCode = 404;
          throw error;
        }

        if (item.units > eqDoc.availableUnits) {
          const error = new Error(
            `Unidades insuficientes para el equipo '${eqDoc.name}'. Solicitadas: ${item.units}, Disponibles: ${eqDoc.availableUnits}`
          );
          error.statusCode = 409;
          throw error;
        }

        equipmentDocsToUpdate.push({ doc: eqDoc, units: item.units });
      }

      // Crear Booking dentro de la transacción
      const [newBooking] = await Booking.create(
        [
          {
            room,
            band,
            date,
            startHour,
            endHour,
            notes,
            status: 'apartada'
          }
        ],
        { session }
      );

      // Crear préstamos y descontar inventario con $inc
      const loansCreated = [];
      for (const item of equipmentDocsToUpdate) {
        const [loan] = await Loan.create(
          [
            {
              booking: newBooking._id,
              equipment: item.doc._id,
              units: item.units,
              status: 'prestado'
            }
          ],
          { session }
        );
        loansCreated.push(loan);

        // Descontar availableUnits usando $inc dentro de la transacción
        await Equipment.findByIdAndUpdate(
          item.doc._id,
          { $inc: { availableUnits: -item.units } },
          { session, returnDocument: 'after', runValidators: true }
        );
      }

      result = {
        booking: newBooking,
        loans: loansCreated
      };
    });

    // Respuesta una vez confirmada la transacción
    const populatedBooking = await Booking.findById(result.booking._id)
      .populate('room')
      .populate('band');

    return res.status(201).json({
      ...populatedBooking.toJSON(),
      loans: result.loans
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

// GET /api/bookings
// El listado filtra por status, room, band, date, from y to
const getBookings = async (req, res, next) => {
  try {
    const { page, limit, skip, sort, searchFilter } = req.pagination;
    const query = { ...searchFilter };

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.room) {
      if (!mongoose.Types.ObjectId.isValid(req.query.room)) {
        return res.status(400).json({ error: 'El ID de la sala no es válido' });
      }
      query.room = req.query.room;
    }

    if (req.query.band) {
      if (!mongoose.Types.ObjectId.isValid(req.query.band)) {
        return res.status(400).json({ error: 'El ID de la banda no es válido' });
      }
      query.band = req.query.band;
    }

    if (req.query.date) {
      query.date = req.query.date;
    } else {
      if (req.query.from || req.query.to) {
        query.date = {};
        if (req.query.from) query.date.$gte = req.query.from;
        if (req.query.to) query.date.$lte = req.query.to;
      }
    }

    const total = await Booking.countDocuments(query);
    const data = await Booking.find(query)
      .populate('room')
      .populate('band')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const pages = total > 0 ? Math.ceil(total / limit) : 0;

    return res.status(200).json({
      data,
      page,
      limit,
      total,
      pages
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/stats (Aggregate)
// Cuenta reservas por estado
const getBookingsStats = async (req, res, next) => {
  try {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1
        }
      },
      {
        $sort: { status: 1 }
      }
    ]);

    return res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/:id
// El detalle trae sala (name, capacity, status), banda (name, genre y sus músicos activos),
// y préstamos (cada préstamo trae el equipo)
const getBookingById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('room', 'name capacity status')
      .populate('band', 'name genre');

    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // Obtener músicos activos de la banda
    let activeMusicians = [];
    if (booking.band) {
      activeMusicians = await Musician.find({
        band: booking.band._id,
        active: true
      }).select('name instrument email');
    }

    // Obtener préstamos con equipo poblado
    const loans = await Loan.find({ booking: booking._id }).populate('equipment');

    const bookingObj = booking.toJSON();
    if (bookingObj.band) {
      bookingObj.band.activeMusicians = activeMusicians;
    }
    bookingObj.loans = loans;

    return res.status(200).json(bookingObj);
  } catch (error) {
    next(error);
  }
};

// PUT /api/bookings/:id
// Actualizar horario, sala o banda vuelve a comprobar las reglas.
// Cambiar el equipo de una reserva ya creada queda fuera del alcance.
// Cambios de estado permitidos:
// apartada pasa a confirmada o a cancelada;
// confirmada pasa a cancelada;
// cancelada se queda así.
const updateBooking = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const existingBooking = await Booking.findById(req.params.id);
    if (!existingBooking) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // Si ya está cancelada, no se puede modificar
    if (existingBooking.status === 'cancelada') {
      return res.status(409).json({ error: 'Una reserva cancelada no puede ser modificada' });
    }

    const { room, band, date, startHour, endHour, notes, status } = req.body;

    // Validación de transición de estados
    if (status !== undefined && status !== existingBooking.status) {
      if (existingBooking.status === 'apartada') {
        if (status !== 'confirmada' && status !== 'cancelada') {
          return res.status(409).json({
            error: `Transición de estado no permitida de '${existingBooking.status}' a '${status}'`
          });
        }
      } else if (existingBooking.status === 'confirmada') {
        if (status !== 'cancelada') {
          return res.status(409).json({
            error: `Transición de estado no permitida de '${existingBooking.status}' a '${status}'`
          });
        }
      }

      // Si el cambio de estado es a 'cancelada', debe realizarse mediante la lógica transaccional de cancelación
      if (status === 'cancelada') {
        req.params.id = existingBooking._id;
        return cancelBooking(req, res, next);
      }
    }

    const targetRoom = room || existingBooking.room;
    const targetBand = band || existingBooking.band;
    const targetDate = date || existingBooking.date;
    const targetStartHour = startHour !== undefined ? startHour : existingBooking.startHour;
    const targetEndHour = endHour !== undefined ? endHour : existingBooking.endHour;

    // Si se modifican campos críticos de la reserva, volver a validar reglas
    const needsRevalidation =
      room !== undefined ||
      band !== undefined ||
      date !== undefined ||
      startHour !== undefined ||
      endHour !== undefined;

    if (needsRevalidation) {
      await validateBookingRules({
        roomId: targetRoom,
        bandId: targetBand,
        date: targetDate,
        startHour: targetStartHour,
        endHour: targetEndHour,
        excludeBookingId: existingBooking._id
      });
    }

    if (room !== undefined) existingBooking.room = room;
    if (band !== undefined) existingBooking.band = band;
    if (date !== undefined) existingBooking.date = date;
    if (startHour !== undefined) existingBooking.startHour = startHour;
    if (endHour !== undefined) existingBooking.endHour = endHour;
    if (notes !== undefined) existingBooking.notes = notes;
    if (status !== undefined) existingBooking.status = status;

    await existingBooking.save();

    const updated = await Booking.findById(existingBooking._id)
      .populate('room')
      .populate('band');

    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/bookings/:id/cancel
// Transacción multi-colección con startSession y withTransaction
// Al cancelar, el Booking pasa a cancelada, sus préstamos pasan a devuelto y las unidades regresan a availableUnits
const cancelBooking = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    let canceledBookingResult = null;

    await session.withTransaction(async () => {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        const error = new Error('Reserva no encontrada');
        error.statusCode = 404;
        throw error;
      }

      const booking = await Booking.findById(req.params.id).session(session);
      if (!booking) {
        const error = new Error('Reserva no encontrada');
        error.statusCode = 404;
        throw error;
      }

      if (booking.status === 'cancelada') {
        const error = new Error('La reserva ya se encuentra cancelada');
        error.statusCode = 409;
        throw error;
      }

      // Cambiar estado de la reserva a cancelada
      booking.status = 'cancelada';
      await booking.save({ session });

      // Buscar préstamos en estado prestado
      const activeLoans = await Loan.find({
        booking: booking._id,
        status: 'prestado'
      }).session(session);

      // Devolver cada préstamo e incrementar availableUnits en Equipment con $inc
      for (const loan of activeLoans) {
        loan.status = 'devuelto';
        await loan.save({ session });

        await Equipment.findByIdAndUpdate(
          loan.equipment,
          { $inc: { availableUnits: loan.units } },
          { session, returnDocument: 'after', runValidators: true }
        );
      }

      canceledBookingResult = booking;
    });

    const responseBooking = await Booking.findById(canceledBookingResult._id)
      .populate('room')
      .populate('band');

    const loans = await Loan.find({ booking: responseBooking._id }).populate('equipment');

    return res.status(200).json({
      message: 'Reserva cancelada y equipos devueltos al inventario con éxito',
      booking: responseBooking,
      loans
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingsStats,
  getBookingById,
  updateBooking,
  cancelBooking
};
