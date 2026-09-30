const { obtenerUsuario } = require("../usuarios");
const { obtenerPlan } = require("../sistemas/premium");
const { commands: megaCommands } = require("./mega");

async function handler(conn, { message, args }) {
  const jid = message.key.remoteJid;
  const u = message.key.participant || jid;
  const user = obtenerUsuario(u) || {};
  const plan = obtenerPlan(u);
  const nombre = message.pushName || user.nombre || "Usuario";

  const size = 24;
  const total = Math.max(1, Math.ceil(megaCommands.length / size));
  const page = Math.max(1, Math.min(total, parseInt(args[0] || "1", 10) || 1));
  const shown = megaCommands.slice((page - 1) * size, page * size);

  const sections = [
    ["🧠 IA & AUTOMATIZACIÓN", ["/ia", "/iareset", "/chat on", "/chat off", "/chat status"]],
    ["👥 GRUPOS & MODERACIÓN", [
      "/grupo", "/infogrupo", "/idgrupo", "/linkgrupo", "/adminsgrupo",
      "/miembrosgrupo", "/tagall", "/hidetag", "/tagadmins", "/kickuser",
      "/adduser", "/promoteuser", "/demoteuser", "/mutechat", "/unmutechat",
      "/cerrarchat", "/abrirchat", "/soloadmins", "/todoschat", "/antilinkon",
      "/antilinkoff", "/warnuser", "/warningsuser", "/clearwarnings",
      "/welcomeon", "/welcomeoff", "/goodbyeon", "/goodbyeoff"
    ]],
    ["📥 MULTIMEDIA", [
      "/play", "/song", "/ytmp3", "/ytmp4", "/youtube", "/tiktok",
      "/tiktokmp4", "/igdl", "/twitterdl", "/facebookdl",
      "/pinterestdl", "/mediafire"
    ]],
    ["🛠️ SISTEMA", [
      "/ping", "/ram", "/uptime", "/runtime", "/health", "/stats",
      "/serverinfo", "/botinfo", "/version", "/time", "/date", "/jid"
    ]],
    ["💎 PREMIUM", ["/plan", "/premium", "/beneficios", "/premiuminfo"]],
    ["🤖 SUBBOTS", [
      "/subbot list", "/subbot create <nombre> <número>", "/subbot start <nombre>",
      "/subbot stop <nombre>", "/subbot remove <nombre>"
    ]],
    ["👑 OWNER", ["/ceo", "/addprem", "/delprem", "/autoadmin", "/restart", "/shutdown", "/reload", "/update"]]
  ];

  const header =
    "╭━━━〔 ☠️ ONYX-BOT 〕━━━╮\n" +
    "┃ 🖤 *Centro de comandos*\n" +
    "┃ 👤 " + nombre + "\n" +
    "┃ 💎 Plan: *" + String(plan).toUpperCase() + "*\n" +
    "╰━━━━━━━━━━━━━━━━━━━━╯";

  const quick = sections
    .map(([title, cmds]) => title + "\n" + cmds.map(x => "  › " + x).join("\n"))
    .join("\n\n");

  const catalog =
    "📚 *CATÁLOGO COMPLETO*\n" +
    "Página *" + page + "/" + total + "* · *" + megaCommands.length + "* registrados\n\n" +
    shown.map((x, i) => String((page - 1) * size + i + 1).padStart(3, "0") + " › /" + x).join("\n");

  const footer =
    "\n\n━━━━━━━━━━━━━━━━━━━━\n" +
    "📌 Usa */menu 2*, */menu 3*... para navegar.\n" +
    "🧠 IA privada automática: */chat on|off|status*\n" +
    "👑 Owner: *ı.ᴀᴍ.oɴʏxᴋıɴɢ👑*";

  const menu = header + "\n\n" + quick + "\n\n" + catalog + footer;

  await conn.sendMessage(jid, { text: menu }, { quoted: message });
}

module.exports = { command: "menu", handler };
