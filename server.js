const path = require("path");
const fs = require("fs");
const net = require("net");

const targetPort = parseInt(process.env.PORT, 10) || 3000;
process.env.NODE_ENV = "production";
process.env.HOSTNAME = "0.0.0.0";
process.env.PORT = targetPort.toString();

const rootDir = __dirname;
const routerDir = path.dirname(require.resolve("9router/package.json"));
const appDir = path.join(routerDir, "app");
const appModules = path.join(appDir, "node_modules");

// 1. Copy sql.js wasm to where standalone Next.js looks for it
try {
  const rootWasm = path.join(rootDir, "node_modules", "sql.js", "dist", "sql-wasm.wasm");
  const targetWasmDir = path.join(appModules, "sql.js", "dist");
  if (fs.existsSync(rootWasm)) {
    fs.mkdirSync(targetWasmDir, { recursive: true });
    fs.copyFileSync(rootWasm, path.join(targetWasmDir, "sql-wasm.wasm"));
    console.log("[Infrlo] Successfully placed sql-wasm.wasm into 9router runtime.");
  }
} catch (e) {
  console.warn("[Infrlo] Failed to copy sql-wasm.wasm:", e.message);
}

// 2. Link root node_modules packages (better-sqlite3, sql.js) into 9router/app/node_modules
["better-sqlite3", "sql.js"].forEach(pkg => {
  try {
    const src = path.join(rootDir, "node_modules", pkg);
    const dst = path.join(appModules, pkg);
    if (fs.existsSync(src) && !fs.existsSync(dst)) {
      try {
        fs.symlinkSync(src, dst, "junction");
      } catch (err) {
        // Fallback: cp
        fs.cpSync(src, dst, { recursive: true });
      }
      console.log(`[Infrlo] Linked ${pkg} into 9router app modules.`);
    }
  } catch (e) {
    console.warn(`[Infrlo] Linking ${pkg} warning:`, e.message);
  }
});

// 3. Register paths
const nodePaths = [
  path.join(rootDir, "node_modules"),
  appModules,
  process.env.NODE_PATH || ""
].filter(Boolean).join(path.delimiter);

process.env.NODE_PATH = nodePaths;
require("module").Module._initPaths();

console.log(`[Infrlo] Booting 9router Next.js on port ${targetPort}...`);

process.chdir(appDir);
require(path.join(appDir, "server.js"));

// Proxy bridge: listen on common PaaS ports and pipe to targetPort
const portsToBridge = [80, 8080, 5000, 20128].filter(p => p !== targetPort);

portsToBridge.forEach(p => {
  try {
    const server = net.createServer(socket => {
      const client = net.connect(targetPort, "127.0.0.1", () => {
        socket.pipe(client).pipe(socket);
      });
      client.on("error", () => socket.destroy());
      socket.on("error", () => client.destroy());
    });
    server.on("error", () => {});
    server.listen(p, "0.0.0.0", () => {
      console.log(`[Infrlo] Proxy bridge listening on port ${p} -> ${targetPort}`);
    });
  } catch (e) {}
});
