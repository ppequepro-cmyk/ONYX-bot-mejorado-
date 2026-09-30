const { esOwner } = require("../sistemas/premium");
const { requestCode } = require("../subbots/manager");

module.exports = {
  command: "code",
  async handler(conn, { message }) {
    const jid = message.key.remoteJid;
    const sender = [
      message.key.participant,
      message.key.participantAlt,
      message.key.remoteJid,
      message.key.remoteJidAlt
    ].filter(Boolean).map(String);

    if (!esOwner(sender)) {
      return conn.sendMessage(jid, {
        text: "⛔ Solo el owner puede generar códigos de subbot."
      }, { quoted: message });
    }

    const numeroJid = sender
      .map(x => x.split(":")[0])
      .find(x => x.endsWith("@s.whatsapp.net"));

    if (!numeroJid) {
      return conn.sendMessage(jid, {
        text: "❌ No pude detectar el número. Usa /code desde un chat privado del número que quieres vincular."
      }, { quoted: message });
    }

    const phone = numeroJid.split("@")[0].replace(/\D/g, "");

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
          "🔢 Número detectado: +" + phone + "\n" +
          "🔐 Código: *" + bot.pairingCode + "*\n\n" +
          "En ese número: WhatsApp → Dispositivos vinculados → Vincular dispositivo → Vincular con número de teléfono."
      }, { quoted: message });
    } catch (e) {
      return conn.sendMessage(jid, {
        text: "❌ No se pudo generar el código: " + e.message
      }, { quoted: message });
    }
  }
};
