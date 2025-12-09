## Backend Service (Node.js + Express)

This folder contains the main API gateway and backend services for the landslide early warning system.  
Stack: **Node.js (vanilla JS)**, **Express**, **PostgreSQL + TimescaleDB + PostGIS**, **Redis**, **Socket.io**, **FastAPI ML integration**, **S3 / MinIO** for media.

### Folder structure (current + planned)

- `src/server.js` — entry point, HTTP + Socket.io server.
- `src/app.js` — Express app configuration, middleware, healthcheck.
- `src/utils/logger.js` — Winston logger + request logging middleware.
- `src/middleware/validate.js` — request validation + error handlers.
- `src/models/db.js` — PostgreSQL connection pool (`pg`).
- `src/config/env.js` — environment configuration helper.
- `src/routes/` — (to be added) REST routes (`auth`, `sensors`, `alerts`, `complaints`, `govt`, `admin`).
- `src/controllers/` — (to be added) business logic for each route.
- `src/services/` — (to be added) ML integration, alerts, offline queue, file storage.
- `src/middleware/` — auth, validation, role-based access.
- `src/models/` — DB queries and data access helpers.
- `src/utils/` — shared helpers (pagination, responses, etc.).
- `src/config/` — config and keys.

### Install dependencies

From the project root (`C:\\SIH` in your case):

```bash
cd backend
npm install
```

This installs all packages defined in `package.json`:

- Core backend: `express`, `cors`, `dotenv`, `helmet`, `axios`
- Auth & security: `jsonwebtoken`, `bcrypt`, `express-validator`
- Realtime & queue: `socket.io`, `ioredis`, `node-cron`
- DB: `pg`
- File uploads & storage: `multer`, `mime-types`, `aws-sdk`
- Validation & CSV: `ajv`, `csv-parse`
- Utilities: `uuid`, `dayjs`, `winston`
- Dev: `nodemon`

### Run in development

```bash
cd backend
npm run dev
```

The server will start on port **4000** (or `PORT` from your `.env`) and expose a basic healthcheck at:

- `GET /health`


