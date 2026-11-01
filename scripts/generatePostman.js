require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const app = require('../src/app');

const Room = require('../src/models/Room');
const Band = require('../src/models/Band');
const Musician = require('../src/models/Musician');
const Equipment = require('../src/models/Equipment');
const Booking = require('../src/models/Booking');
const Loan = require('../src/models/Loan');

const postmanDir = path.join(__dirname, '..', 'postman');
if (!fs.existsSync(postmanDir)) {
  fs.mkdirSync(postmanDir, { recursive: true });
}

// Helper para construir estructura de request de Postman
function createRequest({ name, method, path: reqPath, query = [], body = null, description = '', tests = [], expectedStatus = 200 }) {
  const urlPath = reqPath.split('/').filter(Boolean);
  const rawUrl = `{{baseUrl}}/${urlPath.join('/')}${query.length > 0 ? '?' + query.map(q => `${q.key}=${q.value}`).join('&') : ''}`;

  const defaultTests = tests.length > 0 ? tests : [
    `pm.test('Status code es ${expectedStatus}', function () {`,
    `    pm.response.to.have.status(${expectedStatus});`,
    `});`,
    `pm.test('Respuesta en formato JSON', function () {`,
    `    pm.response.to.be.json;`,
    `});`
  ];

  const reqItem = {
    name,
    request: {
      method,
      header: [
        { key: "Content-Type", value: "application/json", type: "text" }
      ],
      url: {
        raw: rawUrl,
        host: ["{{baseUrl}}"],
        path: urlPath,
        query: query.length > 0 ? query.map(q => ({ key: q.key, value: q.value })) : undefined
      },
      description
    },
    event: [
      {
        listen: "test",
        script: {
          type: "text/javascript",
          exec: defaultTests
        }
      }
    ],
    response: [],
    _expectedStatus: expectedStatus
  };

  if (body) {
    reqItem.request.body = {
      mode: "raw",
      raw: JSON.stringify(body, null, 2),
      options: { raw: { language: "json" } }
    };
  }

  return reqItem;
}

