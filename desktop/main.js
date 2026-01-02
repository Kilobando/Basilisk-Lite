// Minimal Electron shell to load the local messenger UI.
import { app, BrowserWindow } from "electron";
import path from "node:path";
import url from "node:url";

const isDev = process.env.NODE_ENV === "development";

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "#0f1115",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const indexPath = url.pathToFileURL(path.join(__dirname, "..", "web", "index.html")).href;
  win.loadURL(indexPath);

  if (isDev) {
    win.webContents.openDevTools({ mode: "detach" });
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
