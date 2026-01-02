#!/usr/bin/env node
/**
 * One-file bootstrap that installs dependencies (if missing) and launches the Electron window.
 */
const { existsSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const projectRoot = __dirname;
const mainEntry = path.join(projectRoot, "main.js");

function ensureDeps() {
  const electronPath = resolveSafe("electron");
  if (electronPath && existsSync(path.join(projectRoot, "node_modules"))) {
    return;
  }
  console.log("Installing dependencies (npm install)...");
  const res = spawnSync("npm", ["install"], { cwd: projectRoot, stdio: "inherit" });
  if (res.status !== 0) {
    console.error("Failed to install dependencies.");
    process.exit(res.status || 1);
  }
}

function resolveSafe(mod) {
  try {
    return require.resolve(mod, { paths: [projectRoot] });
  } catch (err) {
    return null;
  }
}

function runApp() {
  const electronBin = path.join(
    projectRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "electron.cmd" : "electron"
  );
  const result = spawnSync(electronBin, [mainEntry], {
    cwd: projectRoot,
    stdio: "inherit",
    env: { ...process.env },
  });
  if (result.error) {
    console.error("Failed to start Electron:", result.error);
    process.exit(1);
  }
  process.exit(result.status ?? 0);
}

ensureDeps();
runApp();
