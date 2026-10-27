const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'La sala es obligatoria']
    },
    band: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Band',
      required: [true, 'La banda es obligatoria']
    },
    date: {
      type: String,
      required: [true, 'La fecha de la reserva es obligatoria'],
      validate: {
        validator: function (v) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
          const [y, m, d] = v.split('-').map(Number);
          const dt = new Date(Date.UTC(y, m - 1, d));
          return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
        },
        message: 'La fecha debe tener formato YYYY-MM-DD y ser una fecha válida en el calendario'
      }
    },
    startHour: {
      type: Number,
      required: [true, 'La hora de inicio es obligatoria'],
      min: [8, 'La hora de inicio debe ser entre 8 y 21'],
      max: [21, 'La hora de inicio debe ser entre 8 y 21'],
      validate: {
        validator: Number.isInteger,
        message: 'La hora de inicio debe ser un número entero'
      }
    },
    endHour: {
      type: Number,
      required: [true, 'La hora de fin es obligatoria'],
      min: [9, 'La hora de fin debe ser entre 9 y 22'],
      max: [22, 'La hora de fin debe ser entre 9 y 22'],
      validate: {
        validator: Number.isInteger,
        message: 'La hora de fin debe ser un número entero'
      }
    },
    status: {
      type: String,
      enum: {
        values: ['apartada', 'confirmada', 'cancelada'],
        message: 'El estado debe ser apartada, confirmada o cancelada'
      },
      default: 'apartada'
    },
    notes: {
      type: String,
      maxlength: [200, 'Las notas no pueden exceder 200 caracteres'],
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual durationHours: endHour - startHour
bookingSchema.virtual('durationHours').get(function () {
  if (this.endHour !== undefined && this.startHour !== undefined) {
    return this.endHour - this.startHour;
  }
  return undefined;
});

// Índice compuesto pedido en el requerimiento para el horario del día
bookingSchema.index({ room: 1, date: 1, startHour: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
