# 🚌 Transportes Génesis

Sistema de gestión de transporte escolar — MVP completo desplegable en Railway.

## Inicio Rápido

```bash
# Backend
cd backend && cp .env.example .env
# Editar .env con tu DATABASE_URL
npm install && npx prisma migrate dev --name init && node src/prisma/seed.js && npm run dev

# Frontend (nueva terminal)
cd frontend && cp .env.example .env
npm install && npm run dev
```

**Credenciales demo:** `admin@genesis.gt` / `admin123`

📖 Ver documentación completa en [`docs/README.md`](docs/README.md)
