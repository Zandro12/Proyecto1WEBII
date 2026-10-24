const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la sala es obligatorio'],
      trim: true,
      minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
      maxlength: [40, 'El nombre no puede exceder 40 caracteres']
    },
    capacity: {
      type: Number,
      required: [true, 'La capacidad es obligatoria'],
      min: [1, 'La capacidad mínima es de 1 persona'],
      max: [30, 'La capacidad máxima es de 30 personas'],
      validate: {
        validator: Number.isInteger,
        message: 'La capacidad debe ser un número entero'
      }
    },
    floor: {
      type: Number,
      required: [true, 'El piso es obligatorio'],
      validate: {
        validator: Number.isInteger,
        message: 'El piso debe ser un número entero'
      }
    },
    hasDrumKit: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: {
        values: ['disponible', 'mantenimiento'],
        message: 'El estado debe ser disponible o mantenimiento'
      },
      default: 'disponible'
    }
  },
  {
    timestamps: true
  }
);

// Índice explícito pedido en el requerimiento
roomSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);
