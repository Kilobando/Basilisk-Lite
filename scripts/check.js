import fs from "node:fs";
import path from "node:path";

const required = ["web/index.html", "relay/server.js"];
const missing = required.filter((file) => !fs.existsSync(path.join(process.cwd(), file)));

if (missing.length) {
  console.error("Missing required files:", missing.join(", "));
  process.exit(1);
}

console.log("Repository check passed.");
