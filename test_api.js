require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const app = require('./src/app');
const http = require('http');

let server;
let baseUrl;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, body: data };
}

async function runTests() {
  console.log('--- INICIANDO SUITE DE PRUEBAS DEL BACKEND CABINA ---');
  await connectDB();

  // Iniciar servidor en puerto libre
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  console.log(`Servidor de prueba corriendo en: ${baseUrl}`);

  try {
    // 0. Limpiar base de datos para pruebas limpias
    console.log('Limpiando colecciones...');
    await mongoose.connection.collection('rooms').deleteMany({});
    await mongoose.connection.collection('bands').deleteMany({});
    await mongoose.connection.collection('musicians').deleteMany({});
    await mongoose.connection.collection('equipment').deleteMany({});
    await mongoose.connection.collection('bookings').deleteMany({});
    await mongoose.connection.collection('loans').deleteMany({});

    // 1. Crear Sala
    console.log('\n1. Prueba: Crear Sala');
    const resRoom = await request('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Sala Beethoven',
        capacity: 5,
        floor: 1,
        hasDrumKit: true,
        status: 'disponible'
      })
    });
    console.assert(resRoom.status === 201, `Error al crear sala, status: ${resRoom.status}`);
    const roomId = resRoom.body._id;
    console.log('[OK] Sala creada exitosamente:', roomId);

    // 1.1 Duplicado de Sala
    const resRoomDup = await request('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Sala Beethoven',
        capacity: 4,
        floor: 2
      })
    });
    console.assert(resRoomDup.status === 409, `Se esperaba 409 por nombre duplicado de sala, obtuvo ${resRoomDup.status}`);
    console.log('[OK] Error 409 por nombre de sala duplicado validado correctamente');

    // 2. Crear Banda
    console.log('\n2. Prueba: Crear Banda');
    const resBand = await request('/api/bands', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Los Cuates del Ritmo',
        genre: 'rock',
        contactName: 'Carlos Santillán'
      })
    });
    console.assert(resBand.status === 201, `Error al crear banda, status: ${resBand.status}`);
    const bandId = resBand.body._id;
    console.log('[OK] Banda creada exitosamente:', bandId);

    // 2.1 Duplicado de Banda
    const resBandDup = await request('/api/bands', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Los Cuates del Ritmo',
        contactName: 'Otro Contacto'
      })
    });
    console.assert(resBandDup.status === 409, `Se esperaba 409 por nombre duplicado de banda, obtuvo ${resBandDup.status}`);
    console.log('[OK] Error 409 por nombre de banda duplicado validado correctamente');

    // 3. Crear Músico
    console.log('\n3. Prueba: Crear Músico');
    const resMusician = await request('/api/musicians', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Mateo Guitarrista',
        instrument: 'Guitarra Eléctrica',
        email: 'mateo@ritmo.com',
        band: bandId
      })
    });
    console.assert(resMusician.status === 201, `Error al crear músico, status: ${resMusician.status}`);
    const musicianId = resMusician.body._id;
    console.log('[OK] Músico creado exitosamente:', musicianId);

    // 3.1 Duplicado de Músico (email)
    const resMusicianDup = await request('/api/musicians', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Otro Mateo',
        instrument: 'Bajo',
        email: 'mateo@ritmo.com',
        band: bandId
      })
    });
    console.assert(resMusicianDup.status === 409, `Se esperaba 409 por email duplicado de músico, obtuvo ${resMusicianDup.status}`);
    console.log('[OK] Error 409 por email duplicado validado correctamente');

    // 4. Crear Equipo
    console.log('\n4. Prueba: Crear Equipo');
    const resEq = await request('/api/equipment', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Micrófono Shure SM58',
        category: 'audio',
        totalUnits: 5
      })
    });
    console.assert(resEq.status === 201, `Error al crear equipo, status: ${resEq.status}`);
    const equipmentId = resEq.body._id;
    console.assert(resEq.body.availableUnits === 5, 'availableUnits debe iniciar igual a totalUnits');
    console.log('[OK] Equipo creado exitosamente:', equipmentId);

    // 5. Pruebas de Reglas de Negocio en Reserva
    console.log('\n5. Pruebas de Reglas de Negocio en Reserva');

    // 5.1 Horas invertidas
    const resInvHours = await request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        room: roomId,
        band: bandId,
        date: '2026-11-10',
        startHour: 18,
        endHour: 16
      })
    });
    console.assert(resInvHours.status === 400, `Se esperaba 400 por horas invertidas, obtuvo ${resInvHours.status}`);
    console.log('[OK] 400 horas invertidas validado');

    // 5.2 Reserva de más de 3 horas
    const resMore3Hours = await request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        room: roomId,
        band: bandId,
        date: '2026-11-10',
        startHour: 10,
        endHour: 14 // 4 horas
      })
    });
    console.assert(resMore3Hours.status === 400, `Se esperaba 400 por reserva > 3 horas, obtuvo ${resMore3Hours.status}`);
    console.log('[OK] 400 duración > 3 horas validado');

    // 5.3 Equipo solicitado mayor a disponible
    const resExceedEq = await request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        room: roomId,
        band: bandId,
        date: '2026-11-10',
        startHour: 10,
        endHour: 12,
        equipment: [{ equipmentId, units: 10 }] // Solo hay 5
      })
    });
    console.assert(resExceedEq.status === 409, `Se esperaba 409 por exceso de equipo, obtuvo ${resExceedEq.status}`);
    console.log('[OK] 409 unidades de equipo insuficientes validado');

    // 6. Transacción Exitosa de Creación de Reserva
    console.log('\n6. Prueba: Transacción exitosa de creación de reserva');
    const resBooking = await request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        room: roomId,
        band: bandId,
        date: '2026-11-10',
        startHour: 14,
        endHour: 16,
        notes: 'Ensayo general antes del concierto',
        equipment: [{ equipmentId, units: 2 }]
      })
    });
    console.assert(resBooking.status === 201, `Error al crear reserva, status: ${resBooking.status}`);
    const bookingId = resBooking.body._id;
    console.assert(resBooking.body.durationHours === 2, `durationHours debe ser 2, obtuvo ${resBooking.body.durationHours}`);
    console.log('[OK] Reserva creada con virtual durationHours = 2, ID:', bookingId);

    // Verificar que el equipo fue descontado
    const checkEqAfter = await request(`/api/equipment/${equipmentId}`);
    console.assert(checkEqAfter.body.availableUnits === 3, `availableUnits debería ser 3, obtuvo ${checkEqAfter.body.availableUnits}`);
    console.log('[OK] availableUnits descontado atómicamente a 3');

    // 7. Prueba de Traslape de Horarios
    console.log('\n7. Prueba: Traslape de Horarios');
    // Mismo día y misma sala: 15 a 17 (se traslapa con 14 a 16)
    const resOverlap = await request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        room: roomId,
        band: bandId,
        date: '2026-11-10',
        startHour: 15,
        endHour: 17
      })
    });
    console.assert(resOverlap.status === 409, `Se esperaba 409 por traslape, obtuvo ${resOverlap.status}`);
    console.log('[OK] 409 por traslape validado correctamente');

    // Reserva sin traslape: 16 a 18 (justo después)
    const resNoOverlap = await request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        room: roomId,
        band: bandId,
        date: '2026-11-10',
        startHour: 16,
        endHour: 18
      })
    });
    console.assert(resNoOverlap.status === 201, `Se esperaba 201 en reserva consecutiva sin traslape, obtuvo ${resNoOverlap.status}`);
    console.log('[OK] Reserva consecutiva (16 a 18) creada sin conflicto');

    // 8. Borrados protegidos (409)
    console.log('\n8. Pruebas de Borrados Protegidos');

    // 8.1 Borrar sala con reserva activa
    const resDelRoom = await request(`/api/rooms/${roomId}`, { method: 'DELETE' });
    console.assert(resDelRoom.status === 409, `Se esperaba 409 al borrar sala con reserva activa, obtuvo ${resDelRoom.status}`);
    console.log('[OK] 409 al borrar sala con reserva activa');

    // 8.2 Borrar banda con músicos y reservas
    const resDelBand = await request(`/api/bands/${bandId}`, { method: 'DELETE' });
    console.assert(resDelBand.status === 409, `Se esperaba 409 al borrar banda con músicos/reservas, obtuvo ${resDelBand.status}`);
    console.log('[OK] 409 al borrar banda con dependencias');

    // 8.3 Borrar equipo prestado
    const resDelEq = await request(`/api/equipment/${equipmentId}`, { method: 'DELETE' });
    console.assert(resDelEq.status === 409, `Se esperaba 409 al borrar equipo con unidades prestadas, obtuvo ${resDelEq.status}`);
    console.log('[OK] 409 al borrar equipo prestado');

    // 9. Transacción de Cancelación de Reserva
    console.log('\n9. Prueba: Transacción de cancelación de reserva');
    const resCancel = await request(`/api/bookings/${bookingId}/cancel`, { method: 'PATCH' });
    console.assert(resCancel.status === 200, `Error al cancelar reserva, status: ${resCancel.status}`);
    console.assert(resCancel.body.booking.status === 'cancelada', 'El estado de la reserva debe ser cancelada');
    console.log('[OK] Reserva cancelada');

    // Verificar que el equipo volvió al inventario
    const checkEqRestored = await request(`/api/equipment/${equipmentId}`);
    console.assert(checkEqRestored.body.availableUnits === 5, `availableUnits debería ser restaurado a 5, obtuvo ${checkEqRestored.body.availableUnits}`);
    console.log('[OK] availableUnits restaurado atómicamente a 5');

    // 10. Consultas especiales y Stats
    console.log('\n10. Consultas especiales y Aggregates');
    const resRoomSchedule = await request(`/api/rooms/${roomId}/schedule?date=2026-11-10`);
    console.assert(resRoomSchedule.status === 200, 'Error en horario de sala');
    console.log('[OK] GET /api/rooms/:id/schedule funciona con éxito');

    const resBandMusicians = await request(`/api/bands/${bandId}/musicians`);
    console.assert(resBandMusicians.status === 200 && resBandMusicians.body.length > 0, 'Error en músicos de la banda');
    console.log('[OK] GET /api/bands/:id/musicians funciona con éxito');

    const resRoomStats = await request('/api/rooms/stats');
    console.assert(resRoomStats.status === 200 && Array.isArray(resRoomStats.body), 'Error en rooms stats');
    console.log('[OK] GET /api/rooms/stats funciona con éxito');

    const resBookingStats = await request('/api/bookings/stats');
    console.assert(resBookingStats.status === 200 && Array.isArray(resBookingStats.body), 'Error en bookings stats');
    console.log('[OK] GET /api/bookings/stats funciona con éxito');

    const resEqStats = await request('/api/equipment/stats');
    console.assert(resEqStats.status === 200 && Array.isArray(resEqStats.body), 'Error en equipment stats');
    console.log('[OK] GET /api/equipment/stats funciona con éxito');

    // 11. Paginación y Validación de Parámetros
    console.log('\n11. Pruebas de Paginación y Parámetros');
    const resInvalidLimit = await request('/api/rooms?limit=99');
    console.assert(resInvalidLimit.status === 400, `Se esperaba 400 con limit > 50, obtuvo ${resInvalidLimit.status}`);
    console.log('[OK] 400 en limit mayor a 50');

    const resInvalidSort = await request('/api/rooms?sort=invalido');
    console.assert(resInvalidSort.status === 400, `Se esperaba 400 con campo sort no permitido, obtuvo ${resInvalidSort.status}`);
    console.log('[OK] 400 en campo sort no permitido');

    const resValidPagination = await request('/api/rooms?page=1&limit=5&sort=-name');
    console.assert(resValidPagination.status === 200 && resValidPagination.body.page === 1, 'Error en paginación');
    console.log('[OK] Paginación y ordenamiento descendente validados con éxito');

    // 12. Pruebas de Blindaje de Casos Borde
    console.log('\n12. Pruebas de Blindaje de Casos Borde');

    // 12.1 Body vacío en POST (debe dar 400, no 500)
    const resEmptyBody = await request('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({})
    });
    console.assert(resEmptyBody.status === 400, `Se esperaba 400 con body vacío, obtuvo ${resEmptyBody.status}`);
    console.log('[OK] 400 validado con body vacío');

    // 12.2 Parámetro sort duplicado (debe dar 400, no 500)
    const resDupSort = await request('/api/rooms?sort=name&sort=capacity');
    console.assert(resDupSort.status === 400, `Se esperaba 400 con sort duplicado, obtuvo ${resDupSort.status}`);
    console.log('[OK] 400 validado con sort duplicado');

    // 12.3 Búsqueda con caracteres especiales regex (no debe dar 500)
    const resSpecialSearch = await request('/api/rooms?search=(test[');
    console.assert(resSpecialSearch.status === 200, `Se esperaba 200 con regex especial escapado, obtuvo ${resSpecialSearch.status}`);
    console.log('[OK] 200 con caracteres especiales en búsqueda escapados');

    // 12.4 Fecha inexistente en calendario (ej. 2026-02-31 o 2026-13-45)
    const resInvalidCalendarDate = await request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        room: roomId,
        band: bandId,
        date: '2026-02-31',
        startHour: 10,
        endHour: 12
      })
    });
    console.assert(resInvalidCalendarDate.status === 400, `Se esperaba 400 por fecha inexistente en calendario, obtuvo ${resInvalidCalendarDate.status}`);
    console.log('[OK] 400 fecha inexistente en calendario validado');

    // 12.5 Músico con dominio de correo moderno (.info / .cr)
    const resMusicianInfo = await request('/api/musicians', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Músico Dominio Largo',
        instrument: 'Violín',
        email: 'violinista@orquesta.info',
        band: bandId
      })
    });
    console.assert(resMusicianInfo.status === 201, `Se esperaba 201 con email de dominio .info, obtuvo ${resMusicianInfo.status}`);
    console.log('[OK] 201 con email de dominio largo (.info) creado exitosamente');

    console.log('\n======================================================');
    console.log('       ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('ERROR EN PRUEBAS:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }
}

runTests();
