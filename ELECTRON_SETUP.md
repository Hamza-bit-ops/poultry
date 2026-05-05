# Electron Desktop Setup

This project is now configured to run as a cross-platform desktop app with Electron.

Current repository folders:

- `frontend` (acts as **client** React app)
- `backend` (acts as **server** Express API)
- `electron` (Electron main/preload)

If you prefer exact names `client` and `server`, you can rename `frontend -> client` and `backend -> server` later and update script paths.

## Added structure

```txt
/electron
  main.js
  preload.js
  /assets
    icon.png
/frontend
/backend
```

## Security defaults

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- Renderer gets limited bridge via `preload.js`

## How backend integration works

- Electron starts backend as a child process (`backend/src/server.js`) on port `5000`
- In development Electron loads React from `http://127.0.0.1:5173`
- In production Electron loads `frontend/dist/index.html`
- Frontend API base URL resolves to:
  1. `VITE_API_URL` (if set)
  2. `window.electronAPI.apiBaseUrl` (desktop mode)
  3. `/api` fallback (web + Vite proxy)

## Development

Install dependencies for all parts:

```bash
npm install
npm run install:all
```

Run desktop app in development mode:

```bash
npm run dev
```

## Production build

Build installer for Windows:

```bash
npm run build
```

Output will be generated in `release/` as an `.exe` installer (NSIS target).

## Useful scripts

- `npm run dev` -> React dev server + Electron
- `npm run build:frontend` -> build React static files
- `npm run build` / `npm run dist` -> package desktop app
- `npm run start` -> run Electron in local mode
