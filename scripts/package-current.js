const packager = require("electron-packager");
const path = require("node:path");

(async () => {
  const platform = process.platform;
  const arch = process.arch;

  console.log(`Packaging for ${platform}-${arch}...`);

  const appPaths = await packager({
    dir: path.resolve(__dirname, ".."),
    out: path.resolve(__dirname, "..", "dist"),
    overwrite: true,
    platform,
    arch,
    icon: undefined, // add icon if you have one (ico/icns/png)
    name: "BasiliskLite",
  });

  console.log("Package created at:", appPaths);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
