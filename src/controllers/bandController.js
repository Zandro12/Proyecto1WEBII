const mongoose = require('mongoose');
const Band = require('../models/Band');
const Musician = require('../models/Musician');
const Booking = require('../models/Booking');

// POST /api/bands
const createBand = async (req, res, next) => {
  try {
    const { name, genre, active, contactName } = req.body;
    const band = await Band.create({ name, genre, active, contactName });
    return res.status(201).json(band);
  } catch (error) {
    next(error);
  }
};

// GET /api/bands
const getBands = async (req, res, next) => {
  try {
    const { page, limit, skip, sort, searchFilter } = req.pagination;
    const query = { ...searchFilter };

    const total = await Band.countDocuments(query);
    const data = await Band.find(query)
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

// GET /api/bands/:id (con músicos poblados)
const getBandById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Banda no encontrada' });
    }
    const band = await Band.findById(req.params.id).populate('musicians');
    if (!band) {
      return res.status(404).json({ error: 'Banda no encontrada' });
    }
    return res.status(200).json(band);
  } catch (error) {
    next(error);
  }
};

// PUT /api/bands/:id
const updateBand = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Banda no encontrada' });
    }
    const { name, genre, active, contactName } = req.body;
    const band = await Band.findByIdAndUpdate(
      req.params.id,
      { name, genre, active, contactName },
      { returnDocument: 'after', runValidators: true }
    );
    if (!band) {
      return res.status(404).json({ error: 'Banda no encontrada' });
    }
    return res.status(200).json(band);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/bands/:id
// Reglas:
// 1. Borrar una banda con reservas apartada o confirmada responde 409
// 2. Borrar una banda que todavía tiene músicos responde 409
const deleteBand = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Banda no encontrada' });
    }

    // Comprobar si tiene músicos
    const hasMusicians = await Musician.exists({ band: req.params.id });
    if (hasMusicians) {
      return res.status(409).json({
        error: 'No se puede eliminar la banda porque todavía tiene músicos asociados'
      });
    }

    // Comprobar si tiene reservas activas
    const activeBooking = await Booking.exists({
      band: req.params.id,
      status: { $in: ['apartada', 'confirmada'] }
    });
    if (activeBooking) {
      return res.status(409).json({
        error: 'No se puede eliminar la banda porque tiene reservas activas (apartadas o confirmadas)'
      });
    }

    const band = await Band.findByIdAndDelete(req.params.id);
    if (!band) {
      return res.status(404).json({ error: 'Banda no encontrada' });
    }
    return res.status(200).json({ message: 'Banda eliminada con éxito' });
  } catch (error) {
    next(error);
  }
};

// GET /api/bands/:id/musicians
const getBandMusicians = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Banda no encontrada' });
    }
    const band = await Band.findById(req.params.id);
    if (!band) {
      return res.status(404).json({ error: 'Banda no encontrada' });
    }
    const musicians = await Musician.find({ band: req.params.id });
    return res.status(200).json(musicians);
  } catch (error) {
    next(error);
  }
};

// GET /api/bands/:id/bookings
// Las reservas de la banda incluyen la sala
const getBandBookings = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Banda no encontrada' });
    }
    const band = await Band.findById(req.params.id);
    if (!band) {
      return res.status(404).json({ error: 'Banda no encontrada' });
    }
    const bookings = await Booking.find({ band: req.params.id }).populate('room');
    return res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBand,
  getBands,
  getBandById,
  updateBand,
  deleteBand,
  getBandMusicians,
  getBandBookings
};
