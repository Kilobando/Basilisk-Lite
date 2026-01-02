const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 600,
    backgroundColor: "#0f1115",
    title: "Basilisk Lite",
  });

  win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(`<html><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#0f1115;color:#e6ecf5;font-family:Inter,system-ui,sans-serif;"><h1>Electron window is running</h1></body></html>`));
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
