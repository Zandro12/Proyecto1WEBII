const mongoose = require('mongoose');
const Musician = require('../models/Musician');
const Band = require('../models/Band');

// POST /api/musicians
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

// GET /api/musicians
// El listado filtra por band y por active
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

// GET /api/musicians/:id (muestra la banda)
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

// PUT /api/musicians/:id
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

// DELETE /api/musicians/:id
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
