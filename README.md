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

## Seguridad

- **Sesión**: el token JWT se guarda en `localStorage` y se envía en la cabecera
  `Authorization` (sin cookies, así que no hay CSRF). Dura poco (`JWT_EXPIRE_MINUTES` del
  backend, 24 h) y `AuthProvider` lo renueva mientras se usa la app, sin pasar del
  máximo de sesión (`SESION_MAX_DIAS`, 7 días).
- **CSP**: `pnpm build` añade al `index.html` una Content-Security-Policy estricta
  (`vite.config.ts`): solo scripts propios, estilos propios y de Google Fonts, y
  conexiones solo al origen de `VITE_API_URL`. Es lo que impide que un script inyectado
  robe el token. No se aplica en `pnpm dev`, porque el HMR necesita scripts inline.
- **Cabeceras del servidor**: las que no funcionan en `<meta>` (`frame-ancestors`, HSTS,
  `nosniff`…) están en `public/_headers`, que Cloudflare aplica. En otro hosting hay que
  configurarlas en el servidor.
- Si se añade un recurso externo nuevo (otra fuente, un CDN, imágenes remotas), hay que
  permitirlo en la CSP de `vite.config.ts` o el navegador lo bloqueará.

## Publicación (Cloudflare Workers)

Se publica como sitio estático en Cloudflare Workers, sin código de Worker:
`wrangler.jsonc` indica que sirva `dist/` y que cualquier ruta que no sea un archivo
devuelva `index.html` (React Router se encarga).

1. En Cloudflare: **Workers & Pages → Create → Import a repository** con este repo.
   El nombre del Worker debe coincidir con `name` de `wrangler.jsonc` (`matlog`).
2. Configuración del build:

   | Campo | Valor |
   |---|---|
   | Build command | `pnpm build` |
   | Deploy command | `npx wrangler deploy` (el de por defecto) |

3. **Settings → Build → Variables and secrets** (las del build, no las del Worker):

   | Variable | Valor |
   |---|---|
   | `VITE_API_URL` | La URL pública de la API en Railway, sin barra final |

   Si falta, `pnpm build` falla a propósito: el frontend no sabría dónde está la API.
4. Añadir el dominio del Worker (`https://matlog.<subdominio>.workers.dev`) a
   `CORS_ORIGINS` del backend.

Antes de publicar, comprobar que ninguna dependencia tiene vulnerabilidades conocidas:

```bash
pnpm install --frozen-lockfile
pnpm audit --prod
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
├── components/           # Layout, MenuUsuario, Volver, SelectorTecnicas y base (ui.tsx)
├── lib/                  # formato, calendario, paginación y navegación
└── pages/                # Acceso, Inicio, Clases (historial), ClaseDetalle, ClaseFormulario,
                          # Calendario, Perfil, Turnos y Usuarios (solo admins),
                          # Tecnicas, FichaTecnica, TecnicaFormulario
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
