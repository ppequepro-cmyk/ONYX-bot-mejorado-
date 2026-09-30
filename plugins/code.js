const { esOwner } = require("../sistemas/premium");
const { requestCode } = require("../subbots/manager");

function limpiarNumero(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatearCodigo(value) {
  const raw = String(value || "").replace(/[^A-Za-z0-9]/g, "");
  if (raw.length === 6) return raw.slice(0, 3) + "-" + raw.slice(3);
  return String(value || "");
}

function numeroDesdeJid(value) {
  const raw = String(value || "").split(":")[0];
  if (!raw.endsWith("@s.whatsapp.net")) return "";
  return limpiarNumero(raw.split("@")[0]);
}

module.exports = {
  command: "code",
  async handler(conn, { message, args }) {
    const jid = message.key.remoteJid;
    const senderJids = [
      message.key.participant,
      message.key.participantAlt,
      message.key.remoteJid,
      message.key.remoteJidAlt
    ].filter(Boolean).map(String);

    if (!esOwner(senderJids)) {
      return conn.sendMessage(jid, {
        text: "⛔ Solo el owner puede generar códigos de subbot."
      }, { quoted: message });
    }

    let phone = limpiarNumero(args?.[0]);

    if (!phone && !jid.endsWith("@g.us")) {
      phone =
        numeroDesdeJid(jid) ||
        numeroDesdeJid(message.key.participant) ||
        numeroDesdeJid(message.key.remoteJidAlt);
    }

    if (!phone || phone.length < 8 || phone.length > 15) {
      return conn.sendMessage(jid, {
        text:
          "❌ No pude detectar un número válido.\n\n" +
          "Usa:\n" +
          "• /code 521234567890\n" +
          "• O /code desde el chat privado del número que quieres vincular."
      }, { quoted: message });
    }

    try {
      const bot = await requestCode(phone, async (id, sock, msg) => {
        try {
          const main = require("../main.js");
          await main.handleMessage(sock, msg);
        } catch (e) {
          console.error("Subbot " + id + ":", e.message);
        }
      });

      return conn.sendMessage(jid, {
        text:
          "📲 *CÓDIGO DE SUBBOT*\n\n" +
          "🔢 Número: +" + phone + "\n" +
          "🔐 Código: *" + formatearCodigo(bot.pairingCode) + "*\n\n" +
          "En ese número abre:\n" +
          "WhatsApp → Dispositivos vinculados → Vincular dispositivo → Vincular con número de teléfono.\n\n" +
          "⚠️ El código es temporal. Úsalo inmediatamente."
      }, { quoted: message });
    } catch (e) {
      return conn.sendMessage(jid, {
        text: "❌ No se pudo generar el código para +" + phone + ".\n\nMotivo: " + String(e.message || "error").slice(-1200)
      }, { quoted: message });
    }
  }
};
