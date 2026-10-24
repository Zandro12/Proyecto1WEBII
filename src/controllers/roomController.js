const mongoose = require('mongoose');
const Room = require('../models/Room');
const Booking = require('../models/Booking');

// POST /api/rooms
const createRoom = async (req, res, next) => {
  try {
    const { name, capacity, floor, hasDrumKit, status } = req.body;
    const room = await Room.create({ name, capacity, floor, hasDrumKit, status });
    return res.status(201).json(room);
  } catch (error) {
    next(error);
  }
};

// GET /api/rooms
const getRooms = async (req, res, next) => {
  try {
    const { page, limit, skip, sort, searchFilter } = req.pagination;
    const query = { ...searchFilter };

    const total = await Room.countDocuments(query);
    const data = await Room.find(query)
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

// GET /api/rooms/stats (Aggregate)
// Devuelve, por sala, cuántas reservas activas tiene (apartada o confirmada)
const getRoomsStats = async (req, res, next) => {
  try {
    const stats = await Room.aggregate([
      {
        $lookup: {
          from: 'bookings',
          let: { roomId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$room', '$$roomId'] },
                    { $in: ['$status', ['apartada', 'confirmada']] }
                  ]
                }
              }
            }
          ],
          as: 'activeBookings'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          capacity: 1,
          floor: 1,
          status: 1,
          activeBookingsCount: { $size: '$activeBookings' }
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);

    return res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

// GET /api/rooms/:id
const getRoomById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }
    return res.status(200).json(room);
  } catch (error) {
    next(error);
  }
};

// PUT /api/rooms/:id
const updateRoom = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }
    const { name, capacity, floor, hasDrumKit, status } = req.body;
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { name, capacity, floor, hasDrumKit, status },
      { returnDocument: 'after', runValidators: true }
    );
    if (!room) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }
    return res.status(200).json(room);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/rooms/:id
// Regla: Borrar una sala con reservas apartada o confirmada responde 409
const deleteRoom = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }
    const activeBooking = await Booking.findOne({
      room: req.params.id,
      status: { $in: ['apartada', 'confirmada'] }
    });
    if (activeBooking) {
      return res.status(409).json({
        error: 'No se puede eliminar la sala porque tiene reservas activas (apartadas o confirmadas)'
      });
    }

    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }
    return res.status(200).json({ message: 'Sala eliminada con éxito' });
  } catch (error) {
    next(error);
  }
};

// GET /api/rooms/:id/schedule?date=2026-11-02
// El horario devuelve las reservas de ese día ordenadas por startHour, con la banda poblada
const getRoomSchedule = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'El parámetro de consulta date es obligatorio (formato YYYY-MM-DD)' });
    }

    const bookings = await Booking.find({
      room: req.params.id,
      date,
      status: { $ne: 'cancelada' }
    })
      .populate('band')
      .sort({ startHour: 1 });

    return res.status(200).json({
      room: {
        _id: room._id,
        name: room.name,
        capacity: room.capacity,
        floor: room.floor,
        status: room.status
      },
      date,
      bookings
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoom,
  getRooms,
  getRoomsStats,
  getRoomById,
  updateRoom,
  deleteRoom,
  getRoomSchedule
};
