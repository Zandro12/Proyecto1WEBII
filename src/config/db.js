const mongoose = require('mongoose');
const dns = require('dns');

// Configuración de servidores DNS públicos (Google y Cloudflare)
// Necesario en Windows/redes locales donde el resolvedor DNS de ciertos ISPs bloquea consultas SRV de MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('Aviso: No se pudieron configurar servidores DNS públicos:', err.message);
}

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
