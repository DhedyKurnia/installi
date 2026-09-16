const path = require("path");

// Infrlo / PaaS environment configuration
process.env.NODE_ENV = "production";
process.env.HOSTNAME = "0.0.0.0";
process.env.PORT = process.env.PORT || "3000";

console.log(`[Infrlo] Booting 9router on ${process.env.HOSTNAME}:${process.env.PORT}...`);

const routerDir = path.dirname(require.resolve("9router/package.json"));
const appDir = path.join(routerDir, "app");

process.chdir(appDir);
require(path.join(appDir, "server.js"));
