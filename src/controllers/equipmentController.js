const mongoose = require('mongoose');
const Equipment = require('../models/Equipment');

// POST /api/equipment
const createEquipment = async (req, res, next) => {
  try {
    const { name, category, totalUnits } = req.body;
    // availableUnits empieza igual a totalUnits
    const equipment = await Equipment.create({
      name,
      category,
      totalUnits,
      availableUnits: totalUnits
    });
    return res.status(201).json(equipment);
  } catch (error) {
    next(error);
  }
};

// GET /api/equipment
// El listado filtra por category y por disponibles, con available=true cuando availableUnits es mayor que 0
const getEquipment = async (req, res, next) => {
  try {
    const { page, limit, skip, sort, searchFilter } = req.pagination;
    const query = { ...searchFilter };

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.available !== undefined) {
      if (req.query.available === 'true') {
        query.availableUnits = { $gt: 0 };
      } else if (req.query.available === 'false') {
        query.availableUnits = 0;
      }
    }

    const total = await Equipment.countDocuments(query);
    const data = await Equipment.find(query)
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

// GET /api/equipment/stats (Aggregate)
// Devuelve, por categoría, las unidades totales y las disponibles
const getEquipmentStats = async (req, res, next) => {
  try {
    const stats = await Equipment.aggregate([
      {
        $group: {
          _id: '$category',
          totalUnits: { $sum: '$totalUnits' },
          availableUnits: { $sum: '$availableUnits' },
          equipmentCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          totalUnits: 1,
          availableUnits: 1,
          borrowedUnits: { $subtract: ['$totalUnits', '$availableUnits'] },
          equipmentCount: 1
        }
      },
      {
        $sort: { category: 1 }
      }
    ]);

    return res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

// GET /api/equipment/:id
const getEquipmentById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    return res.status(200).json(equipment);
  } catch (error) {
    next(error);
  }
};

// PUT /api/equipment/:id
// Regla: availableUnits no se modifica en un PUT directo al equipo. Cambia solo dentro de las transacciones.
// Un PUT puede cambiar name, category y totalUnits. Si el nuevo totalUnits queda por debajo de las unidades prestadas, responde 409.
const updateEquipment = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    const currentEquipment = await Equipment.findById(req.params.id);
    if (!currentEquipment) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    const { name, category, totalUnits } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;

    if (totalUnits !== undefined) {
      const parsedTotal = Number(totalUnits);
      if (!Number.isInteger(parsedTotal) || parsedTotal <= 0) {
        return res.status(400).json({ error: 'El total de unidades debe ser un número entero mayor que 0' });
      }

      // Unidades prestadas actualmente
      const borrowedUnits = currentEquipment.totalUnits - currentEquipment.availableUnits;
      if (parsedTotal < borrowedUnits) {
        return res.status(409).json({
          error: `No se puede reducir el total de unidades a ${parsedTotal} porque actualmente hay ${borrowedUnits} unidades prestadas`
        });
      }

      updateData.totalUnits = parsedTotal;
      // Ajustamos las disponibles según el nuevo total manteniendo la cantidad prestada intacta
      updateData.availableUnits = parsedTotal - borrowedUnits;
    }

    const updated = await Equipment.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    );

    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/equipment/:id
// Regla: Borrar un equipo con availableUnits menor que totalUnits responde 409
const deleteEquipment = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    if (equipment.availableUnits < equipment.totalUnits) {
      return res.status(409).json({
        error: 'No se puede eliminar el equipo porque tiene unidades actualmente prestadas'
      });
    }

    await Equipment.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Equipo eliminado con éxito' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEquipment,
  getEquipment,
  getEquipmentStats,
  getEquipmentById,
  updateEquipment,
  deleteEquipment
};
