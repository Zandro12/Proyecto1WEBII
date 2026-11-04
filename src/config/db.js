const mongoose = require('mongoose');
const dns = require('dns');

// Configura servidores DNS públicos para resolver registros SRV de MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('Aviso: No se pudieron configurar servidores DNS públicos:', err.message);
}

// Establece la conexión con MongoDB Atlas usando la URI del entorno
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error de conexión a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