function buildCollectionTemplate() {
  return {
    info: {
      _postman_id: "cabina-collection-001",
      name: "Cabina",
      description: "Cabina es la API REST para la gestión del centro cultural: salas de ensayo, bandas, músicos, reservas y préstamo de equipo.\n\nOrden sugerido de ejecución de carpetas:\n1. salas\n2. bandas\n3. músicos\n4. equipo\n5. reservas\n6. consultas\n7. errores",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: [
      // ---------------------------------------------------------
      // 1. SALAS
      // ---------------------------------------------------------
      {
        name: "1. Salas",
        item: [
          createRequest({
            name: "Crear Sala",
            method: "POST",
            path: "/api/rooms",
            expectedStatus: 201,
            body: {
              name: "Sala Principal Apolo",
              capacity: 10,
              floor: 1,
              hasDrumKit: true,
              status: "disponible"
            },
            description: "Crea una nueva sala de ensayo. Status esperado: 201 Created. Guarda el ID en la variable roomId.",
            tests: [
              "pm.test('Status code es 201', function () {",
              "    pm.response.to.have.status(201);",
              "});",
              "var jsonData = pm.response.json();",
              "if (jsonData._id) {",
              "    pm.environment.set('roomId', jsonData._id);",
              "}"
            ]
          }),
          createRequest({
            name: "Listar Salas",
            method: "GET",
            path: "/api/rooms",
            expectedStatus: 200,
            description: "Lista las salas con paginación y ordenamiento por defecto. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Obtener Sala por ID",
            method: "GET",
            path: "/api/rooms/{{roomId}}",
            expectedStatus: 200,
            description: "Retorna el detalle de la sala especificada. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Actualizar Sala",
            method: "PUT",
            path: "/api/rooms/{{roomId}}",
            expectedStatus: 200,
            body: {
              name: "Sala Principal Apolo Actualizada",
              capacity: 12,
              floor: 1,
              hasDrumKit: true,
              status: "disponible"
            },
            description: "Actualiza los datos de una sala. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Horario de la Sala (Schedule)",
            method: "GET",
            path: "/api/rooms/{{roomId}}/schedule",
            query: [{ key: "date", value: "2026-11-15" }],
            expectedStatus: 200,
            description: "Devuelve las reservas de ese día ordenadas por startHour con la banda poblada. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Estadísticas de Salas",
            method: "GET",
            path: "/api/rooms/stats",
            expectedStatus: 200,
            description: "Devuelve por cada sala cuántas reservas activas (apartadas o confirmadas) tiene. Status esperado: 200 OK."
          })
        ]
      },

      // ---------------------------------------------------------
      // 2. BANDAS
      // ---------------------------------------------------------
      {
        name: "2. Bandas",
        item: [
          createRequest({
            name: "Crear Banda",
            method: "POST",
            path: "/api/bands",
            expectedStatus: 201,
            body: {
              name: "Los Ecos del Barrio",
              genre: "rock",
              active: true,
              contactName: "Roberto Gómez"
            },
            description: "Crea una nueva banda. Status esperado: 201 Created. Guarda el ID en la variable bandId.",
            tests: [
              "pm.test('Status code es 201', function () {",
              "    pm.response.to.have.status(201);",
              "});",
              "var jsonData = pm.response.json();",
              "if (jsonData._id) {",
              "    pm.environment.set('bandId', jsonData._id);",
              "}"
            ]
          }),
          createRequest({
            name: "Listar Bandas",
            method: "GET",
            path: "/api/bands",
            expectedStatus: 200,
            description: "Lista las bandas con paginación. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Obtener Banda por ID",
            method: "GET",
            path: "/api/bands/{{bandId}}",
            expectedStatus: 200,
            description: "Obtiene el detalle de la banda con sus músicos poblados con populate. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Actualizar Banda",
            method: "PUT",
            path: "/api/bands/{{bandId}}",
            expectedStatus: 200,
            body: {
              name: "Los Ecos del Barrio Oficial",
              genre: "rock",
              active: true,
              contactName: "Roberto Gómez Bolaños"
            },
            description: "Actualiza los datos de la banda. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Músicos de la Banda",
            method: "GET",
            path: "/api/bands/{{bandId}}/musicians",
            expectedStatus: 200,
            description: "Devuelve el listado de músicos asociados a esta banda. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Reservas de la Banda",
            method: "GET",
            path: "/api/bands/{{bandId}}/bookings",
            expectedStatus: 200,
            description: "Devuelve las reservas de la banda con la sala poblada. Status esperado: 200 OK."
          })
        ]
      },

      // ---------------------------------------------------------
      // 3. MÚSICOS
      // ---------------------------------------------------------
      {
        name: "3. Músicos",
        item: [
          createRequest({
            name: "Crear Músico",
            method: "POST",
            path: "/api/musicians",
            expectedStatus: 201,
            body: {
              name: "Federico Baterista",
              instrument: "Batería",
              email: "federico@ecos.com",
              band: "{{bandId}}",
              active: true
            },
            description: "Crea un músico asignado a una banda. Status esperado: 201 Created. Guarda musicianId.",
            tests: [
              "pm.test('Status code es 201', function () {",
              "    pm.response.to.have.status(201);",
              "});",
              "var jsonData = pm.response.json();",
              "if (jsonData._id) {",
              "    pm.environment.set('musicianId', jsonData._id);",
              "}"
            ]
          }),
          createRequest({
            name: "Listar Músicos (Filtros band y active)",
            method: "GET",
            path: "/api/musicians",
            query: [
              { key: "band", value: "{{bandId}}" },
              { key: "active", value: "true" }
            ],
            expectedStatus: 200,
            description: "Lista músicos con filtrado por banda y estado activo. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Obtener Músico por ID",
            method: "GET",
            path: "/api/musicians/{{musicianId}}",
            expectedStatus: 200,
            description: "Detalle del músico mostrando su banda. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Actualizar Músico",
            method: "PUT",
            path: "/api/musicians/{{musicianId}}",
            expectedStatus: 200,
            body: {
              name: "Federico Percusionista",
              instrument: "Batería y Percusión Menor",
              email: "federico@ecos.com",
              band: "{{bandId}}",
              active: true
            },
            description: "Actualiza los datos de un músico. Status esperado: 200 OK."
          })
        ]
      },

      // ---------------------------------------------------------
      // 4. EQUIPO
      // ---------------------------------------------------------
      {
        name: "4. Equipo",
        item: [
          createRequest({
            name: "Crear Equipo",
            method: "POST",
            path: "/api/equipment",
            expectedStatus: 201,
            body: {
              name: "Amplificador Marshall 50W",
              category: "cuerdas",
              totalUnits: 4
            },
            description: "Crea equipo de inventario. availableUnits inicia igual a totalUnits. Status esperado: 201 Created. Guarda equipmentId.",
            tests: [
              "pm.test('Status code es 201', function () {",
              "    pm.response.to.have.status(201);",
              "});",
              "var jsonData = pm.response.json();",
              "if (jsonData._id) {",
              "    pm.environment.set('equipmentId', jsonData._id);",
              "}"
            ]
          }),
          createRequest({
            name: "Listar Equipo (Filtros category y available)",
            method: "GET",
            path: "/api/equipment",
            query: [
              { key: "category", value: "cuerdas" },
              { key: "available", value: "true" }
            ],
            expectedStatus: 200,
            description: "Lista el inventario de equipo disponible. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Obtener Equipo por ID",
            method: "GET",
            path: "/api/equipment/{{equipmentId}}",
            expectedStatus: 200,
            description: "Detalle de un equipo de inventario. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Actualizar Equipo",
            method: "PUT",
            path: "/api/equipment/{{equipmentId}}",
            expectedStatus: 200,
            body: {
              name: "Amplificador Marshall Valve 50W",
              category: "cuerdas",
              totalUnits: 6
            },
            description: "Actualiza totalUnits (sin modificar directamente availableUnits). Status esperado: 200 OK."
          }),
          createRequest({
            name: "Estadísticas de Equipo",
            method: "GET",
            path: "/api/equipment/stats",
            expectedStatus: 200,
            description: "Devuelve por categoría las unidades totales y disponibles usando Aggregate. Status esperado: 200 OK."
          })
        ]
      },

      // ---------------------------------------------------------
      // 5. RESERVAS Y PRÉSTAMOS
      // ---------------------------------------------------------
      {
        name: "5. Reservas",
        item: [
          createRequest({
            name: "Crear Reserva con Préstamo (Transacción)",
            method: "POST",
            path: "/api/bookings",
            expectedStatus: 201,
            body: {
              room: "{{roomId}}",
              band: "{{bandId}}",
              date: "2026-11-15",
              startHour: 15,
              endHour: 17,
              notes: "Ensayo previo a presentación",
              equipment: [
                {
                  equipmentId: "{{equipmentId}}",
                  units: 2
                }
              ]
            },
            description: "Crea una reserva y préstamos en una transacción multi-colección atómica con $inc. Status esperado: 201 Created. Guarda bookingId y loanId.",
            tests: [
              "pm.test('Status code es 201', function () {",
              "    pm.response.to.have.status(201);",
              "});",
              "var jsonData = pm.response.json();",
              "if (jsonData._id) {",
              "    pm.environment.set('bookingId', jsonData._id);",
              "}",
              "if (jsonData.loans && jsonData.loans.length > 0) {",
              "    pm.environment.set('loanId', jsonData.loans[0]._id);",
              "}"
            ]
          }),
          createRequest({
            name: "Listar Reservas (Filtros status, room, band)",
            method: "GET",
            path: "/api/bookings",
            query: [
              { key: "status", value: "apartada" },
              { key: "room", value: "{{roomId}}" }
            ],
            expectedStatus: 200,
            description: "Lista reservas con filtros aplicados. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Obtener Reserva por ID",
            method: "GET",
            path: "/api/bookings/{{bookingId}}",
            expectedStatus: 200,
            description: "Detalle completo con sala, banda con músicos activos y préstamos con equipo. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Actualizar Reserva (Confirmar)",
            method: "PUT",
            path: "/api/bookings/{{bookingId}}",
            expectedStatus: 200,
            body: {
              status: "confirmada"
            },
            description: "Cambia el estado de apartada a confirmada (no mueve inventario). Status esperado: 200 OK."
          }),
          createRequest({
            name: "Estadísticas de Reservas",
            method: "GET",
            path: "/api/bookings/stats",
            expectedStatus: 200,
            description: "Cuenta reservas agrupadas por estado con Aggregate. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Listar Préstamos",
            method: "GET",
            path: "/api/loans",
            expectedStatus: 200,
            description: "Lista préstamos con reservas y equipos poblados. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Obtener Préstamo por ID",
            method: "GET",
            path: "/api/loans/{{loanId}}",
            expectedStatus: 200,
            description: "Detalle del préstamo con su reserva y equipo poblados. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Cancelar Reserva (Transacción)",
            method: "PATCH",
            path: "/api/bookings/{{bookingId}}/cancel",
            expectedStatus: 200,
            description: "Cancela la reserva, marca préstamos como devuelto y reintegra el inventario con $inc. Status esperado: 200 OK.",
            tests: [
              "pm.test('Status code es 200', function () {",
              "    pm.response.to.have.status(200);",
              "});",
              "var jsonData = pm.response.json();",
              "pm.expect(jsonData.booking.status).to.eql('cancelada');"
            ]
          })
        ]
      },

      // ---------------------------------------------------------
      // 6. CONSULTAS (Los 42 requests)
      // ---------------------------------------------------------
      {
        name: "6. Consultas",
        item: [
          // Salas
          createRequest({
            name: "Salas - Página 1",
            method: "GET",
            path: "/api/rooms",
            query: [{ key: "page", value: "1" }, { key: "limit", value: "2" }],
            description: "Listado de salas en página 1 con limit=2. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Salas - Página 2",
            method: "GET",
            path: "/api/rooms",
            query: [{ key: "page", value: "2" }, { key: "limit", value: "2" }],
            description: "Listado de salas en página 2 con limit=2. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Salas - Orden Ascendente por Capacidad",
            method: "GET",
            path: "/api/rooms",
            query: [{ key: "sort", value: "capacity" }],
            description: "Listado de salas ordenadas ascendentemente por capacity. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Salas - Orden Descendente por Nombre",
            method: "GET",
            path: "/api/rooms",
            query: [{ key: "sort", value: "-name" }],
            description: "Listado de salas ordenadas descendentemente por nombre. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Salas - Búsqueda con Resultados",
            method: "GET",
            path: "/api/rooms",
            query: [{ key: "search", value: "Principal" }],
            description: "Búsqueda de salas que coinciden con el término. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Salas - Búsqueda sin Resultados",
            method: "GET",
            path: "/api/rooms",
            query: [{ key: "search", value: "TextoQueNoExiste999" }],
            description: "Búsqueda de salas sin coincidencias. Status esperado: 200 OK (data vacía)."
          }),

          // Bandas
          createRequest({
            name: "Bandas - Página 1",
            method: "GET",
            path: "/api/bands",
            query: [{ key: "page", value: "1" }, { key: "limit", value: "2" }],
            description: "Listado de bandas en página 1 con limit=2. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Bandas - Página 2",
            method: "GET",
            path: "/api/bands",
            query: [{ key: "page", value: "2" }, { key: "limit", value: "2" }],
            description: "Listado de bandas en página 2 con limit=2. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Bandas - Orden Ascendente por Nombre",
            method: "GET",
            path: "/api/bands",
            query: [{ key: "sort", value: "name" }],
            description: "Listado de bandas ordenadas por nombre. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Bandas - Orden Descendente por Fecha Creación",
            method: "GET",
            path: "/api/bands",
            query: [{ key: "sort", value: "-createdAt" }],
            description: "Listado de bandas ordenadas por createdAt descendente. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Bandas - Búsqueda con Resultados",
            method: "GET",
            path: "/api/bands",
            query: [{ key: "search", value: "Ecos" }],
            description: "Búsqueda de bandas por nombre con resultados. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Bandas - Búsqueda sin Resultados",
            method: "GET",
            path: "/api/bands",
            query: [{ key: "search", value: "InexistenteBandaZ" }],
            description: "Búsqueda de bandas por nombre sin resultados. Status esperado: 200 OK."
          }),

          // Músicos
          createRequest({
            name: "Músicos - Página 1",
            method: "GET",
            path: "/api/musicians",
            query: [{ key: "page", value: "1" }, { key: "limit", value: "2" }],
            description: "Listado de músicos en página 1. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Músicos - Página 2",
            method: "GET",
            path: "/api/musicians",
            query: [{ key: "page", value: "2" }, { key: "limit", value: "2" }],
            description: "Listado de músicos en página 2. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Músicos - Orden Ascendente por Instrumento",
            method: "GET",
            path: "/api/musicians",
            query: [{ key: "sort", value: "instrument" }],
            description: "Listado de músicos ordenados por instrumento. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Músicos - Orden Descendente por Nombre",
            method: "GET",
            path: "/api/musicians",
            query: [{ key: "sort", value: "-name" }],
            description: "Listado de músicos ordenados por nombre descendente. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Músicos - Búsqueda con Resultados (nombre o email)",
            method: "GET",
            path: "/api/musicians",
            query: [{ key: "search", value: "ecos.com" }],
            description: "Búsqueda de músicos que coincidan por nombre o email. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Músicos - Búsqueda sin Resultados",
            method: "GET",
            path: "/api/musicians",
            query: [{ key: "search", value: "no_existe_musico@correo.com" }],
            description: "Búsqueda de músicos sin resultados. Status esperado: 200 OK."
          }),

          // Equipo
          createRequest({
            name: "Equipo - Página 1",
            method: "GET",
            path: "/api/equipment",
            query: [{ key: "page", value: "1" }, { key: "limit", value: "2" }],
            description: "Listado de equipo en página 1. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Equipo - Página 2",
            method: "GET",
            path: "/api/equipment",
            query: [{ key: "page", value: "2" }, { key: "limit", value: "2" }],
            description: "Listado de equipo en página 2. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Equipo - Orden Ascendente por Disponibles",
            method: "GET",
            path: "/api/equipment",
            query: [{ key: "sort", value: "availableUnits" }],
            description: "Listado de equipo ordenado por unidades disponibles. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Equipo - Orden Descendente por Nombre",
            method: "GET",
            path: "/api/equipment",
            query: [{ key: "sort", value: "-name" }],
            description: "Listado de equipo ordenado por nombre descendente. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Equipo - Búsqueda con Resultados",
            method: "GET",
            path: "/api/equipment",
            query: [{ key: "search", value: "Marshall" }],
            description: "Búsqueda de equipo por nombre con resultados. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Equipo - Búsqueda sin Resultados",
            method: "GET",
            path: "/api/equipment",
            query: [{ key: "search", value: "EquipoFantasmaXYZ" }],
            description: "Búsqueda de equipo por nombre sin resultados. Status esperado: 200 OK."
          }),

          // Reservas
          createRequest({
            name: "Reservas - Página 1",
            method: "GET",
            path: "/api/bookings",
            query: [{ key: "page", value: "1" }, { key: "limit", value: "2" }],
            description: "Listado de reservas en página 1. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Reservas - Página 2",
            method: "GET",
            path: "/api/bookings",
            query: [{ key: "page", value: "2" }, { key: "limit", value: "2" }],
            description: "Listado de reservas en página 2. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Reservas - Orden Ascendente por Fecha y Hora",
            method: "GET",
            path: "/api/bookings",
            query: [{ key: "sort", value: "date" }],
            description: "Listado de reservas ordenadas por fecha. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Reservas - Orden Descendente por Hora de Inicio",
            method: "GET",
            path: "/api/bookings",
            query: [{ key: "sort", value: "-startHour" }],
            description: "Listado de reservas ordenadas por hora de inicio descendente. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Reservas - Búsqueda con Resultados por Notas",
            method: "GET",
            path: "/api/bookings",
            query: [{ key: "search", value: "Ensayo" }],
            description: "Búsqueda de reservas por contenido en notes. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Reservas - Búsqueda sin Resultados",
            method: "GET",
            path: "/api/bookings",
            query: [{ key: "search", value: "NotaQueNoExisteJamas" }],
            description: "Búsqueda de reservas por notes sin resultados. Status esperado: 200 OK."
          }),

          // Préstamos
          createRequest({
            name: "Préstamos - Página 1",
            method: "GET",
            path: "/api/loans",
            query: [{ key: "page", value: "1" }, { key: "limit", value: "2" }],
            description: "Listado de préstamos en página 1. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Préstamos - Página 2",
            method: "GET",
            path: "/api/loans",
            query: [{ key: "page", value: "2" }, { key: "limit", value: "2" }],
            description: "Listado de préstamos en página 2. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Préstamos - Orden Ascendente por Unidades",
            method: "GET",
            path: "/api/loans",
            query: [{ key: "sort", value: "units" }],
            description: "Listado de préstamos ordenados por unidades. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Préstamos - Orden Descendente por Fecha de Creación",
            method: "GET",
            path: "/api/loans",
            query: [{ key: "sort", value: "-createdAt" }],
            description: "Listado de préstamos ordenados por createdAt descendente. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Préstamos - Búsqueda con Resultados por Estado",
            method: "GET",
            path: "/api/loans",
            query: [{ key: "search", value: "devuelto" }],
            description: "Búsqueda de préstamos por estado con resultados. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Préstamos - Búsqueda sin Resultados",
            method: "GET",
            path: "/api/loans",
            query: [{ key: "search", value: "EstadoFalso" }],
            description: "Búsqueda de préstamos por estado sin resultados. Status esperado: 200 OK."
          }),

          // Vistas específicas y Stats
          createRequest({
            name: "Horario de una Sala",
            method: "GET",
            path: "/api/rooms/{{roomId}}/schedule",
            query: [{ key: "date", value: "2026-11-15" }],
            description: "Devuelve las reservas de ese día ordenadas por startHour, con la banda poblada. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Músicos de una Banda",
            method: "GET",
            path: "/api/bands/{{bandId}}/musicians",
            description: "Devuelve los músicos pertenecientes a la banda. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Reservas de una Banda",
            method: "GET",
            path: "/api/bands/{{bandId}}/bookings",
            description: "Devuelve las reservas de la banda con sala poblada. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Stats - Reservas por Estado",
            method: "GET",
            path: "/api/bookings/stats",
            description: "Aggregate de conteo de reservas por estado. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Stats - Reservas Activas por Sala",
            method: "GET",
            path: "/api/rooms/stats",
            description: "Aggregate de reservas activas por cada sala. Status esperado: 200 OK."
          }),
          createRequest({
            name: "Stats - Unidades de Equipo por Categoría",
            method: "GET",
            path: "/api/equipment/stats",
            description: "Aggregate de unidades totales y disponibles por categoría. Status esperado: 200 OK."
          })
        ]
      },

      // ---------------------------------------------------------
      // 7. ERRORES (5 Requests de Preparación + 13 Requests de Error)
      // ---------------------------------------------------------
      {
        name: "7. Errores",
        item: [
          // 5 Requests de Preparación para que cada caso de error falle exactamente por la razón esperada
          createRequest({
            name: "Preparación - Crear Sala en Mantenimiento",
            method: "POST",
            path: "/api/rooms",
            expectedStatus: 201,
            body: {
              name: "Sala En Mantenimiento",
              capacity: 5,
              floor: 2,
              hasDrumKit: false,
              status: "mantenimiento"
            },
            description: "Crea una sala en estado 'mantenimiento' para probar el bloqueo de reservas en salas no disponibles. Status esperado: 201 Created.",
            tests: [
              "pm.test('Status code es 201', function () {",
              "    pm.response.to.have.status(201);",
              "});",
              "var jsonData = pm.response.json();",
              "if (jsonData._id) {",
              "    pm.environment.set('maintenanceRoomId', jsonData._id);",
              "}"
            ]
          }),
          createRequest({
            name: "Preparación - Crear Sala de Capacidad 1",
            method: "POST",
            path: "/api/rooms",
            expectedStatus: 201,
            body: {
              name: "Cabina Individual",
              capacity: 1,
              floor: 2,
              hasDrumKit: false,
              status: "disponible"
            },
            description: "Crea una sala con capacidad para 1 sola persona para probar el error de sobrecupo. Status esperado: 201 Created.",
            tests: [
              "pm.test('Status code es 201', function () {",
              "    pm.response.to.have.status(201);",
              "});",
              "var jsonData = pm.response.json();",
              "if (jsonData._id) {",
              "    pm.environment.set('smallRoomId', jsonData._id);",
              "}"
            ]
          }),
          createRequest({
            name: "Preparación - Agregar Segundo Músico a la Banda",
            method: "POST",
            path: "/api/musicians",
            expectedStatus: 201,
            body: {
              name: "Laura Bajista",
              instrument: "Bajo Eléctrico",
              email: "laura@ecos.com",
              band: "{{bandId}}",
              active: true
            },
            description: "Agrega un segundo músico activo a la banda principal para que supere la capacidad de la Cabina Individual (capacidad 1). Status esperado: 201 Created.",
            tests: [
              "pm.test('Status code es 201', function () {",
              "    pm.response.to.have.status(201);",
              "});"
            ]
          }),
          createRequest({
            name: "Preparación - Crear Banda Inactiva",
            method: "POST",
            path: "/api/bands",
            expectedStatus: 201,
            body: {
              name: "Banda En Pausa",
              genre: "jazz",
              active: false,
              contactName: "Pedro Pausa"
            },
            description: "Crea una banda con active=false para probar el rechazo de reservas de bandas inactivas. Status esperado: 201 Created.",
            tests: [
              "pm.test('Status code es 201', function () {",
              "    pm.response.to.have.status(201);",
              "});",
              "var jsonData = pm.response.json();",
              "if (jsonData._id) {",
              "    pm.environment.set('inactiveBandId', jsonData._id);",
              "}"
            ]
          }),
          createRequest({
            name: "Preparación - Crear Reserva Activa con Equipo Prestado",
            method: "POST",
            path: "/api/bookings",
            expectedStatus: 201,
            body: {
              room: "{{roomId}}",
              band: "{{bandId}}",
              date: "2026-11-18",
              startHour: 15,
              endHour: 17,
              notes: "Reserva activa para pruebas de traslape y borrados protegidos",
              equipment: [
                {
                  equipmentId: "{{equipmentId}}",
                  units: 2
                }
              ]
            },
            description: "Crea una reserva activa con equipo prestado para probar traslape de horario, borrado de sala con reserva activa y borrado de equipo prestado. Status esperado: 201 Created.",
            tests: [
              "pm.test('Status code es 201', function () {",
              "    pm.response.to.have.status(201);",
              "});",
              "var jsonData = pm.response.json();",
              "if (jsonData._id) {",
              "    pm.environment.set('activeBookingId', jsonData._id);",
              "}"
            ]
          }),

          // 13 Requests de Error con código único y validación del mensaje real de la API
          createRequest({
            name: "Error - Nombre de Sala Repetido (409)",
            method: "POST",
            path: "/api/rooms",
            expectedStatus: 409,
            body: {
              name: "Sala Principal Apolo Actualizada",
              capacity: 8,
              floor: 2
            },
            description: "Intento de crear una sala con nombre ya existente. Status esperado: 409 Conflict.",
            tests: [
              "pm.test('Status code es 409', function () {",
              "    pm.response.to.have.status(409);",
              "});",
              "pm.test('Mensaje indica registro duplicado en campo name', function () {",
              "    pm.expect(pm.response.json().error).to.include('Ya existe un registro');",
              "});"
            ]
          }),
          createRequest({
            name: "Error - Email de Músico Repetido (409)",
            method: "POST",
            path: "/api/musicians",
            expectedStatus: 409,
            body: {
              name: "Otro Músico",
              instrument: "Bajo",
              email: "federico@ecos.com",
              band: "{{bandId}}"
            },
            description: "Intento de registrar músico con email ya existente. Status esperado: 409 Conflict.",
            tests: [
              "pm.test('Status code es 409', function () {",
              "    pm.response.to.have.status(409);",
              "});",
              "pm.test('Mensaje indica email duplicado', function () {",
              "    pm.expect(pm.response.json().error).to.include('federico@ecos.com');",
              "});"
            ]
          }),
          createRequest({
            name: "Error - Horas Invertidas en Reserva (400)",
            method: "POST",
            path: "/api/bookings",
            expectedStatus: 400,
            body: {
              room: "{{roomId}}",
              band: "{{bandId}}",
              date: "2026-11-20",
              startHour: 18,
              endHour: 15
            },
            description: "startHour es mayor o igual a endHour. Status esperado: 400 Bad Request.",
            tests: [
              "pm.test('Status code es 400', function () {",
              "    pm.response.to.have.status(400);",
              "});",
              "pm.test('Mensaje indica que hora de fin debe ser mayor', function () {",
              "    pm.expect(pm.response.json().error).to.include('mayor que la hora de inicio');",
              "});"
            ]
          }),
          createRequest({
            name: "Error - Reserva de Más de 3 Horas (400)",
            method: "POST",
            path: "/api/bookings",
            expectedStatus: 400,
            body: {
              room: "{{roomId}}",
              band: "{{bandId}}",
              date: "2026-11-20",
              startHour: 10,
              endHour: 15
            },
            description: "Duración de 5 horas excede el límite máximo de 3 horas. Status esperado: 400 Bad Request.",
            tests: [
              "pm.test('Status code es 400', function () {",
              "    pm.response.to.have.status(400);",
              "});",
              "pm.test('Mensaje indica máximo 3 horas', function () {",
              "    pm.expect(pm.response.json().error).to.include('máximo 3 horas');",
              "});"
            ]
          }),
          createRequest({
            name: "Error - Sala en Mantenimiento (409)",
            method: "POST",
            path: "/api/bookings",
            expectedStatus: 409,
            body: {
              room: "{{maintenanceRoomId}}",
              band: "{{bandId}}",
              date: "2026-11-20",
              startHour: 10,
              endHour: 12
            },
            description: "Intento de apartar una sala cuando su estado es 'mantenimiento'. Status esperado: 409 Conflict.",
            tests: [
              "pm.test('Status code es 409', function () {",
              "    pm.response.to.have.status(409);",
              "});",
              "pm.test('Mensaje indica que la sala está en mantenimiento', function () {",
              "    pm.expect(pm.response.json().error).to.include('mantenimiento');",
              "});"
            ]
          }),
          createRequest({
            name: "Error - Banda Inactiva (409)",
            method: "POST",
            path: "/api/bookings",
            expectedStatus: 409,
            body: {
              room: "{{roomId}}",
              band: "{{inactiveBandId}}",
              date: "2026-11-20",
              startHour: 10,
              endHour: 12
            },
            description: "Intento de reservar con una banda inactiva (active: false). Status esperado: 409 Conflict.",
            tests: [
              "pm.test('Status code es 409', function () {",
              "    pm.response.to.have.status(409);",
              "});",
              "pm.test('Mensaje indica que la banda no está activa', function () {",
              "    pm.expect(pm.response.json().error).to.include('La banda no está activa');",
              "});"
            ]
          }),
          createRequest({
            name: "Error - Banda que no Cabe en la Sala (409)",
            method: "POST",
            path: "/api/bookings",
            expectedStatus: 409,
            body: {
              room: "{{smallRoomId}}",
              band: "{{bandId}}",
              date: "2026-11-20",
              startHour: 10,
              endHour: 12
            },
            description: "La cantidad de músicos activos de la banda (2) supera la capacidad de la sala (1). Status esperado: 409 Conflict.",
            tests: [
              "pm.test('Status code es 409', function () {",
              "    pm.response.to.have.status(409);",
              "});",
              "pm.test('Mensaje indica que los músicos exceden la capacidad', function () {",
              "    pm.expect(pm.response.json().error).to.include('exceden la capacidad de la sala');",
              "});"
            ]
          }),
          createRequest({
            name: "Error - Traslape de Horario (409)",
            method: "POST",
            path: "/api/bookings",
            expectedStatus: 409,
            body: {
              room: "{{roomId}}",
              band: "{{bandId}}",
              date: "2026-11-18",
              startHour: 16,
              endHour: 18
            },
            description: "La reserva (16 a 18) se cruza con la reserva activa creada en Preparación (15 a 17) en la misma sala y fecha (2026-11-18). Status esperado: 409 Conflict.",
            tests: [
              "pm.test('Status code es 409', function () {",
              "    pm.response.to.have.status(409);",
              "});",
              "pm.test('Mensaje indica traslape de horario', function () {",
              "    pm.expect(pm.response.json().error).to.include('traslape de horario');",
              "});"
            ]
          }),
          createRequest({
            name: "Error - Equipo de Más de lo Disponible (409)",
            method: "POST",
            path: "/api/bookings",
            expectedStatus: 409,
            body: {
              room: "{{roomId}}",
              band: "{{bandId}}",
              date: "2026-11-22",
              startHour: 10,
              endHour: 12,
              equipment: [
                {
                  equipmentId: "{{equipmentId}}",
                  units: 999
                }
              ]
            },
            description: "Se solicitan más unidades de las disponibles en el inventario. Status esperado: 409 Conflict.",
            tests: [
              "pm.test('Status code es 409', function () {",
              "    pm.response.to.have.status(409);",
              "});",
              "pm.test('Mensaje indica unidades insuficientes', function () {",
              "    pm.expect(pm.response.json().error).to.include('Unidades insuficientes');",
              "});"
            ]
          }),
          createRequest({
            name: "Error - Cambio de Estado No Permitido (409)",
            method: "PUT",
            path: "/api/bookings/{{bookingId}}",
            expectedStatus: 409,
            body: {
              status: "apartada"
            },
            description: "Intento de modificar o reactivar una reserva que ya se encuentra en estado 'cancelada'. Status esperado: 409 Conflict.",
            tests: [
              "pm.test('Status code es 409', function () {",
              "    pm.response.to.have.status(409);",
              "});",
              "pm.test('Mensaje indica que una reserva cancelada no puede modificarse', function () {",
              "    pm.expect(pm.response.json().error).to.include('cancelada no puede ser modificada');",
              "});"
            ]
          }),
          createRequest({
            name: "Error - Borrado de Sala con Reserva Activa (409)",
            method: "DELETE",
            path: "/api/rooms/{{roomId}}",
            expectedStatus: 409,
            description: "Intento de borrar una sala que tiene reservas activas (creada en Preparación). Status esperado: 409 Conflict.",
            tests: [
              "pm.test('Status code es 409', function () {",
              "    pm.response.to.have.status(409);",
              "});",
              "pm.test('Mensaje indica que la sala tiene reservas activas', function () {",
              "    pm.expect(pm.response.json().error).to.include('tiene reservas activas');",
              "});"
            ]
          }),
          createRequest({
            name: "Error - Borrado de Equipo Prestado (409)",
            method: "DELETE",
            path: "/api/equipment/{{equipmentId}}",
            expectedStatus: 409,
            description: "Intento de borrar un equipo con availableUnits menor que totalUnits (prestado en Preparación). Status esperado: 409 Conflict.",
            tests: [
              "pm.test('Status code es 409', function () {",
              "    pm.response.to.have.status(409);",
              "});",
              "pm.test('Mensaje indica que el equipo tiene unidades prestadas', function () {",
              "    pm.expect(pm.response.json().error).to.include('unidades actualmente prestadas');",
              "});"
            ]
          }),
          createRequest({
            name: "Error - ID Inexistente (404)",
            method: "GET",
            path: "/api/rooms/507f1f77bcf86cd799439011",
            expectedStatus: 404,
            description: "Búsqueda con un ID válido de Mongo pero inexistente en la BD. Status esperado: 404 Not Found.",
            tests: [
              "pm.test('Status code es 404', function () {",
              "    pm.response.to.have.status(404);",
              "});",
              "pm.test('Mensaje indica sala no encontrada', function () {",
              "    pm.expect(pm.response.json().error).to.include('Sala no encontrada');",
              "});"
            ]
          })
        ]
      }
    ]
  };
}

// Reemplazar variables {{var}} usando el mapa de variables
function interpolate(str, vars) {
  if (!str) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => (vars[key] !== undefined ? vars[key] : `{{${key}}}`));
}

