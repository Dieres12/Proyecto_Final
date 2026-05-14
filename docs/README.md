# 🚌 Transportes Génesis — Guía Completa de Instalación y Deploy

## Stack Tecnológico
- **Frontend**: React + Vite + TailwindCSS + React Leaflet
- **Backend**: Node.js + Express + Prisma ORM + Socket.io
- **Base de datos**: PostgreSQL
- **Deploy**: Railway

---

## ⚡ Setup Local (Desarrollo)

### Prerrequisitos
- Node.js >= 18
- PostgreSQL local o Docker
- Git

### 1. Clonar y preparar

```bash
git clone <tu-repo>
cd transportes-genesis
```

### 2. Configurar Backend

```bash
cd backend
cp .env.example .env
```

Editar `backend/.env`:
```env
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/transportes_genesis
JWT_SECRET=mi-clave-secreta-super-segura-2024
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

```bash
npm install
npx prisma migrate dev --name init
node src/prisma/seed.js
npm run dev
```

El backend estará en: `http://localhost:3001`

### 3. Configurar Frontend

```bash
cd ../frontend
cp .env.example .env
```

Editar `frontend/.env`:
```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

```bash
npm install
npm run dev
```

El frontend estará en: `http://localhost:5173`

### 4. Credenciales de prueba

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Admin | admin@genesis.gt | admin123 | ADMIN |
| Padre 1 | padre1@test.com | padre123 | PADRE |
| Padre 2 | padre2@test.com | padre123 | PADRE |

---

## 🚀 Deploy en Railway

