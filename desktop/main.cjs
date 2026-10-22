const { app, BrowserWindow, Menu, shell, session } = require('electron');
const origin = 'https://nossom-teal.vercel.app';
function safeExternal(url) {
  try {
    const u = new URL(url);
    if (u.protocol === 'https:') void shell.openExternal(u.href);
  } catch {}
}
function start() {
  const win = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 800,
    minHeight: 640,
    title: 'NOSSOM',
    backgroundColor: '#080c10',
    autoHideMenuBar: true,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    safeExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    try {
      if (new URL(url).origin !== origin) {
        event.preventDefault();
        safeExternal(url);
      }
    } catch {
      event.preventDefault();
    }
  });
  void win.loadURL(origin + '/studio');
}
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((contents, permission, callback, details) => {
    let trusted = false;
    try {
      trusted = new URL(details.requestingUrl || contents.getURL()).origin === origin;
    } catch {}
    callback(
      trusted &&
        permission === 'media' &&
        (details.mediaTypes || []).length > 0 &&
        (details.mediaTypes || []).every((kind) => kind === 'audio'),
    );
  });
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      { label: 'NOSSOM', submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }] },
      {
        label: 'Editar',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' },
        ],
      },
      {
        label: 'Visualizar',
        submenu: [
          { role: 'reload' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { role: 'togglefullscreen' },
        ],
      },
    ]),
  );
  start();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) start();
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