async function seedBaselineData() {
  // Sembrar 2 registros base por colección con nombres que no chocan con los de la colección Postman
  // Así las páginas 1 y 2 (limit=2) y los ordenamientos ascendentes/descendentes muestran datos reales variados
  const r1 = await Room.create({ name: "Sala Acústica Vivaldi", capacity: 6, floor: 1, hasDrumKit: false, status: "disponible" });
  const r2 = await Room.create({ name: "Sala Ensayo Beethoven", capacity: 8, floor: 2, hasDrumKit: true, status: "disponible" });

  const b1 = await Band.create({ name: "Cuarteto Austral", genre: "jazz", active: true, contactName: "Elena Morales" });
  const b2 = await Band.create({ name: "Coro Polifónico Central", genre: "coral", active: true, contactName: "Andrés Solís" });

  await Musician.create({ name: "Elena Morales", instrument: "Saxofón", email: "elena@austral.org", band: b1._id, active: true });
  await Musician.create({ name: "Andrés Solís", instrument: "Voz Tenor", email: "andres@corocentral.org", band: b2._id, active: true });

  const eq1 = await Equipment.create({ name: "Micrófono Shure SM58", category: "audio", totalUnits: 8, availableUnits: 7 });
  const eq2 = await Equipment.create({ name: "Batería Pearl Export", category: "percusion", totalUnits: 2, availableUnits: 2 });

  const bk1 = await Booking.create({
    room: r1._id,
    band: b1._id,
    date: "2026-11-12",
    startHour: 10,
    endHour: 12,
    status: "confirmada",
    notes: "Ensayo acústico de jazz"
  });
  const bk2 = await Booking.create({
    room: r2._id,
    band: b2._id,
    date: "2026-11-14",
    startHour: 18,
    endHour: 20,
    status: "apartada",
    notes: "Ensayo general del coro"
  });

  await Loan.create({ booking: bk1._id, equipment: eq1._id, units: 1, status: "prestado" });
  await Loan.create({ booking: bk2._id, equipment: eq2._id, units: 1, status: "devuelto" });
}

