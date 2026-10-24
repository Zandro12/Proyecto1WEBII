const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del equipo es obligatorio'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'La categoría del equipo es obligatoria'],
      enum: {
        values: ['audio', 'cuerdas', 'percusion'],
        message: 'La categoría debe ser audio, cuerdas o percusion'
      }
    },
    totalUnits: {
      type: Number,
      required: [true, 'El total de unidades es obligatorio'],
      min: [1, 'El total de unidades debe ser mayor que 0'],
      validate: {
        validator: Number.isInteger,
        message: 'El total de unidades debe ser un número entero'
      }
    },
    availableUnits: {
      type: Number,
      validate: [
        {
          validator: Number.isInteger,
          message: 'Las unidades disponibles deben ser un número entero'
        },
        {
          validator: function (val) {
            // Permite validar que 0 <= availableUnits <= totalUnits
            const total = this.totalUnits !== undefined ? this.totalUnits : this.get('totalUnits');
            return val >= 0 && (total === undefined || val <= total);
          },
          message: 'Las unidades disponibles deben estar entre 0 y el total de unidades'
        }
      ]
    }
  },
  {
    timestamps: true
  }
);

// availableUnits empieza igual a totalUnits si no viene especificado
equipmentSchema.pre('validate', function () {
  if (this.isNew && (this.availableUnits === undefined || this.availableUnits === null)) {
    this.availableUnits = this.totalUnits;
  }
});

// Índice explícito pedido en el requerimiento
equipmentSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Equipment', equipmentSchema);
