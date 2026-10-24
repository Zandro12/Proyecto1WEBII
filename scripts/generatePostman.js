const fs = require('fs');
const path = require('path');

const postmanDir = path.join(__dirname, '..', 'postman');
if (!fs.existsSync(postmanDir)) {
  fs.mkdirSync(postmanDir, { recursive: true });
}

// 1. Environment de Postman
const environment = {
  id: "cabina-env-001",
  name: "Cabina - Environment",
  values: [
    { key: "baseUrl", value: "http://localhost:3000", type: "default", enabled: true },
    { key: "roomId", value: "", type: "default", enabled: true },
    { key: "bandId", value: "", type: "default", enabled: true },
    { key: "musicianId", value: "", type: "default", enabled: true },
    { key: "equipmentId", value: "", type: "default", enabled: true },
    { key: "bookingId", value: "", type: "default", enabled: true },
    { key: "loanId", value: "", type: "default", enabled: true }
  ],
  _postman_variable_scope: "environment",
  _postman_exported_at: new Date().toISOString(),
  _postman_exported_using: "Postman/10.0.0"
};

// Helper para crear requests
function createRequest({ name, method, path, query = [], body = null, description = '', tests = [], example = null }) {
  const urlPath = path.split('/').filter(Boolean);
  const rawUrl = `{{baseUrl}}/${urlPath.join('/')}${query.length > 0 ? '?' + query.map(q => `${q.key}=${q.value}`).join('&') : ''}`;

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
    response: []
  };

  if (body) {
    reqItem.request.body = {
      mode: "raw",
      raw: JSON.stringify(body, null, 2),
      options: { raw: { language: "json" } }
    };
  }

  if (tests.length > 0) {
    reqItem.event = [
      {
        listen: "test",
        script: {
          type: "text/javascript",
          exec: tests
        }
      }
    ];
  }

  if (example) {
    reqItem.response.push({
      name: `${name} - Ejemplo (${example.status})`,
      originalRequest: reqItem.request,
      status: example.statusText || "OK",
      code: example.status,
      _postman_previewlanguage: "json",
      header: [{ key: "Content-Type", value: "application/json" }],
      body: JSON.stringify(example.body, null, 2)
    });
  }

  return reqItem;
}

