const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  shell,
  screen
} = require("electron");
const path = require("path");
const fs = require("fs");

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

const STORE = path.join(app.getPath("userData"), "widget-settings.json");

function loadStore() {
  try {
    return JSON.parse(fs.readFileSync(STORE, "utf8"));
  } catch {
    return {};
  }
}

function saveStore(data) {
  try {
    fs.writeFileSync(STORE, JSON.stringify({ ...loadStore(), ...data }, null, 2));
  } catch (_) {}
}

let mainWindow = null;
let tray = null;
let isQuitting = false;

function createTrayIcon() {
  try {
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAHklEQVQ4T2NkYGD4z0ABYBzVMKoBVAOGahyNGjA0DQAACG0BAe2b8JkAAAAASUVORK5CYII=",
      "base64"
    );
    return nativeImage.createFromBuffer(png).resize({ width: 16, height: 16 });
  } catch {
    return nativeImage.createEmpty();
  }
}

function applyWidgetMode(win, enabled) {
  if (!win || win.isDestroyed()) return;
  win.setAlwaysOnTop(!!enabled, "screen-saver");
  win.setSkipTaskbar(!!enabled);
  win.setVisibleOnAllWorkspaces(!!enabled, { visibleOnFullScreen: true });
  // Always keep resizable & movable
  win.setResizable(true);
  win.setMovable(true);
  win.setMinimumSize(140, 160);
  saveStore({ widgetMode: !!enabled });
}

function injectDesktopChrome() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.executeJavaScript(`
    (function () {
      document.documentElement.classList.add('desktop-electron');
      document.body.classList.add('desktop-electron');
      if (!document.getElementById('desktop-drag-bar')) {
        var bar = document.createElement('div');
        bar.id = 'desktop-drag-bar';
        bar.title = 'Drag to move · resize from edges/corners';
        document.body.appendChild(bar);
      }
      if (!document.getElementById('desktop-resize-hint')) {
        var h = document.createElement('div');
        h.id = 'desktop-resize-hint';
        h.textContent = '↘';
        h.title = 'Drag corner or edges to resize';
        document.body.appendChild(h);
      }
    })();
  `).catch(() => {});
}

function createWindow() {
  const store = loadStore();
  const work = screen.getPrimaryDisplay().workArea;
  const width = Math.max(160, store.width || 280);
  const height = Math.max(180, store.height || 320);
  let x = store.x != null ? store.x : Math.max(work.x + 20, work.x + work.width - width - 40);
  let y = store.y != null ? store.y : work.y + 40;

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    minWidth: 140,
    minHeight: 160,
    maxWidth: 900,
    maxHeight: 900,
    backgroundColor: "#a34a01",
    title: "Spider Clock Widget",
    // Frameless so the whole surface is a widget; still resizable on Windows
    frame: false,
    transparent: false,
    resizable: true,
    movable: true,
    maximizable: false,
    fullscreenable: false,
    thickFrame: true,
    hasShadow: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, "electron-preload.js")
    }
  });

  // Explicitly enable resize/move (some hosts default oddly with frame:false)
  mainWindow.setResizable(true);
  mainWindow.setMovable(true);
  mainWindow.setMinimumSize(140, 160);

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    const widgetOn = store.widgetMode !== false;
    applyWidgetMode(mainWindow, widgetOn);
    injectDesktopChrome();
  });

  mainWindow.webContents.on("did-finish-load", () => {
    injectDesktopChrome();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const persistBounds = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const b = mainWindow.getBounds();
    saveStore({ x: b.x, y: b.y, width: b.width, height: b.height });
  };
  mainWindow.on("moved", persistBounds);
  mainWindow.on("resized", persistBounds);
  mainWindow.on("will-resize", () => {
    // ensure resize is never blocked
  });

  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function buildTrayMenu() {
  const store = loadStore();
  const widgetOn = store.widgetMode !== false;
  return Menu.buildFromTemplate([
    {
      label: "Show Spider Clock",
      click: () => {
        if (!mainWindow) createWindow();
        else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: "Hide",
      click: () => {
        if (mainWindow) mainWindow.hide();
      }
    },
    { type: "separator" },
    {
      label: "Always on top (widget mode)",
      type: "checkbox",
      checked: widgetOn,
      click: (item) => {
        if (mainWindow) applyWidgetMode(mainWindow, item.checked);
        else saveStore({ widgetMode: item.checked });
      }
    },
    {
      label: "Start with Windows",
      type: "checkbox",
      checked: !!app.getLoginItemSettings().openAtLogin,
      click: (item) => {
        app.setLoginItemSettings({
          openAtLogin: item.checked,
          openAsHidden: true,
          name: "Spider Clock Widget"
        });
        saveStore({ openAtLogin: item.checked });
      }
    },
    { type: "separator" },
    {
      label: "Exit",
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
}

function createTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip("Spider Clock — drag to move, edges to resize");
  tray.setContextMenu(buildTrayMenu());
  tray.on("double-click", () => {
    if (!mainWindow) createWindow();
    else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  const store = loadStore();
  if (store.openAtLogin !== false) {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: false,
      name: "Spider Clock Widget"
    });
  }
  createTray();
  createWindow();
});

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  } else createWindow();
});

app.on("window-all-closed", () => {});
app.on("before-quit", () => {
  isQuitting = true;
});
app.on("activate", () => {
  if (!mainWindow) createWindow();
  else mainWindow.show();
});
