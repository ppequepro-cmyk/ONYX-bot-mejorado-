const fs = require("fs");
const path = require("path");

const sessionDir = path.join(__dirname, "sessions");
const backupDir = path.join(__dirname, "sessions-backup-repair-" + Date.now());

if (!fs.existsSync(sessionDir)) {
  console.error("❌ No existe la carpeta sessions.");
  process.exit(1);
}

fs.mkdirSync(backupDir, { recursive: true });

for (const file of fs.readdirSync(sessionDir)) {
  const src = path.join(sessionDir, file);
  const dest = path.join(backupDir, file);
  fs.cpSync(src, dest, { recursive: true });
}

for (const file of fs.readdirSync(sessionDir)) {
  if (file === "creds.json") continue;
  fs.rmSync(path.join(sessionDir, file), { recursive: true, force: true });
}

console.log("✅ Reparación preparada.");
console.log("📦 Respaldo creado en:", backupDir);
console.log("🔐 creds.json se conservó intacto.");
console.log("🧹 Se limpiaron estados Signal/app-state para regenerarlos.");
console.log("➡️ Ahora reinicia ONYX con PM2.");