// 2. Definición de la Colección
const collection = {
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
          ],
          example: {
            status: 201,
            statusText: "Created",
            body: {
              _id: "6add372290b84b5694f2029c",
              name: "Sala Principal Apolo",
              capacity: 10,
              floor: 1,
              hasDrumKit: true,
              status: "disponible",
              createdAt: "2026-11-01T10:00:00.000Z",
              updatedAt: "2026-11-01T10:00:00.000Z"
            }
          }
        }),
        createRequest({
          name: "Listar Salas",
          method: "GET",
          path: "/api/rooms",
          description: "Lista las salas con paginación y ordenamiento por defecto. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: {
              data: [
                {
                  _id: "6add372290b84b5694f2029c",
                  name: "Sala Principal Apolo",
                  capacity: 10,
                  floor: 1,
                  hasDrumKit: true,
                  status: "disponible"
                }
              ],
              page: 1,
              limit: 10,
              total: 1,
              pages: 1
            }
          }
        }),
        createRequest({
          name: "Obtener Sala por ID",
          method: "GET",
          path: "/api/rooms/{{roomId}}",
          description: "Retorna el detalle de la sala especificada. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: {
              _id: "6add372290b84b5694f2029c",
              name: "Sala Principal Apolo",
              capacity: 10,
              floor: 1,
              hasDrumKit: true,
              status: "disponible"
            }
          }
        }),
        createRequest({
          name: "Actualizar Sala",
          method: "PUT",
          path: "/api/rooms/{{roomId}}",
          body: {
            name: "Sala Principal Apolo Actualizada",
            capacity: 12,
            floor: 1,
            hasDrumKit: true,
            status: "disponible"
          },
          description: "Actualiza los datos de una sala. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: {
              _id: "6add372290b84b5694f2029c",
              name: "Sala Principal Apolo Actualizada",
              capacity: 12,
              floor: 1,
              hasDrumKit: true,
              status: "disponible"
            }
          }
        }),
        createRequest({
          name: "Horario de la Sala (Schedule)",
          method: "GET",
          path: "/api/rooms/{{roomId}}/schedule",
          query: [{ key: "date", value: "2026-11-15" }],
          description: "Devuelve las reservas de ese día ordenadas por startHour con la banda poblada. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: {
              room: {
                _id: "6add372290b84b5694f2029c",
                name: "Sala Principal Apolo Actualizada",
                capacity: 12,
                floor: 1,
                status: "disponible"
              },
              date: "2026-11-15",
              bookings: []
            }
          }
        }),
        createRequest({
          name: "Estadísticas de Salas",
          method: "GET",
          path: "/api/rooms/stats",
          description: "Devuelve por cada sala cuántas reservas activas (apartadas o confirmadas) tiene. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: [
              {
                _id: "6add372290b84b5694f2029c",
                name: "Sala Principal Apolo Actualizada",
                capacity: 12,
                floor: 1,
                status: "disponible",
                activeBookingsCount: 0
              }
            ]
          }
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
          ],
          example: {
            status: 201,
            statusText: "Created",
            body: {
              _id: "6add372290b84b5694f2029e",
              name: "Los Ecos del Barrio",
              genre: "rock",
              active: true,
              contactName: "Roberto Gómez"
            }
          }
        }),
        createRequest({
          name: "Listar Bandas",
          method: "GET",
          path: "/api/bands",
          description: "Lista las bandas con paginación. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: {
              data: [
                {
                  _id: "6add372290b84b5694f2029e",
                  name: "Los Ecos del Barrio",
                  genre: "rock",
                  active: true,
                  contactName: "Roberto Gómez"
                }
              ],
              page: 1,
              limit: 10,
              total: 1,
              pages: 1
            }
          }
        }),
        createRequest({
          name: "Obtener Banda por ID",
          method: "GET",
          path: "/api/bands/{{bandId}}",
          description: "Obtiene el detalle de la banda con sus músicos poblados con populate. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: {
              _id: "6add372290b84b5694f2029e",
              name: "Los Ecos del Barrio",
              genre: "rock",
              active: true,
              contactName: "Roberto Gómez",
              musicians: []
            }
          }
        }),
        createRequest({
          name: "Actualizar Banda",
          method: "PUT",
          path: "/api/bands/{{bandId}}",
          body: {
            name: "Los Ecos del Barrio Oficial",
            genre: "rock",
            active: true,
            contactName: "Roberto Gómez Bolaños"
          },
          description: "Actualiza los datos de la banda. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: {
              _id: "6add372290b84b5694f2029e",
              name: "Los Ecos del Barrio Oficial",
              genre: "rock",
              active: true,
              contactName: "Roberto Gómez Bolaños"
            }
          }
        }),
        createRequest({
          name: "Músicos de la Banda",
          method: "GET",
          path: "/api/bands/{{bandId}}/musicians",
          description: "Devuelve el listado de músicos asociados a esta banda. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: []
          }
        }),
        createRequest({
          name: "Reservas de la Banda",
          method: "GET",
          path: "/api/bands/{{bandId}}/bookings",
          description: "Devuelve las reservas de la banda con la sala poblada. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: []
          }
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
          ],
          example: {
            status: 201,
            statusText: "Created",
            body: {
              _id: "6add372290b84b5694f202a0",
              name: "Federico Baterista",
              instrument: "Batería",
              email: "federico@ecos.com",
              band: "6add372290b84b5694f2029e",
              active: true
            }
          }
        }),
        createRequest({
          name: "Listar Músicos (Filtros band y active)",
          method: "GET",
          path: "/api/musicians",
          query: [
            { key: "band", value: "{{bandId}}" },
            { key: "active", value: "true" }
          ],
          description: "Lista músicos con filtrado por banda y estado activo. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: {
              data: [
                {
                  _id: "6add372290b84b5694f202a0",
                  name: "Federico Baterista",
                  instrument: "Batería",
                  email: "federico@ecos.com",
                  active: true
                }
              ],
              page: 1,
              limit: 10,
              total: 1,
              pages: 1
            }
          }
        }),
        createRequest({
          name: "Obtener Músico por ID",
          method: "GET",
          path: "/api/musicians/{{musicianId}}",
          description: "Detalle del músico mostrando su banda. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: {
              _id: "6add372290b84b5694f202a0",
              name: "Federico Baterista",
              instrument: "Batería",
              email: "federico@ecos.com",
              band: {
                _id: "6add372290b84b5694f2029e",
                name: "Los Ecos del Barrio Oficial",
                genre: "rock"
              },
              active: true
            }
          }
        }),
        createRequest({
          name: "Actualizar Músico",
          method: "PUT",
          path: "/api/musicians/{{musicianId}}",
          body: {
            name: "Federico Percusionista",
            instrument: "Batería y Percusión Menor",
            email: "federico@ecos.com",
            band: "{{bandId}}",
            active: true
          },
          description: "Actualiza los datos de un músico. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: {
              _id: "6add372290b84b5694f202a0",
              name: "Federico Percusionista",
              instrument: "Batería y Percusión Menor",
              email: "federico@ecos.com",
              band: "6add372290b84b5694f2029e",
              active: true
            }
          }
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
          ],
          example: {
            status: 201,
            statusText: "Created",
            body: {
              _id: "6add372290b84b5694f202a2",
              name: "Amplificador Marshall 50W",
              category: "cuerdas",
              totalUnits: 4,
              availableUnits: 4
            }
          }
        }),
        createRequest({
          name: "Listar Equipo (Filtros category y available)",
          method: "GET",
          path: "/api/equipment",
          query: [
            { key: "category", value: "cuerdas" },
            { key: "available", value: "true" }
          ],
          description: "Lista el inventario de equipo disponible. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: {
              data: [
                {
                  _id: "6add372290b84b5694f202a2",
                  name: "Amplificador Marshall 50W",
                  category: "cuerdas",
                  totalUnits: 4,
                  availableUnits: 4
                }
              ],
              page: 1,
              limit: 10,
              total: 1,
              pages: 1
            }
          }
        }),
        createRequest({
          name: "Obtener Equipo por ID",
          method: "GET",
          path: "/api/equipment/{{equipmentId}}",
          description: "Detalle de un equipo de inventario. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: {
              _id: "6add372290b84b5694f202a2",
              name: "Amplificador Marshall 50W",
              category: "cuerdas",
              totalUnits: 4,
              availableUnits: 4
            }
          }
        }),
        createRequest({
          name: "Actualizar Equipo",
          method: "PUT",
          path: "/api/equipment/{{equipmentId}}",
          body: {
            name: "Amplificador Marshall Valve 50W",
            category: "cuerdas",
            totalUnits: 6
          },
          description: "Actualiza totalUnits (sin modificar directamente availableUnits). Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: {
              _id: "6add372290b84b5694f202a2",
              name: "Amplificador Marshall Valve 50W",
              category: "cuerdas",
              totalUnits: 6,
              availableUnits: 6
            }
          }
        }),
        createRequest({
          name: "Estadísticas de Equipo",
          method: "GET",
          path: "/api/equipment/stats",
          description: "Devuelve por categoría las unidades totales y disponibles usando Aggregate. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: [
              {
                category: "cuerdas",
                totalUnits: 6,
                availableUnits: 6,
                borrowedUnits: 0,
                equipmentCount: 1
              }
            ]
          }
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
          ],
          example: {
            status: 201,
            statusText: "Created",
            body: {
              _id: "6add372390b84b5694f202a3",
              room: "6add372290b84b5694f2029c",
              band: "6add372290b84b5694f2029e",
              date: "2026-11-15",
              startHour: 15,
              endHour: 17,
              durationHours: 2,
              status: "apartada",
              notes: "Ensayo previo a presentación",
              loans: [
                {
                  _id: "6add372390b84b5694f202a4",
                  booking: "6add372390b84b5694f202a3",
                  equipment: "6add372290b84b5694f202a2",
                  units: 2,
                  status: "prestado"
                }
              ]
            }
          }
        }),
        createRequest({
          name: "Listar Reservas (Filtros status, room, band)",
          method: "GET",
          path: "/api/bookings",
          query: [
            { key: "status", value: "apartada" },
            { key: "room", value: "{{roomId}}" }
          ],
          description: "Lista reservas con filtros aplicados. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: {
              data: [
                {
                  _id: "6add372390b84b5694f202a3",
                  date: "2026-11-15",
                  startHour: 15,
                  endHour: 17,
                  durationHours: 2,
                  status: "apartada"
                }
              ],
              page: 1,
              limit: 10,
              total: 1,
              pages: 1
            }
          }
        }),
        createRequest({
          name: "Obtener Reserva por ID",
          method: "GET",
          path: "/api/bookings/{{bookingId}}",
          description: "Detalle completo con sala, banda con músicos activos y préstamos con equipo. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: {
              _id: "6add372390b84b5694f202a3",
              room: {
                _id: "6add372290b84b5694f2029c",
                name: "Sala Principal Apolo Actualizada",
                capacity: 12,
                status: "disponible"
              },
              band: {
                _id: "6add372290b84b5694f2029e",
                name: "Los Ecos del Barrio Oficial",
                genre: "rock",
                activeMusicians: [
                  {
                    name: "Federico Percusionista",
                    instrument: "Batería y Percusión Menor",
                    email: "federico@ecos.com"
                  }
                ]
              },
              loans: [
                {
                  _id: "6add372390b84b5694f202a4",
                  units: 2,
                  status: "prestado",
                  equipment: {
                    _id: "6add372290b84b5694f202a2",
                    name: "Amplificador Marshall Valve 50W",
                    category: "cuerdas"
                  }
                }
              ],
              date: "2026-11-15",
              startHour: 15,
              endHour: 17,
              durationHours: 2,
              status: "apartada"
            }
          }
        }),
        createRequest({
          name: "Actualizar Reserva (Confirmar)",
          method: "PUT",
          path: "/api/bookings/{{bookingId}}",
          body: {
            status: "confirmada"
          },
          description: "Cambia el estado de apartada a confirmada (no mueve inventario). Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: {
              _id: "6add372390b84b5694f202a3",
              status: "confirmada"
            }
          }
        }),
        createRequest({
          name: "Estadísticas de Reservas",
          method: "GET",
          path: "/api/bookings/stats",
          description: "Cuenta reservas agrupadas por estado con Aggregate. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: [
              {
                status: "confirmada",
                count: 1
              }
            ]
          }
        }),
        createRequest({
          name: "Listar Préstamos",
          method: "GET",
          path: "/api/loans",
          description: "Lista préstamos con reservas y equipos poblados. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: {
              data: [
                {
                  _id: "6add372390b84b5694f202a4",
                  booking: "6add372390b84b5694f202a3",
                  equipment: "6add372290b84b5694f202a2",
                  units: 2,
                  status: "prestado"
                }
              ],
              page: 1,
              limit: 10,
              total: 1,
              pages: 1
            }
          }
        }),
        createRequest({
          name: "Obtener Préstamo por ID",
          method: "GET",
          path: "/api/loans/{{loanId}}",
          description: "Detalle del préstamo con su reserva y equipo poblados. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: {
              _id: "6add372390b84b5694f202a4",
              units: 2,
              status: "prestado"
            }
          }
        }),
        createRequest({
          name: "Cancelar Reserva (Transacción)",
          method: "PATCH",
          path: "/api/bookings/{{bookingId}}/cancel",
          description: "Cancela la reserva, marca préstamos como devuelto y reintegra el inventario con $inc. Status esperado: 200 OK.",
          tests: [
            "pm.test('Status code es 200', function () {",
            "    pm.response.to.have.status(200);",
            "});",
            "var jsonData = pm.response.json();",
            "pm.expect(jsonData.booking.status).to.eql('cancelada');"
          ],
          example: {
            status: 200,
            statusText: "OK",
            body: {
              message: "Reserva cancelada y equipos devueltos al inventario con éxito",
              booking: {
                _id: "6add372390b84b5694f202a3",
                status: "cancelada"
              },
              loans: [
                {
                  _id: "6add372390b84b5694f202a4",
                  units: 2,
                  status: "devuelto"
                }
              ]
            }
          }
        })
      ]
    },

    // ---------------------------------------------------------
    // 6. CONSULTAS
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
    // 7. ERRORES
    // ---------------------------------------------------------
    {
      name: "7. Errores",
      item: [
        createRequest({
          name: "Error - Nombre de Sala Repetido (409)",
          method: "POST",
          path: "/api/rooms",
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
            "pm.test('Responde con objeto JSON de error', function () {",
            "    pm.expect(pm.response.json().error).to.be.a('string');",
            "});"
          ],
          example: {
            status: 409,
            statusText: "Conflict",
            body: { error: "Ya existe un registro con el valor 'Sala Principal Apolo Actualizada' en el campo 'name'" }
          }
        }),
        createRequest({
          name: "Error - Email de Músico Repetido (409)",
          method: "POST",
          path: "/api/musicians",
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
            "pm.test('Responde con objeto JSON de error', function () {",
            "    pm.expect(pm.response.json().error).to.be.a('string');",
            "});"
          ],
          example: {
            status: 409,
            statusText: "Conflict",
            body: { error: "Ya existe un registro con el valor 'federico@ecos.com' en el campo 'email'" }
          }
        }),
        createRequest({
          name: "Error - Horas Invertidas en Reserva (400)",
          method: "POST",
          path: "/api/bookings",
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
            "pm.test('Responde con mensaje claro', function () {",
            "    pm.expect(pm.response.json().error).to.include('mayor');",
            "});"
          ],
          example: {
            status: 400,
            statusText: "Bad Request",
            body: { error: "La hora de fin debe ser estrictamente mayor que la hora de inicio" }
          }
        }),
        createRequest({
          name: "Error - Reserva de Más de 3 Horas (400)",
          method: "POST",
          path: "/api/bookings",
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
            "pm.test('Responde con mensaje claro', function () {",
            "    pm.expect(pm.response.json().error).to.include('máximo 3 horas');",
            "});"
          ],
          example: {
            status: 400,
            statusText: "Bad Request",
            body: { error: "La reserva dura como máximo 3 horas" }
          }
        }),
        createRequest({
          name: "Error - Sala en Mantenimiento (409)",
          method: "POST",
          path: "/api/bookings",
          body: {
            room: "{{roomId}}",
            band: "{{bandId}}",
            date: "2026-11-20",
            startHour: 10,
            endHour: 12
          },
          description: "Intento de apartar una sala cuando su estado es 'mantenimiento'. Status esperado: 409 Conflict.",
          tests: [
            "pm.test('Status code es 409 o mensaje de sala no disponible', function () {",
            "    pm.expect([400, 409]).to.include(pm.response.code);",
            "});"
          ],
          example: {
            status: 409,
            statusText: "Conflict",
            body: { error: "La sala no está disponible (se encuentra en mantenimiento)" }
          }
        }),
        createRequest({
          name: "Error - Banda Inactiva (409)",
          method: "POST",
          path: "/api/bookings",
          body: {
            room: "{{roomId}}",
            band: "{{bandId}}",
            date: "2026-11-20",
            startHour: 10,
            endHour: 12
          },
          description: "Intento de reservar con una banda inactiva (active: false). Status esperado: 409 Conflict.",
          tests: [
            "pm.test('Status code es 409 o mensaje de banda inactiva', function () {",
            "    pm.expect([400, 409]).to.include(pm.response.code);",
            "});"
          ],
          example: {
            status: 409,
            statusText: "Conflict",
            body: { error: "La banda no está activa" }
          }
        }),
        createRequest({
          name: "Error - Banda que no Cabe en la Sala (409)",
          method: "POST",
          path: "/api/bookings",
          body: {
            room: "{{roomId}}",
            band: "{{bandId}}",
            date: "2026-11-20",
            startHour: 10,
            endHour: 12
          },
          description: "La cantidad de músicos activos supera la capacidad de la sala. Status esperado: 409 Conflict.",
          tests: [
            "pm.test('Status code es 409 o mensaje de capacidad', function () {",
            "    pm.expect([400, 409]).to.include(pm.response.code);",
            "});"
          ],
          example: {
            status: 409,
            statusText: "Conflict",
            body: { error: "Los músicos activos de la banda (15) exceden la capacidad de la sala (10)" }
          }
        }),
        createRequest({
          name: "Error - Traslape de Horario (409)",
          method: "POST",
          path: "/api/bookings",
          body: {
            room: "{{roomId}}",
            band: "{{bandId}}",
            date: "2026-11-15",
            startHour: 16,
            endHour: 18
          },
          description: "La reserva se cruza con otra reserva activa en la misma sala y fecha. Status esperado: 409 Conflict.",
          tests: [
            "pm.test('Status code es 409 traslape', function () {",
            "    pm.expect([400, 409]).to.include(pm.response.code);",
            "});"
          ],
          example: {
            status: 409,
            statusText: "Conflict",
            body: { error: "Existe un traslape de horario con otra reserva apartada o confirmada en la misma sala" }
          }
        }),
        createRequest({
          name: "Error - Equipo de Más de lo Disponible (409)",
          method: "POST",
          path: "/api/bookings",
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
            "pm.test('Mensaje de error claro', function () {",
            "    pm.expect(pm.response.json().error).to.include('insuficientes');",
            "});"
          ],
          example: {
            status: 409,
            statusText: "Conflict",
            body: { error: "Unidades insuficientes para el equipo 'Amplificador Marshall Valve 50W'. Solicitadas: 999, Disponibles: 6" }
          }
        }),
        createRequest({
          name: "Error - Cambio de Estado No Permitido (409)",
          method: "PUT",
          path: "/api/bookings/{{bookingId}}",
          body: {
            status: "apartada"
          },
          description: "Intento de cambiar de confirmada a apartada o de cancelada a apartada. Status esperado: 409 Conflict.",
          tests: [
            "pm.test('Status code es 409', function () {",
            "    pm.response.to.have.status(409);",
            "});"
          ],
          example: {
            status: 409,
            statusText: "Conflict",
            body: { error: "Transición de estado no permitida" }
          }
        }),
        createRequest({
          name: "Error - Borrado de Sala con Reserva Activa (409)",
          method: "DELETE",
          path: "/api/rooms/{{roomId}}",
          description: "Intento de borrar una sala que tiene reservas activas. Status esperado: 409 Conflict.",
          tests: [
            "pm.test('Status code es 409 o 404', function () {",
            "    pm.expect([404, 409]).to.include(pm.response.code);",
            "});"
          ],
          example: {
            status: 409,
            statusText: "Conflict",
            body: { error: "No se puede eliminar la sala porque tiene reservas activas (apartadas o confirmadas)" }
          }
        }),
        createRequest({
          name: "Error - Borrado de Equipo Prestado (409)",
          method: "DELETE",
          path: "/api/equipment/{{equipmentId}}",
          description: "Intento de borrar un equipo que tiene availableUnits menor que totalUnits. Status esperado: 409 Conflict.",
          tests: [
            "pm.test('Status code es 409 o 200 si ya fue devuelto', function () {",
            "    pm.expect([200, 409]).to.include(pm.response.code);",
            "});"
          ],
          example: {
            status: 409,
            statusText: "Conflict",
            body: { error: "No se puede eliminar el equipo porque tiene unidades actualmente prestadas" }
          }
        }),
        createRequest({
          name: "Error - ID Inexistente (404)",
          method: "GET",
          path: "/api/rooms/507f1f77bcf86cd799439011",
          description: "Búsqueda con un ID válido de Mongo pero inexistente en la BD. Status esperado: 404 Not Found.",
          tests: [
            "pm.test('Status code es 404', function () {",
            "    pm.response.to.have.status(404);",
            "});",
            "pm.test('Error con mensaje claro', function () {",
            "    pm.expect(pm.response.json().error).to.be.a('string');",
            "});"
          ],
          example: {
            status: 404,
            statusText: "Not Found",
            body: { error: "Sala no encontrada" }
          }
        })
      ]
    }
  ]
};

// Guardar archivos en la carpeta postman
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

console.log('Archivos de Postman generados con éxito en:', postmanDir);
