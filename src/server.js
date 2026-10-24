require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

// Conectar a la base de datos e iniciar servidor
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`  Cabina API corriendo en el puerto ${PORT}`);
    console.log(`  Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  URL base: http://localhost:${PORT}`);
    console.log(`===============================================`);
  });
});