async function runAndCaptureExamples() {
  console.log("Conectando a MongoDB Atlas para ejecutar la colección y capturar Examples reales...");
  await connectDB();

  // Limpiar y sembrar datos base
  await Promise.all([
    Room.deleteMany({}),
    Band.deleteMany({}),
    Musician.deleteMany({}),
    Equipment.deleteMany({}),
    Booking.deleteMany({}),
    Loan.deleteMany({})
  ]);
  await seedBaselineData();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const liveBaseUrl = `http://localhost:${port}`;

  const envVars = {
    baseUrl: "http://localhost:3000",
    roomId: "",
    bandId: "",
    musicianId: "",
    equipmentId: "",
    bookingId: "",
    loanId: "",
    maintenanceRoomId: "",
    smallRoomId: "",
    inactiveBandId: "",
    activeBookingId: ""
  };

  const collection = buildCollectionTemplate();
  let totalRequests = 0;

  try {
    for (const folder of collection.item) {
      console.log(`\nEjecutando carpeta: ${folder.name}`);
      for (const reqItem of folder.item) {
        totalRequests++;
        const expectedStatus = reqItem._expectedStatus;
        delete reqItem._expectedStatus;

        // Construir URL real interpolando variables
        const rawUrlReplaced = interpolate(reqItem.request.url.raw, {
          ...envVars,
          baseUrl: liveBaseUrl
        });

        const fetchOptions = {
          method: reqItem.request.method,
          headers: { "Content-Type": "application/json" }
        };

        if (reqItem.request.body && reqItem.request.body.raw) {
          fetchOptions.body = interpolate(reqItem.request.body.raw, envVars);
        }

        const response = await fetch(rawUrlReplaced, fetchOptions);
        const rawBodyText = await response.text();
        let parsedBody;
        try {
          parsedBody = JSON.parse(rawBodyText);
        } catch (e) {
          parsedBody = rawBodyText;
        }

        if (response.status !== expectedStatus) {
          throw new Error(
            `Fallo en request "${reqItem.name}": esperado ${expectedStatus}, recibido ${response.status}. Respuesta: ${rawBodyText}`
          );
        }

        // Actualizar variables de entorno igual que los scripts de Postman
        if (reqItem.name === "Crear Sala" && parsedBody._id) envVars.roomId = parsedBody._id;
        if (reqItem.name === "Crear Banda" && parsedBody._id) envVars.bandId = parsedBody._id;
        if (reqItem.name === "Crear Músico" && parsedBody._id) envVars.musicianId = parsedBody._id;
        if (reqItem.name === "Crear Equipo" && parsedBody._id) envVars.equipmentId = parsedBody._id;
        if (reqItem.name === "Crear Reserva con Préstamo (Transacción)" && parsedBody._id) {
          envVars.bookingId = parsedBody._id;
          if (parsedBody.loans && parsedBody.loans[0]) {
            envVars.loanId = parsedBody.loans[0]._id;
          }
        }
        if (reqItem.name === "Preparación - Crear Sala en Mantenimiento" && parsedBody._id) {
          envVars.maintenanceRoomId = parsedBody._id;
        }
        if (reqItem.name === "Preparación - Crear Sala de Capacidad 1" && parsedBody._id) {
          envVars.smallRoomId = parsedBody._id;
        }
        if (reqItem.name === "Preparación - Crear Banda Inactiva" && parsedBody._id) {
          envVars.inactiveBandId = parsedBody._id;
        }
        if (reqItem.name === "Preparación - Crear Reserva Activa con Equipo Prestado" && parsedBody._id) {
          envVars.activeBookingId = parsedBody._id;
        }

        // Capturar cabeceras HTTP reales devueltas por Express
        const capturedHeaders = [];
        response.headers.forEach((value, key) => {
          capturedHeaders.push({ key, value });
        });

        // Guardar como Example real de Postman
        reqItem.response = [
          {
            name: `${reqItem.name} - Ejemplo (${response.status})`,
            originalRequest: JSON.parse(JSON.stringify(reqItem.request)),
            status: response.statusText || "OK",
            code: response.status,
            _postman_previewlanguage: "json",
            header: capturedHeaders,
            cookie: [],
            body: JSON.stringify(parsedBody, null, 2)
          }
        ];

        console.log(`  [OK] ${reqItem.request.method} ${reqItem.name} -> ${response.status} ${response.statusText}`);
      }
    }

    // Construir el archivo de Environment con las variables
    const environment = {
      id: "cabina-env-001",
      name: "Cabina - Environment",
      values: [
        { key: "baseUrl", value: "http://localhost:3000", type: "default", enabled: true },
        { key: "roomId", value: envVars.roomId, type: "default", enabled: true },
        { key: "bandId", value: envVars.bandId, type: "default", enabled: true },
        { key: "musicianId", value: envVars.musicianId, type: "default", enabled: true },
        { key: "equipmentId", value: envVars.equipmentId, type: "default", enabled: true },
        { key: "bookingId", value: envVars.bookingId, type: "default", enabled: true },
        { key: "loanId", value: envVars.loanId, type: "default", enabled: true },
        { key: "maintenanceRoomId", value: envVars.maintenanceRoomId, type: "default", enabled: true },
        { key: "smallRoomId", value: envVars.smallRoomId, type: "default", enabled: true },
        { key: "inactiveBandId", value: envVars.inactiveBandId, type: "default", enabled: true },
        { key: "activeBookingId", value: envVars.activeBookingId, type: "default", enabled: true }
      ],
      _postman_variable_scope: "environment",
      _postman_exported_at: new Date().toISOString(),
      _postman_exported_using: "Postman/11.0.0"
    };

    fs.writeFileSync(
      path.join(postmanDir, 'Cabina.postman_environment.json'),
      JSON.stringify(environment, null, 2),
      'utf-8'
    );
    fs.writeFileSync(
      path.join(postmanDir, 'Cabina.postman_collection.json'),
      JSON.stringify(collection, null, 2),
      'utf-8'
    );

    // Dejar la base de datos con los 2 registros semilla para que al correr la colección desde 1. Salas
    // en Postman no haya colisión de nombres duplicados y todas las páginas 1 y 2 tengan datos
    await Promise.all([
      Room.deleteMany({}),
      Band.deleteMany({}),
      Musician.deleteMany({}),
      Equipment.deleteMany({}),
      Booking.deleteMany({}),
      Loan.deleteMany({})
    ]);
    await seedBaselineData();

    console.log(`\n=============================================================`);
    console.log(`Colección generada y validada contra Atlas (${totalRequests} requests).`);
    console.log(`Todos los Examples contienen respuestas HTTP reales del servidor.`);
    console.log(`=============================================================\n`);
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runAndCaptureExamples().catch((err) => {
  console.error("Error generando colección Postman:", err);
  process.exit(1);
});
