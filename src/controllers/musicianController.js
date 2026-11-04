const mongoose = require('mongoose');
const Musician = require('../models/Musician');
const Band = require('../models/Band');

// Registra un nuevo músico validando que la banda asignada exista
const createMusician = async (req, res, next) => {
  try {
    const { name, instrument, email, band, active } = req.body;

    if (!band || !mongoose.Types.ObjectId.isValid(band)) {
      return res.status(400).json({ error: 'Debe proporcionar un ID de banda válido' });
    }

    const bandExists = await Band.findById(band);
    if (!bandExists) {
      return res.status(404).json({ error: 'La banda especificada no existe' });
    }

    const musician = await Musician.create({ name, instrument, email, band, active });
    return res.status(201).json(musician);
  } catch (error) {
    next(error);
  }
};

// Lista los músicos con paginación, búsqueda y filtros por banda o estado activo
const getMusicians = async (req, res, next) => {
  try {
    const { page, limit, skip, sort, searchFilter } = req.pagination;
    const query = { ...searchFilter };

    if (req.query.band) {
      if (!mongoose.Types.ObjectId.isValid(req.query.band)) {
        return res.status(400).json({ error: 'El ID de la banda para filtrar no es válido' });
      }
      query.band = req.query.band;
    }

    if (req.query.active !== undefined) {
      if (req.query.active === 'true') {
        query.active = true;
      } else if (req.query.active === 'false') {
        query.active = false;
      }
    }

    const total = await Musician.countDocuments(query);
    const data = await Musician.find(query)
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

// Obtiene el detalle de un músico por su ID con su banda poblada
const getMusicianById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Músico no encontrado' });
    }
    const musician = await Musician.findById(req.params.id).populate('band');
    if (!musician) {
      return res.status(404).json({ error: 'Músico no encontrado' });
    }
    return res.status(200).json(musician);
  } catch (error) {
    next(error);
  }
};

// Actualiza los datos de un músico validando la banda si se modifica
const updateMusician = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Músico no encontrado' });
    }
    const { name, instrument, email, band, active } = req.body;

    if (band) {
      if (!mongoose.Types.ObjectId.isValid(band)) {
        return res.status(400).json({ error: 'El ID de banda no es válido' });
      }
      const bandExists = await Band.findById(band);
      if (!bandExists) {
        return res.status(404).json({ error: 'La banda especificada no existe' });
      }
    }

    const musician = await Musician.findByIdAndUpdate(
      req.params.id,
      { name, instrument, email, band, active },
      { returnDocument: 'after', runValidators: true }
    ).populate('band');

    if (!musician) {
      return res.status(404).json({ error: 'Músico no encontrado' });
    }
    return res.status(200).json(musician);
  } catch (error) {
    next(error);
  }
};

// Elimina un músico de la base de datos por su ID
const deleteMusician = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Músico no encontrado' });
    }
    const musician = await Musician.findByIdAndDelete(req.params.id);
    if (!musician) {
      return res.status(404).json({ error: 'Músico no encontrado' });
    }
    return res.status(200).json({ message: 'Músico eliminado con éxito' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMusician,
  getMusicians,
  getMusicianById,
  updateMusician,
  deleteMusician
};
