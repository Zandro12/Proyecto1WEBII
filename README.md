# Cabina - API del Centro Cultural

**Cabina** es una API REST desarrollada con **Node.js**, **Express** y **MongoDB (Mongoose)** para la gestión integral de un centro cultural: administración de salas de ensayo, bandas musicales, músicos, préstamos de equipo y reservas con soporte de transacciones ACID multi-documento.

---

## Integrantes del Proyecto
* **Alejandro Gómez**
* **Anthony Campos**

---

## Tecnologías Utilizadas
* **Entorno:** Node.js (v24+)
* **Framework:** Express.js (v5)
* **Base de Datos:** MongoDB Atlas (con soporte nativo para transacciones multi-documento en Replica Set)
* **ODM:** Mongoose (v9)
* **Utilidades:** dotenv, cors, morgan, nodemon

---

## Instalación

1. **Clonar el repositorio o ubicarse en la carpeta del proyecto:**
   ```bash
   cd C:\Users\aleja\OneDrive\Documents\IIICuatri26\webII\Proyecto1GC\Proyecto1WEBII
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

---

## Configuración del Entorno (.env)

El proyecto incluye un archivo plantilla [`.env.example`](file:///.env.example) sin credenciales sensibles.

1. Crear el archivo `.env` en la raíz del proyecto basándose en `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Configurar las variables necesarias en el archivo `.env`:
   ```env
   PORT=3000
   MONGODB_URI=mongodb+srv://<usuario>:<password>@clusterproy.kecrkgu.mongodb.net/cabina?retryWrites=true&w=majority
   ```

---

## Ejecución del Servidor

* **Modo desarrollo (con recarga automática mediante Nodemon):**
  ```bash
  npm run dev
  ```

* **Modo producción:**
  ```bash
  npm start
  ```

* **Comprobación de salud (Health Check):**
  Una vez iniciado el servidor, abrir en el navegador o Postman:
  `http://localhost:3000/api/health`

---

## Modelos del Sistema

1. **Room (Salas):** `name` (único, 3-40 caracteres), `capacity` (1-30), `floor`, `hasDrumKit` (booleano), `status` (`'disponible'` o `'mantenimiento'`).
2. **Band (Bandas):** `name` (único, 2-50 caracteres), `genre` (`'rock'`, `'jazz'`, `'coral'`, `'otro'`), `active` (booleano), `contactName`.
3. **Musician (Músicos):** `name`, `instrument`, `email` (único, con formato válido), `band` (referencia ObjectId a Band), `active` (booleano).
4. **Booking (Reservas):** `room` (ObjectId), `band` (ObjectId), `date` (`YYYY-MM-DD`), `startHour` (8-21), `endHour` (9-22), `status` (`'apartada'`, `'confirmada'`, `'cancelada'`), `notes` (máx. 200 caracteres), y campo virtual `durationHours` (`endHour - startHour`).
5. **Equipment (Equipo):** `name` (único), `category` (`'audio'`, `'cuerdas'`, `'percusion'`), `totalUnits` (> 0), `availableUnits` (0 a `totalUnits`).
6. **Loan (Préstamo de Equipo):** `booking` (ObjectId), `equipment` (ObjectId), `units` (> 0), `status` (`'prestado'` o `'devuelto'`).

---

## Sección: Índices

Todos los índices requeridos están declarados explícitamente en los schemas de Mongoose:

| Modelo | Índice Declarado | Tipo / Estructura | ¿Para qué consulta sirve y qué optimiza? |
| :--- | :--- | :--- | :--- |
| **Room** | `{ name: 1 }` | Único | Optimiza la búsqueda de salas por nombre exacto, garantiza la restricción de nombres únicos y acelera el ordenamiento por defecto (`sort=name`). |
| **Band** | `{ name: 1 }` | Único | Acelera la búsqueda y ordenamiento de bandas por nombre y garantiza la unicidad del nombre a nivel de motor de base de datos. |
| **Musician** | `{ email: 1 }` | Único | Evita duplicidad de correos electrónicos y optimiza las búsquedas rápidas al registrar o consultar músicos por su email. |
| **Musician** | `{ band: 1 }` | Simple | Optimiza la consulta `GET /api/bands/:id/musicians` y los conteos de músicos activos por banda al validar cupos en reservas. |
| **Equipment** | `{ name: 1 }` | Único | Garantiza que no existan dos equipos con el mismo nombre y acelera las búsquedas de inventario por nombre. |
| **Booking** | `{ room: 1, date: 1, startHour: 1 }` | Compuesto | **Crítico para el negocio:** optimiza la consulta de traslapes de reservas (`Room` + `Date` + rango de horas) y la consulta del horario del día (`GET /api/rooms/:id/schedule?date=...`). |
| **Loan** | `{ booking: 1 }` | Simple | Acelera la consulta de préstamos vinculados a una reserva (`GET /api/bookings/:id` y durante la cancelación atómica de reservas). |
| **Loan** | `{ equipment: 1, status: 1 }` | Compuesto | Permite consultar de forma eficiente los préstamos activos (`status: 'prestado'`) de un equipo específico al auditar inventario o validar antes de eliminar un equipo. |

---

## Sección: Transacción

