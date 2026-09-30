const fs = require("fs");
const path = require("path");

const sessionDir = path.join(__dirname, "sessions");
if (!fs.existsSync(sessionDir)) {
  console.log("ℹ️ No existe sessions/. Se creará al iniciar ONYX.");
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(__dirname, "sessions-backup-relink-" + stamp);

fs.renameSync(sessionDir, backupDir);
fs.mkdirSync(sessionDir, { recursive: true });

console.log("✅ Sesión actual apartada de forma segura.");
console.log("📦 Respaldo:", backupDir);
console.log("🆕 sessions/ nueva y vacía.");
console.log("");
console.log("IMPORTANTE:");
console.log("1. Inicia ONYX con PM2.");
console.log("2. ONYX mostrará QR o código de vinculación.");
console.log("3. Vincula nuevamente el número del bot desde WhatsApp > Dispositivos vinculados.");
console.log("4. NO borres el respaldo hasta comprobar /ping y /apitest.");
