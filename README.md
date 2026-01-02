# Basilisk Lite (minimal Electron app)

This project opens a simple Electron window—no UI or backend yet.

## Quick start
1. Install [Node.js 18+](https://nodejs.org/) and clone/unzip the project.
2. From the project folder, install dependencies:
   ```bash
   npm install
   ```
3. Run the app:
   ```bash
   npm start
   ```
   An Electron window will open.

## Package (optional)
Run the packaging command on the target OS (Windows for `.exe`, macOS for `.app`, Linux for binaries):
```bash
npm run package:current  # build for your current OS/arch
```
Output goes to `dist/BasiliskLite-<platform>-<arch>/`.
