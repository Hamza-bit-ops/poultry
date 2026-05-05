const path = require('path');
const { app, BrowserWindow, Menu, shell } = require('electron');
const { spawn } = require('child_process');
const isDev = require('electron-is-dev');

let mainWindow = null;
let backendProcess = null;

function getBackendEntry() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'src', 'server.js');
  }
  return path.join(__dirname, '..', 'backend', 'src', 'server.js');
}

function startBackend() {
  if (backendProcess) return;

  const backendEntry = getBackendEntry();
  const spawnCommand = app.isPackaged ? process.execPath : 'node';
  const spawnArgs = app.isPackaged ? [backendEntry] : [backendEntry];
  const spawnEnv = {
    ...process.env,
    PORT: process.env.PORT || '5000',
    ELECTRON_RUN_AS_NODE: app.isPackaged ? '1' : process.env.ELECTRON_RUN_AS_NODE,
  };

  const backendCwd = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'backend')
    : path.join(__dirname, '..', 'backend');

  backendProcess = spawn(spawnCommand, spawnArgs, {
    env: spawnEnv,
    cwd: backendCwd,
    stdio: 'inherit',
    windowsHide: true,
  });

  backendProcess.on('exit', () => {
    backendProcess = null;
  });
}

function stopBackend() {
  if (!backendProcess) return;
  backendProcess.kill();
  backendProcess = null;
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [{ role: 'quit', label: 'Exit' }],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Project Repository',
          click: () => shell.openExternal('https://github.com/Hamza-bit-ops/poultry'),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  const devUrl = process.env.ELECTRON_START_URL || 'http://127.0.0.1:5173';
  if (isDev) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackend();
  createMenu();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  stopBackend();
});
