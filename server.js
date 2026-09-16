const { spawn } = require("child_process");

const port = process.env.PORT || "20128";
console.log(`[Infrlo] Starting 9router on port ${port}...`);

const child = spawn(
  "npx",
  ["9router", "-n", "-l", "--skip-update", "-p", port, "-H", "0.0.0.0"],
  {
    stdio: "inherit",
    shell: true,
    env: process.env,
  }
);

child.on("exit", (code) => {
  console.log(`[Infrlo] 9router exited with code ${code}`);
  process.exit(code || 0);
});
