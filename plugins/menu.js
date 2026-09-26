const { obtenerUsuario } = require("../usuarios");
const { obtenerPlan } = require("../sistemas/premium");

async function handler(conn, { message }) {
    const jid = message.key.remoteJid;
    const usuarioJid =
        message.key.participant ||
        jid;

    const usuario = obtenerUsuario(usuarioJid) || {};
    const plan = obtenerPlan(usuarioJid);

    const nombre =
        message.pushName ||
        usuario.nombre ||
        "Usuario";

    const menu = `
╔══════════════════════════════╗
║        ☠️  ONYX-BOT  ☠️       ║
╚══════════════════════════════╝

        ◈ SYSTEM ONLINE ◈
     ⚡ IA • GRUPOS • CONTROL ⚡

╭━━━━━━〔 👤 USUARIO 〕━━━━━━╮
┃ ◈ Nombre: ${nombre}
┃ ◈ Plan: ${plan.toUpperCase()}
┃ ◈ Estado: 🟢 ONLINE
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━━━〔 🧠 ONYX,IA 〕━━━━━━╮
┃ ◈ /ia <texto>
┃ ◈ /iareset
┃ ◈ /aichat
┃ ◈ /preguntar
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━━━〔 👥 GRUPOS 〕━━━━━━╮
┃ ◈ /tagall
┃ ◈ /hidetag
┃ ◈ /kick
┃ ◈ /promote
┃ ◈ /demote
┃ ◈ /welcome on
┃ ◈ /welcome off
┃ ◈ /link
┃ ◈ /infogrupo
╰━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━〔 ⚔️ PERFIL & RANK 〕━━━━╮
┃ ◈ /perfil
┃ ◈ /nivel
┃ ◈ /rank
┃ ◈ /exp
┃ ◈ /top
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━━━〔 🎮 GAMES 〕━━━━━━╮
┃ ◈ /dado
┃ ◈ /coin
┃ ◈ /8ball
┃ ◈ /reto
┃ ◈ /quiz
┃ ◈ /suerte
╰━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━━━〔 ⚙️ UTILIDADES 〕━━━━╮
┃ ◈ /ping
┃ ◈ /info
┃ ◈ /menu
┃ ◈ /sticker
┃ ◈ /toimg
┃ ◈ /tts
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━━━〔 💎 PREMIUM 〕━━━━━━╮
┃ ◈ /plan
┃ ◈ /premium
┃ ◈ /beneficios
┃ ◈ /estado
╰━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━━━〔 👑 OWNER 〕━━━━━━╮
┃ ◈ /addprem
┃ ◈ /delprem
┃ ◈ /broadcast
┃ ◈ /restart
┃ ◈ /stats
╰━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━━━〔 ⚡ ONYX CORE 〕━━━━━━╮
┃ ◈ Inteligencia artificial
┃ ◈ Automatización para grupos
┃ ◈ Sistema de perfiles
┃ ◈ Sistema Premium
┃ ◈ Entretenimiento
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╔══════════════════════════════╗
║                              ║
║       「 SOMOS ONYX 」        ║
║       「 SOMOS LEGIÓN 」      ║
║                              ║
║   「 NO BUSCAMOS SER VISTOS 」║
║ 「 BUSCAMOS SER RECORDADOS 」 ║
║                              ║
╚══════════════════════════════╝

             ı.ᴀᴍ.oɴʏxᴋıɴɢ👑
`;

    await conn.sendMessage(jid, {
        text: menu,
        quoted: message
    });
}

module.exports = {
    command: "menu",
    handler
};
