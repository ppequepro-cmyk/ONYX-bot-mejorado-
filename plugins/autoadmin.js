const fs = require("fs");
const DB = "./database.json";
const { esOwner } = require("../sistemas/premium");

function readDB() {
  try { return JSON.parse(fs.readFileSync(DB, "utf8")); }
  catch { return { groups: {} }; }
}
function writeDB(db) { fs.writeFileSync(DB, JSON.stringify(db, null, 2), "utf8"); }
function norm(jid) { return String(jid || "").split(":")[0].toLowerCase(); }

async function handler(conn, { message, args }) {
  const jid = message.key.remoteJid;
  const sender = message.key.participant || jid;

  if (!esOwner(sender)) {
    return conn.sendMessage(jid, { text: "⛔ /autoadmin es exclusivo del owner." }, { quoted: message });
  }
  if (!jid.endsWith("@g.us")) {
    return conn.sendMessage(jid, { text: "⚠️ /autoadmin solo funciona dentro de un grupo." }, { quoted: message });
  }

  const action = String(args[0] || "status").toLowerCase();
  const db = readDB();
  db.groups = db.groups || {};
  db.groups[jid] = db.groups[jid] || {};

  if (action === "off" || action === "disable") {
    db.groups[jid].autoAdmin = false;
    writeDB(db);
    return conn.sendMessage(jid, { text: "🔴 Auto Admin desactivado para este grupo." }, { quoted: message });
  }

  if (action === "status" || action === "estado") {
    const enabled = db.groups[jid].autoAdmin === true;
    return conn.sendMessage(jid, {
      text: "⚙️ *AUTO ADMIN*\n\nEstado: " + (enabled ? "🟢 ACTIVADO" : "🔴 DESACTIVADO")
    }, { quoted: message });
  }

  if (!["on", "enable", "activar"].includes(action)) {
    return conn.sendMessage(jid, {
      text: "Uso:\n/autoadmin on\n/autoadmin off\n/autoadmin status"
    }, { quoted: message });
  }

  try {
    const meta = await conn.groupMetadata(jid);
    const botIds = [conn.user?.id, conn.user?.lid].map(norm).filter(Boolean);
    const ownerIds = [sender].map(norm).filter(Boolean);

    const botParticipant = meta.participants.find(p => botIds.includes(norm(p.id)));
    const ownerParticipant = meta.participants.find(p => ownerIds.includes(norm(p.id)));

    const ownerIsAdmin = !!ownerParticipant && ["admin", "superadmin"].includes(ownerParticipant.admin);
    const botIsAdmin = !!botParticipant && ["admin", "superadmin"].includes(botParticipant.admin);

    if (!ownerIsAdmin) {
      return conn.sendMessage(jid, {
        text: "⚠️ El owner debe ser administrador del grupo. WhatsApp no permite que ONYX se promueva solo."
      }, { quoted: message });
    }

    if (!botIsAdmin) {
      const target = botParticipant?.id || conn.user?.id;
      if (!target) throw new Error("No se pudo determinar el JID del bot.");
      await conn.groupParticipantsUpdate(jid, [target], "promote");
    }

    db.groups[jid].autoAdmin = true;
    writeDB(db);

    return conn.sendMessage(jid, {
      text: "👑 *AUTO ADMIN ACTIVADO*\n\n✅ ONYX-BOT tiene permisos de administrador.\n💾 La configuración quedó guardada para este grupo."
    }, { quoted: message });
  } catch (e) {
    console.error("❌ /autoadmin:", e);
    return conn.sendMessage(jid, {
      text: "❌ No pude activar Auto Admin. Comprueba que el owner sea administrador y que WhatsApp permita la promoción."
    }, { quoted: message });
  }
}

module.exports = { command: "autoadmin", handler };