### 1. ¿En qué funciones está implementada?
Las transacciones están implementadas en el controlador [`src/controllers/bookingController.js`](file:///src/controllers/bookingController.js):
* **`createBooking`**: Creación atómica de la reserva y sus préstamos de equipo asociados.
* **`cancelBooking`**: Cancelación atómica de la reserva y devolución de los equipos al inventario.

### 2. ¿Cómo funciona la sesión en Mongoose y Atlas?
Se utiliza `mongoose.startSession()` junto con el helper de alto nivel `session.withTransaction(async () => { ... })`.
* MongoDB Atlas corre sobre una arquitectura de **Replica Set**, lo cual permite la ejecución de transacciones multi-documento con aislamiento y consistencia ACID.
* Si cualquiera de las operaciones internas falla o lanza un error (por ejemplo, traslape de horario o inventario insuficiente), la sesión ejecuta un **abortTransaction()** automático, revirtiendo cualquier cambio parcial.
* Al concluir con éxito todas las operaciones, `withTransaction()` realiza automáticamente el **commitTransaction()**.
* En el bloque `finally` se garantiza la liberación de recursos con `session.endSession()`.

### 3. ¿Qué colecciones toca cada transacción?
* **Al Crear Reserva (`createBooking`):**
  1. **`bookings`**: Inserta el documento de la reserva con estado inicial `'apartada'`.
  2. **`loans`**: Inserta los registros de préstamo con estado `'prestado'`, asociando la reserva creada y los equipos solicitados.
  3. **`equipment`**: Descuenta las unidades prestadas de `availableUnits` utilizando la operación atómica `$inc: { availableUnits: -units }`.
  4. *Lecturas de validación con sesión:* Verifica la sala en `rooms`, la banda en `bands`, los músicos en `musicians` y reservas existentes en `bookings`.
* **Al Cancelar Reserva (`cancelBooking`):**
  1. **`bookings`**: Actualiza el estado de la reserva a `'cancelada'`.
  2. **`loans`**: Actualiza los préstamos asociados de `'prestado'` a `'devuelto'`.
  3. **`equipment`**: Reintegra las unidades al inventario disponible mediante `$inc: { availableUnits: loan.units }`.

### 4. ¿Cómo se probaron los casos de conflicto (409)?
1. **Traslape de horario (409):** Se intentó registrar una reserva en la misma sala y fecha que colisionaba con una reserva activa (`(inicio_pedido < fin_existente) && (fin_pedido > inicio_existente)`). La transacción validó el conflicto y respondió 409 sin crear reservas ni alterar el inventario.
2. **Equipo insuficiente (409):** Se intentó solicitar 999 unidades de un amplificador que solo tenía 4 disponibles. La transacción abortó antes de tocar las colecciones.
3. **Sala en mantenimiento (409):** Se intentó apartar una sala en estado `mantenimiento`, denegando la operación con 409.
4. **Banda inactiva o sin músicos activos (409):** Se verificó que bandas inactivas o con 0 músicos no puedan reservar salas.
5. **Capacidad superada (409):** Se validó que una banda con más integrantes que la capacidad de la sala no pueda apartarla.
6. **Borrados protegidos (409):**
   * Intentar borrar una sala o banda con reservas `'apartada'` o `'confirmada'` responde 409.
   * Intentar borrar una banda con músicos responde 409.
   * Intentar borrar equipo con `availableUnits < totalUnits` responde 409.
7. **Transición inválida de estado (409):** Pasar de `'confirmada'` a `'apartada'` o modificar una reserva `'cancelada'` responde 409.

---

## Colección y Entorno de Postman

Los archivos exportados se encuentran en la carpeta [`postman/`](file:///postman/):
1. **`Cabina.postman_collection.json`**
2. **`Cabina.postman_environment.json`**

### Variables del Environment
* `baseUrl`: `http://localhost:3000`
* `roomId`, `bandId`, `musicianId`, `equipmentId`, `bookingId`, `loanId` (se actualizan automáticamente al ejecutar las solicitudes de creación).

### Estructura y Orden de Carpetas
1. **1. Salas:** CRUD de salas, horario diario y estadísticas.
2. **2. Bandas:** CRUD de bandas, músicos de la banda y reservas de la banda.
3. **3. Músicos:** CRUD y filtros por banda y activos.
4. **4. Equipo:** CRUD, control de inventario y estadísticas por categoría.
5. **5. Reservas:** Creación y cancelación transaccional, detalle con subdocumentos y filtros.
6. **6. Consultas:** Demostración de los 6 listados con:
   * Página 1 y Página 2 (`page`, `limit`).
   * Orden ascendente y descendente (`sort=campo` y `sort=-campo`).
   * Búsqueda con resultados y sin resultados (`search`).
   * Horario de sala, reservas y músicos de banda, y los 3 `stats` con `aggregate`.
7. **7. Errores:** Suite de casos de prueba con assertions automatizados (400, 404, 409).

---

## Guía Rápida para la Defensa (Alejandro Gómez y Anthony Campos)

* **¿Cómo se calculan las horas de reserva?**
  A través de un campo virtual en el schema de Mongoose `BookingSchema.virtual('durationHours')` que calcula `this.endHour - this.startHour` sin persistir redundancia en la base de datos, mostrándose automáticamente en las respuestas JSON (`toJSON: { virtuals: true }`).
* **¿Por qué usar `$inc` en la transacción?**
  Porque `$inc` es un operador de actualización atómico a nivel de documento de MongoDB. Evita condiciones de carrera ("race conditions") donde dos solicitudes simultáneas lean el mismo inventario y una sobreescriba a la otra erróneamente.
* **¿Por qué usar transacciones con `startSession` y `withTransaction`?**
  Porque una reserva implica crear registros en `bookings`, en `loans` y actualizar el stock en `equipment`. Si el sistema cae a mitad del proceso o el inventario no alcanza, `withTransaction` garantiza que no queden reservas huérfanas ni inventario descontado erróneamente (propiedad de Atomicidad).
