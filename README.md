# Basilisk Lite (minimal Electron starter)

This is a minimal, single-file Electron app. Double-clicking the packaged binary opens an empty window—no UI or backend yet.

## Quick start (dev)
1. Install [Node.js 18+](https://nodejs.org/) and clone/unzip the project.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the app in development:
   ```bash
   npm start
   ```

## Build a double-clickable app
Run the packaging command on the target OS (so Windows for `.exe`, macOS for `.app`, Linux for binaries):
```bash
# Current OS/arch (simplest)
npm run package:current

# Windows
npm run package:win

# macOS (Apple Silicon)
npm run package:mac

# Linux
npm run package:linux
```

Outputs land in `dist/`. The binary inside `dist/BasiliskLite-<platform>-<arch>/` can be double-clicked to open the blank Electron window.

If you just want a double-clickable app:
- Run `npm install`
- Run `npm run package:current`
- Open the folder printed in the terminal (inside `dist/`) and double-click the app (`.exe` on Windows, `.app` on macOS, or the binary on Linux).
