/**
 * Removes generated Prisma engine folders so `prisma generate` can replace DLLs on Windows.
 * Run after stopping dev servers / Node processes that lock query_engine-windows.dll.node.
 */
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..", "..");
const candidates = [
  path.join(repoRoot, "node_modules", ".prisma"),
  path.join(repoRoot, "packages", "database", "node_modules", ".prisma"),
];

for (const dir of candidates) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    process.stdout.write(`Removed ${dir}\n`);
  }
}
