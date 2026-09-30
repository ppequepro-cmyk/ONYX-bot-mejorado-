module.exports = {
  command: "ping",
  async handler(conn, { message }) {
    const jid = message.key.remoteJid;
    const start = Date.now();
    await conn.sendMessage(jid, {
      text: "🏓 *PONG*\n\n🟢 ONYX-BOT está funcionando.\n⚡ Respuesta: " + (Date.now() - start) + " ms"
    }, { quoted: message });
  }
};
