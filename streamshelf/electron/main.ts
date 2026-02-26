import { app, BrowserWindow } from "electron";
import path from "node:path";

const isDev = process.env.NODE_ENV !== "production";
const appUrl = isDev ? "http://localhost:3100" : `file://${path.join(__dirname, "../.next/server/app/index.html")}`;

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1520,
    height: 960,
    minWidth: 1024,
    minHeight: 700,
    title: "StreamShelf",
    backgroundColor: "#090b12",
    webPreferences: {
      contextIsolation: true,
      sandbox: true
    }
  });

  if (isDev) {
    void win.loadURL(appUrl);
    win.webContents.openDevTools({ mode: "detach" });
    return;
  }

  void win.loadURL("http://localhost:3100");
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
