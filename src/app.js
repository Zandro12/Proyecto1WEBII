const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorHandler');

const roomRoutes = require('./routes/roomRoutes');
const bandRoutes = require('./routes/bandRoutes');
const musicianRoutes = require('./routes/musicianRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const loanRoutes = require('./routes/loanRoutes');

const app = express();

// Middlewares globales
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Ruta de comprobación de salud del servicio
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API Cabina operando correctamente' });
});

// Rutas de la API
app.use('/api/rooms', roomRoutes);
app.use('/api/bands', bandRoutes);
app.use('/api/musicians', musicianRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/loans', loanRoutes);

// Manejo de rutas inexistentes (404)
app.use((req, res) => {
  res.status(404).json({ error: `La ruta '${req.originalUrl}' no existe en este servidor` });
});

// Middleware centralizado de errores
app.use(errorHandler);

module.exports = app;
