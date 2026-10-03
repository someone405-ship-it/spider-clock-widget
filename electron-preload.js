// Preload bridge (reserved for future native widget controls)
const { contextBridge } = require("electron");
contextBridge.exposeInMainWorld("spiderDesktop", {
  isDesktop: true
});
