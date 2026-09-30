const fs = require("fs");

const DB = "./database.json";

function readDB() {
  try { return JSON.parse(fs.readFileSync(DB, "utf8")); }
  catch { return { groups: {}, chatAuto: {} }; }
}

function writeDB(data) {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2), "utf8");
}

module.exports = {
  commands: ["chat"],
  async handler(conn, { message, args }) {
    const jid = message.key.remoteJid;
    if (jid.endsWith("@g.us")) {
      return conn.sendMessage(jid, { text: "🤖 /chat solo controla la IA automática en privado." });
    }

    const action = (args[0] || "status").toLowerCase();
    const db = readDB();
    db.chatAuto = db.chatAuto || {};

    if (action === "on") {
      db.chatAuto[jid] = true;
      writeDB(db);
      return conn.sendMessage(jid, { text: "🧠 ONYX,IA automática activada en este chat privado." });
    }

    if (action === "off") {
      db.chatAuto[jid] = false;
      writeDB(db);
      return conn.sendMessage(jid, { text: "🔕 ONYX,IA automática desactivada. Usa /chat on para activarla." });
    }

    if (action === "status") {
      const enabled = db.chatAuto[jid] !== false;
      return conn.sendMessage(jid, { text: "🧠 IA automática privada: " + (enabled ? "✅ ACTIVADA" : "❌ DESACTIVADA") });
    }

    return conn.sendMessage(jid, { text: "Uso: /chat on | /chat off | /chat status" });
  }
};