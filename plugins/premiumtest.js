const { obtenerPlan } = require("../sistemas/premium");

async function handler(conn, { message }) {
    const jid = message.key.participant || message.key.remoteJid;
    const plan = obtenerPlan(jid);

    if (plan === "free") {
        return conn.sendMessage(message.key.remoteJid, {
            text: "💎 *COMANDO PREMIUM*\n\nEste comando es exclusivo para usuarios Premium.\n\n⭐ Actualiza tu plan para desbloquearlo."
        });
    }

    await conn.sendMessage(message.key.remoteJid, {
        text: "💎 *ONYX PREMIUM*\n\n🔥 Acceso Premium confirmado."
    });
}

module.exports = {
    command: "premiumtest",
    handler
};