### Paso 1: Crear cuenta en Railway
1. Ve a [railway.app](https://railway.app)
2. Crear cuenta con GitHub

### Paso 2: Crear proyecto y base de datos

```
Railway Dashboard → New Project → Empty Project
```

Agregar PostgreSQL:
```
+ New → Database → PostgreSQL
```

Railway proveerá automáticamente la variable `DATABASE_URL`.

---

### Paso 3: Deploy del Backend

```
+ New → GitHub Repo → Seleccionar tu repositorio
→ Root Directory: backend
```

**Variables de entorno en Railway** (Settings → Variables):
```
PORT=3001
DATABASE_URL=<Railway la provee automáticamente>
JWT_SECRET=clave-super-secreta-produccion-2024
CLIENT_URL=https://tu-frontend.railway.app
NODE_ENV=production
```

**Start Command** (Settings → Deploy):
```bash
npx prisma migrate deploy && node src/index.js
```

O agregar a `package.json`:
```json
"start": "npx prisma migrate deploy && node src/index.js"
```

---

### Paso 4: Deploy del Frontend

```
+ New → GitHub Repo → Seleccionar tu repositorio
→ Root Directory: frontend
```

**Variables de entorno**:
```
VITE_API_URL=https://tu-backend.railway.app/api
VITE_SOCKET_URL=https://tu-backend.railway.app
```

**Build Command**: `npm run build`
**Start Command**: `npx serve -s dist -l $PORT`

O usar Dockerfile (Railway lo detecta automáticamente).

---

### Paso 5: Ejecutar seed en producción

En Railway, ir al servicio de Backend → Deploy Logs → abrir terminal:

```bash
node src/prisma/seed.js
```

O temporalmente agregar al start command:
```bash
npx prisma migrate deploy && node src/prisma/seed.js && node src/index.js
```

---

## 🗄️ Estructura de Base de Datos

```
User (autenticación)
  └── Parent (perfil de padre)
        └── Student (estudiantes)
              └── Attendance (asistencias)
        └── Payment (pagos)
              └── Receipt (comprobantes)

Driver (pilotos)
  └── Bus (autobuses)
        └── Route (rutas)
              └── Stop (paradas)
        └── GPSLocation (historial GPS)
```

---

## 📡 API Endpoints

### Auth
```
POST   /api/auth/login          → Login, retorna JWT
GET    /api/auth/me             → Usuario actual
PUT    /api/auth/change-password → Cambiar contraseña
```

### Recursos CRUD
```
GET/POST         /api/parents
GET/PUT/DELETE   /api/parents/:id

GET/POST         /api/students
GET/PUT/DELETE   /api/students/:id

GET/POST         /api/drivers
GET/PUT/DELETE   /api/drivers/:id

GET/POST         /api/buses
GET/PUT/DELETE   /api/buses/:id

GET/POST         /api/routes
GET/PUT/DELETE   /api/routes/:id
POST             /api/routes/:id/stops
DELETE           /api/routes/:id/stops/:stopId
```

### Pagos
```
GET    /api/payments            → Lista (filtros: status, month, year)
POST   /api/payments            → Crear pago
PATCH  /api/payments/:id/status → Cambiar estado (ADMIN)
POST   /api/payments/:id/receipt → Subir comprobante
```

### Asistencia
```
GET    /api/attendance          → Lista
POST   /api/attendance          → Registrar
GET    /api/attendance/stats    → Estadísticas (ADMIN)
```

### GPS
```
GET    /api/gps/current         → Posiciones actuales de buses
GET    /api/gps/history         → Historial GPS
GET    /api/gps/bus/:id         → Historial de un bus
```

### Reportes (ADMIN)
```
GET    /api/reports/dashboard           → Stats del dashboard
GET    /api/reports/payments            → Reporte de pagos
GET    /api/reports/students-by-route   → Estudiantes por ruta
```

---

## 🛰️ GPS Simulado

El simulador GPS se inicia automáticamente con el backend.

**Funcionamiento:**
1. Al iniciar, carga todos los buses activos
2. Cada bus recibe waypoints (paradas de su ruta o template)
3. Cada **5 segundos** avanza la posición
4. Emite via **Socket.io** el evento `gps:update`
5. Guarda en PostgreSQL para historial

**Evento Socket:**
```javascript
socket.on('gps:update', (updates) => {
  // updates = [{ busId, plate, lat, lng, speed, heading, timestamp }]
});
```

---

## 🔐 Seguridad

- Passwords hasheadas con **bcrypt** (salt rounds: 10)
- JWT con expiración de **7 días**
- Middleware de roles: ADMIN y PADRE
- Padres solo ven sus propios datos
- Pagos restringidos a primeros 5 días del mes
- Upload limitado a: JPG, PNG, PDF (máx 5MB)

---

## 📁 Estructura del Proyecto

```
transportes-genesis/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Modelos de BD
│   ├── src/
│   │   ├── config/
│   │   │   └── prisma.js          # Cliente Prisma singleton
│   │   ├── controllers/           # Lógica de negocio
│   │   ├── middlewares/
│   │   │   ├── auth.js            # JWT middleware
│   │   │   └── upload.js          # Multer para archivos
│   │   ├── routes/                # Definición de rutas API
│   │   ├── services/
│   │   │   └── gpsSimulator.js    # Simulador GPS automático
│   │   ├── sockets/
│   │   │   └── socketService.js   # Socket.io setup
│   │   ├── prisma/
│   │   │   └── seed.js            # Datos iniciales
│   │   └── index.js               # Entry point
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Autenticación global
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx # Sidebar + Navbar
│   │   ├── pages/                 # Una página por módulo
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx # Guard de rutas
│   │   ├── services/
│   │   │   ├── api.js             # Axios configurado
│   │   │   └── socket.js          # Socket.io client
│   │   ├── App.jsx                # Router principal
│   │   ├── main.jsx               # Entry point React
│   │   └── index.css              # Estilos globales + componentes
│   ├── .env.example
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── docs/
    └── README.md                  # Este archivo
```

---

## 🐳 Docker (Opcional)

```bash
# Backend
cd backend
docker build -t genesis-backend .
docker run -p 3001:3001 --env-file .env genesis-backend

# Frontend
cd frontend
docker build -t genesis-frontend .
docker run -p 80:80 genesis-frontend
```

---

## ✅ Checklist de Deploy

- [ ] PostgreSQL creado en Railway
- [ ] Backend desplegado con variables de entorno
- [ ] Migraciones ejecutadas (`prisma migrate deploy`)
- [ ] Seed ejecutado
- [ ] Frontend desplegado con `VITE_API_URL` correcto
- [ ] CORS configurado con URL del frontend
- [ ] Probar login con admin@genesis.gt
- [ ] Verificar GPS en vivo en `/tracking`

---

## 💡 Notas Importantes

1. **Railway + Socket.io**: Railway soporta WebSockets nativamente
2. **Uploads en Railway**: El sistema de archivos de Railway es **efímero**. Para producción real, integrar con AWS S3 o Cloudinary
3. **GPS Simulator**: Se reinicia con el servidor. El historial persiste en PostgreSQL
4. **Variables de entorno**: NUNCA commitear `.env` al repositorio

---

*Desarrollado como MVP para Transportes Génesis © 2024*
