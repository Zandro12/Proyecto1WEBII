const mongoose = require('mongoose');
const Loan = require('../models/Loan');

// Lista los préstamos de equipo con paginación y filtros por estado, reserva o equipo
const getLoans = async (req, res, next) => {
  try {
    const { page, limit, skip, sort, searchFilter } = req.pagination;
    const query = { ...searchFilter };

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.booking) {
      if (!mongoose.Types.ObjectId.isValid(req.query.booking)) {
        return res.status(400).json({ error: 'El ID de reserva no es válido' });
      }
      query.booking = req.query.booking;
    }

    if (req.query.equipment) {
      if (!mongoose.Types.ObjectId.isValid(req.query.equipment)) {
        return res.status(400).json({ error: 'El ID de equipo no es válido' });
      }
      query.equipment = req.query.equipment;
    }

    const total = await Loan.countDocuments(query);
    const data = await Loan.find(query)
      .populate('booking')
      .populate('equipment')
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

// Obtiene el detalle de un préstamo por su ID con la reserva y el equipo poblados
const getLoanById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    const loan = await Loan.findById(req.params.id)
      .populate('booking')
      .populate('equipment');

    if (!loan) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }

    return res.status(200).json(loan);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLoans,
  getLoanById
};
