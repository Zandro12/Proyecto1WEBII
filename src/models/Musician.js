const mongoose = require('mongoose');

const musicianSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del músico es obligatorio'],
      trim: true
    },
    instrument: {
      type: String,
      required: [true, 'El instrumento es obligatorio'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Por favor ingrese un correo electrónico válido'
      ]
    },
    band: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Band',
      required: [true, 'La banda es obligatoria']
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Índices explícitos pedidos en el requerimiento
musicianSchema.index({ email: 1 }, { unique: true });
musicianSchema.index({ band: 1 });

module.exports = mongoose.model('Musician', musicianSchema);
