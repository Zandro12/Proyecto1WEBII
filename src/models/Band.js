const mongoose = require('mongoose');

const bandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la banda es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [50, 'El nombre no puede exceder 50 caracteres']
    },
    genre: {
      type: String,
      enum: {
        values: ['rock', 'jazz', 'coral', 'otro'],
        message: 'El género debe ser rock, jazz, coral u otro'
      },
      default: 'otro'
    },
    active: {
      type: Boolean,
      default: true
    },
    contactName: {
      type: String,
      required: [true, 'El nombre de contacto es obligatorio'],
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual para poblar los músicos de la banda
bandSchema.virtual('musicians', {
  ref: 'Musician',
  localField: '_id',
  foreignField: 'band'
});

// Índice explícito pedido en el requerimiento
bandSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Band', bandSchema);
