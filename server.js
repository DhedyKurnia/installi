const path = require("path");
const net = require("net");

const targetPort = parseInt(process.env.PORT, 10) || 3000;
process.env.NODE_ENV = "production";
process.env.HOSTNAME = "0.0.0.0";
process.env.PORT = targetPort.toString();

console.log(`[Infrlo] Booting 9router Next.js on port ${targetPort}...`);

const routerDir = path.dirname(require.resolve("9router/package.json"));
const appDir = path.join(routerDir, "app");

process.chdir(appDir);
require(path.join(appDir, "server.js"));

// Proxy listener: bridge common PaaS ports to targetPort
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
