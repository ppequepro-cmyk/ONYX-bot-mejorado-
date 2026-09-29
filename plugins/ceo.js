const CEO_TEXT = `「♛」 Redes del CEO
│ CEO › ONYX,KING
│ Contacto › +1 (320) 210-9768
│ Estado › 🟢 Activo
├───────────────
│ Facebook › https://www.facebook.com/share/1EKiEY1QT1/
│ Instagram › https://www.instagram.com/gw_emma?igsh=ZHpwaTF1emZ5MDQ5
│ TikTok › https://www.tiktok.com/@pequepequepro?_r=1&_t=ZS-987fkNvTAsC
╰────────────

💬 Chat directo › https://wa.me/13202109768`;

async function handler(conn, { message }) {
  const jid = message.key.remoteJid;
  await conn.sendMessage(jid, { text: CEO_TEXT }, { quoted: message });
}

module.exports = {
  command: "ceo",
  handler
};
