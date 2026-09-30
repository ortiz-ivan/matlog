# matlog

Frontend de **MatLog**: el historial de técnicas de las clases de BJJ. El backend está en el repo [`matlog-api`](../matlog-api), junto con la documentación funcional.

**Stack**: React 19 · TypeScript · Vite · React Router · TanStack Query · Tailwind CSS 4.

## Puesta en marcha

Requiere Node 24+, [pnpm](https://pnpm.io) y el backend corriendo.

```bash
pnpm install
cp .env.example .env     # ajustar si hace falta
pnpm dev                 # http://localhost:5180
```

Toda la configuración va en `.env` (nunca se sube al repo); `.env.example` es la plantilla documentada:

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL del backend, sin barra final. La app no arranca si falta. |
| `DEV_PORT` | Puerto de `pnpm dev`. Tiene que estar en `CORS_ORIGINS` del backend. |

Las variables `VITE_*` se incrustan en el JavaScript que llega al navegador: nunca pongas secretos ahí.

## Scripts

```bash
pnpm dev        # servidor de desarrollo
pnpm build      # comprobación de tipos + build de producción en dist/
pnpm lint       # oxlint
pnpm preview    # sirve el build
```

## Estructura

```text
src/
├── main.tsx              # QueryClient, AuthProvider
├── App.tsx               # rutas y protección por sesión
├── config.ts             # lectura y validación de .env
├── index.css             # Tailwind + paleta de la academia (@theme)
├── api/
│   ├── client.ts         # fetch con token, errores de la API
│   ├── queries.ts        # hooks de TanStack Query
│   └── types.ts          # espejo de los esquemas del backend
├── auth/                 # contexto de sesión (login, registro, logout)
├── components/           # Layout, SelectorTecnicas y componentes base (ui.tsx)
├── lib/formato.ts        # fechas, etiquetas en castellano, turno sugerido
└── pages/                # Acceso (login/registro), Clases, ClaseDetalle, ClaseFormulario
```

## Diseño

Mobile-first y solo en modo oscuro, con la paleta de la academia definida como tokens en `src/index.css`:

| Token | Color | Uso |
|---|---|---|
| `acento` | `#C4F000` | Acciones principales, selección, fechas |
| `acento-suave` | `#D8EC94` | Cajas de notas |
| `fondo` | `#000000` | Fondo |
| `texto` | `#FFFFFF` | Texto principal |
| `borde` / `borde-fuerte` | `#2A2A2A` / `#444444` | Separadores y bordes |
