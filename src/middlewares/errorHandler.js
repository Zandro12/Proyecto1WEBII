const errorHandler = (err, req, res, next) => {
  // Manejo de JSON mal formado en el body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'JSON mal formado en la petición' });
  }

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join('. ') });
  }

  // Error de clave duplicada en Mongo (E11000) -> 409 Conflict
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'campo';
    const value = err.keyValue ? err.keyValue[field] : '';
    return res.status(409).json({
      error: `Ya existe un registro con el valor '${value}' en el campo '${field}'`
    });
  }

  // Error de casteo de ObjectId (ID inválido) -> 404 Not Found
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(404).json({ error: 'Recurso no encontrado con el identificador proporcionado' });
  }

  // Errores con statusCode explícito
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error('Error no controlado:', err);
  return res.status(500).json({ error: err.message || 'Error interno del servidor' });
};

module.exports = errorHandler;
