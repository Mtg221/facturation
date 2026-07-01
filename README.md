# Facturation — Plateforme SaaS de gestion de factures

Application multi-tenant de facturation professionnelle pour le marché sénégalais.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | NestJS + Prisma + PostgreSQL |
| Frontend | React + Vite + React Query + Tailwind CSS |
| Auth | JWT (access token en mémoire + refresh token httpOnly cookie) |
| PDF | Puppeteer + Handlebars |
| Upload | Cloudinary |
| Cache | Redis |
| Déploiement | Render (backend Docker) + Vercel (frontend) + Neon (PostgreSQL) |

---

## Architecture multi-tenant

Chaque société a ses données complètement isolées via une colonne `societeId` sur toutes les entités (clients, factures, produits, paiements, secteurs, utilisateurs).

### Rôles

| Rôle | Description |
|------|-------------|
| `SUPERADMIN` | Accès plateforme — gère les sociétés et leurs admins |
| `ADMIN` | Accès total à sa société |
| `MANAGER` | Gestion opérationnelle |
| `COMPTABLE` | Factures, paiements, rapports |
| `CAISSIER` | Paiements uniquement |
| `LECTURE` | Lecture seule |

---

## Démarrage local

### Prérequis
- Node.js 20+
- Docker + Docker Compose

### Installation

```bash
# Cloner le projet
git clone https://github.com/Mtg221/facturation.git
cd facturation

# Démarrer PostgreSQL et Redis
docker-compose up -d postgres redis

# Backend
cd backend
cp .env.example .env   # configurer les variables
npm install
npx prisma migrate deploy
node prisma/seed-prod.js
npm run start:dev

# Frontend (autre terminal)
cd frontend
npm install
npm run dev
```

### Variables d'environnement backend (`.env`)

```env
DATABASE_URL=postgresql://facturation:facturation_secret@localhost:5432/facturation_db
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=...        # min 32 caractères
JWT_REFRESH_SECRET=...       # min 32 caractères
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## Déploiement (Render + Vercel)

### Backend (Render)
- Type : Web Service Docker
- Start command : géré par `start.sh` (migrate → seed → démarrage)
- Variables d'environnement à configurer manuellement sur Render :

```
DATABASE_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
REDIS_URL
CORS_ORIGINS=https://votre-frontend.vercel.app
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

### Frontend (Vercel)
- Variable d'environnement :
```
VITE_API_URL=https://votre-backend.onrender.com
```

---

## Fonctionnalités

- **Facturation** : création, envoi, duplication, numérotation automatique par société
- **Clients** : gestion avec secteurs d'activité, export CSV
- **Produits/Services** : catalogue par société
- **Paiements** : suivi avec génération de reçus PDF
- **Dashboard** : KPIs, graphiques revenus, top clients (cache Redis)
- **Rapports** : revenus par période, impayés
- **Logo** : upload via Cloudinary, affiché sur les PDFs
- **Multi-société** : isolation complète des données par `societeId`

---

## Structure du projet

```
facturation/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed-prod.js
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── societes/
│   │   │   ├── clients/
│   │   │   ├── factures/
│   │   │   ├── paiements/
│   │   │   ├── produits/
│   │   │   ├── dashboard/
│   │   │   ├── reports/
│   │   │   ├── users/
│   │   │   ├── pdf/
│   │   │   └── files/
│   │   └── common/
│   └── start.sh
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── auth/
│       │   ├── superadmin/
│       │   ├── settings/
│       │   └── ...
│       ├── services/
│       └── contexts/
├── docker-compose.yml
└── render.yaml
```
