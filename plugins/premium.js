const { activarPremium, esOwner } = require("../sistemas/premium");

async function handler(conn, { message, args }) {
    const jidOwner = message.key.participant || message.key.remoteJid;

    if (!esOwner(jidOwner)) {
        return conn.sendMessage(message.key.remoteJid, {
            text: "❌ Este comando solo puede usarlo el Owner."
        });
    }

    const mencionados = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    if (!mencionados.length) {
        return conn.sendMessage(message.key.remoteJid, {
            text: "⚠️ Menciona al usuario.\n\nEjemplo:\n/premium @usuario 5 days"
        });
    }

    const cantidad = parseInt(args[1]);

    if (!cantidad || cantidad <= 0) {
        return conn.sendMessage(message.key.remoteJid, {
            text: "⚠️ Indica una cantidad válida de días.\n\nEjemplo:\n/premium @usuario 5 days"
        });
    }

    const usuarioJid = mencionados[0];

    const usuario = activarPremium(usuarioJid, cantidad);

    if (!usuario) {
        return conn.sendMessage(message.key.remoteJid, {
            text: "❌ No se pudo activar Premium."
        });
    }

    await conn.sendMessage(message.key.remoteJid, {
        text:
            `💎 *ONYX PREMIUM ACTIVADO*\n\n` +
            `👤 Usuario: @${usuarioJid.split("@")[0]}\n` +
            `⏳ Duración: ${cantidad} ${cantidad === 1 ? "día" : "días"}\n` +
            `📅 Vence: ${new Date(usuario.fechaPremium).toLocaleString("es-MX")}`,
        mentions: [usuarioJid]
    });
}

module.exports = {
    command: "premium",
    handler
};
