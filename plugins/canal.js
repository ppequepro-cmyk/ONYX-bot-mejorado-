const CANAL_ONYX = "https://whatsapp.com/channel/0029Vb9DAtxBlHphhwfBkM1i";

async function handler(conn, { message }) {
  const jid = message.key.remoteJid;

  const payload = {
    text: "📢 *CANAL OFICIAL DE ONYX*\n\nSigue las novedades y actualizaciones de ONYX-BOT.",
    footer: "ONYX-BOT · Canal oficial",
    templateButtons: [
      {
        index: 1,
        urlButton: {
          displayText: "📢 Abrir canal de ONYX",
          url: CANAL_ONYX
        }
      }
    ]
  };

  try {
    await conn.sendMessage(jid, payload, { quoted: message });
  } catch (error) {
    console.error("❌ Error enviando botón del canal:", error?.message || error);
    await conn.sendMessage(
      jid,
      {
        text: "📢 *CANAL OFICIAL DE ONYX*\n\nNo pude mostrar el botón en este cliente. Abre el canal desde WhatsApp."
      },
      { quoted: message }
    );
  }
}

module.exports = {
  command: "canal",
  handler
};
