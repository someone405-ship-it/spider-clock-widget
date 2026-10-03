const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  shell,
  ipcMain,
  screen
} = require("electron");
const path = require("path");
const fs = require("fs");

// Single instance — second launch focuses existing widget
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

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
  // Simple orange circle as tray icon (no external file needed)
  const size = 16;
  const img = nativeImage.createEmpty();
  try {
    // 1x1 PNG orange pixel scaled — Electron accepts data URL via createFromDataURL on newer versions
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAHklEQVQ4T2NkYGD4z0ABYBzVMKoBVAOGahyNGjA0DQAACG0BAe2b8JkAAAAASUVORK5CYII=",
      "base64"
    );
    return nativeImage.createFromBuffer(png).resize({ width: size, height: size });
  } catch {
    return nativeImage.createEmpty();
  }
}

function applyWidgetMode(win, enabled) {
  if (!win || win.isDestroyed()) return;
  win.setAlwaysOnTop(!!enabled, "floating");
  win.setSkipTaskbar(!!enabled);
  win.setVisibleOnAllWorkspaces(!!enabled, { visibleOnFullScreen: true });
  if (enabled) {
    win.setMinimizable(false);
  } else {
    win.setMinimizable(true);
  }
  saveStore({ widgetMode: !!enabled });
}

function createWindow() {
  const store = loadStore();
  const display = screen.getPrimaryDisplay().workAreaSize;
  const width = store.width || 280;
  const height = store.height || 320;
  const x = store.x != null ? store.x : Math.max(20, display.width - width - 40);
  const y = store.y != null ? store.y : 40;

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    minWidth: 160,
    minHeight: 180,
    backgroundColor: "#a34a01",
    title: "Spider Clock Widget",
    frame: true,
    autoHideMenuBar: true,
    transparent: false,
    resizable: true,
    hasShadow: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, "electron-preload.js")
    }
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    const widgetOn = store.widgetMode !== false; // default ON for desktop widget feel
    applyWidgetMode(mainWindow, widgetOn);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Remember position/size
  const persistBounds = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const b = mainWindow.getBounds();
    saveStore({ x: b.x, y: b.y, width: b.width, height: b.height });
  };
  mainWindow.on("moved", persistBounds);
  mainWindow.on("resized", persistBounds);

  // Close → hide to tray (does NOT quit — stays until you Exit from tray)
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
      label: "Desktop widget mode (always on top)",
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
      label: "Exit (remove from PC until you open again)",
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
}

function createTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip("Spider Clock Widget");
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
  // Default: start with Windows so it "spawns" and stays
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

// Do not quit when window closed — tray keeps process alive
app.on("window-all-closed", (e) => {
  // keep running in tray on Windows/Linux
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("activate", () => {
  if (!mainWindow) createWindow();
  else mainWindow.show();
});
