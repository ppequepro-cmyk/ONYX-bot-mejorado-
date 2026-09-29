const ADMIN_REQUIRES = new Set([
  "kickuser","adduser","promoteuser","demoteuser","mutechat","unmutechat","cerrarchat","abrirchat","soloadmins","todoschat",
  "setgruponombre","setgrupodesc","setreglas","setwelcome","setgoodbye","welcomeon","welcomeoff","goodbyeon","goodbyeoff",
  "antilinkon","antilinkoff","warnuser","unwarnuser","clearwarnings","resetwarnings","anuncio","configgrupo"
]);

const commands = ["grupo","infogrupo","idgrupo","linkgrupo","revokelink","adminsgrupo","miembrosgrupo","tagall","hidetag","tagadmins","kickuser","adduser","promoteuser","demoteuser","mutechat","unmutechat","cerrarchat","abrirchat","soloadmins","todoschat","setgruponombre","setgrupodesc","reglasgrupo","setreglas","setwelcome","getwelcome","setgoodbye","getgoodbye","welcomeon","welcomeoff","goodbyeon","goodbyeoff","antilinkon","antilinkoff","warnuser","unwarnuser","warningsuser","clearwarnings","listwarnings","resetwarnings","anuncio","encuesta","adminsinfo","ownergrupo","creadorgrupo","tipochat","horariogrupo","notasgrupo","comandosgrupo","seguridadgrupo","configgrupo"];

const state = global.__ONYX_GROUP_STATE || (global.__ONYX_GROUP_STATE = {
  rules: Object.create(null),
  welcome: Object.create(null),
  goodbye: Object.create(null),
  warnings: Object.create(null),
  antilink: Object.create(null)
});

const jidUser = (message) => message.key.participant || message.participant || message.key.remoteJid;
const isGroup = (message) => String(message.key.remoteJid || "").endsWith("@g.us");
const getMeta = async (conn, jid) => conn.groupMetadata(jid);
const admins = (meta) => new Set((meta.participants || []).filter(p => p.admin === "admin" || p.admin === "superadmin").map(p => p.id));
const senderIsAdmin = (meta, message) => admins(meta).has(jidUser(message));
const botIsAdmin = (meta, conn) => { const raw=String(conn.user?.id||"").split(":")[0]; const bot=raw.includes("@")?raw:raw+"@s.whatsapp.net"; return admins(meta).has(bot); };

function targetFrom(args, message) {
  const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentioned[0]) return mentioned[0];
  const n = String(args[0] || "").replace(/\D/g, "");
  return n ? n + "@s.whatsapp.net" : null;
}

async function requireGroup(conn, message) {
  if (!isGroup(message)) throw new Error("Este comando solo funciona en grupos.");
  return getMeta(conn, message.key.remoteJid);
}

async function requireAdmin(conn, message) {
  const meta = await requireGroup(conn, message);
  if (!senderIsAdmin(meta, message)) throw new Error("Solo los administradores pueden usar este comando.");
  if (!botIsAdmin(meta, conn)) throw new Error("Necesito ser administrador para ejecutar esta acción.");
  return meta;
}

async function send(conn, message, text) {
  return conn.sendMessage(message.key.remoteJid, { text }, { quoted: message });
}

async function handler(conn, { message, args }) {
  const c = String(message.command || "").toLowerCase();
  try {
    const meta = await requireGroup(conn, message);
    const jid = message.key.remoteJid;
    const participants = meta.participants || [];
    const adminList = participants.filter(p => p.admin).map(p => p.id);
    const mentions = (message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []);
    
    if (c === "grupo") return send(conn, message, "👥 ONYX-BOT\nGrupo: " + (meta.subject || "Sin nombre") + "\nMiembros: " + participants.length + "\nAdmins: " + adminList.length + "\nID: " + jid);
    if (c === "infogrupo") return send(conn, message, "📋 *INFO DEL GRUPO*\nNombre: " + (meta.subject || "Sin nombre") + "\nMiembros: " + participants.length + "\nAdmins: " + adminList.length + "\nCreado: " + (meta.creation ? new Date(meta.creation * 1000).toLocaleString("es-MX") : "No disponible"));
    if (c === "idgrupo") return send(conn, message, "🆔 " + jid);
    if (c === "adminsgrupo") return send(conn, message, "👑 *ADMINISTRADORES*\n" + adminList.map((x,i)=> (i+1)+". @"+x.split("@")[0]).join("\n"),);
    if (c === "miembrosgrupo") return send(conn, message, "👥 Miembros: " + participants.length + "\n\n" + participants.map((p,i)=>(i+1)+". @"+p.id.split("@")[0]).join("\n"));
    if (c === "ownergrupo") {
      const owner = participants.find(p => p.admin === "superadmin")?.id;
      return send(conn, message, owner ? "👑 Creador: @"+owner.split("@")[0] : "No pude identificar al creador.");
    }
    if (c === "creadorgrupo") return send(conn, message, "👑 Creador: " + (participants.find(p => p.admin === "superadmin")?.id ? "@"+participants.find(p => p.admin === "superadmin").id.split("@")[0] : "No disponible"));
    if (c === "tipochat") return send(conn, message, "👥 Este chat es un grupo de WhatsApp.");
    if (c === "horariogrupo") return send(conn, message, "🕒 Horario: sin restricción configurada.");
    if (c === "comandosgrupo") return send(conn, message, "👥 Usa /menu para ver la sección GRUPOS y el catálogo completo de ONYX-BOT.");
    if (c === "seguridadgrupo") return send(conn, message, "🛡️ Seguridad\nAntienlace: " + (state.antilink[jid] ? "ON" : "OFF") + "\nAdvertencias registradas: " + Object.keys(state.warnings[jid] || {}).length);
    if (c === "notasgrupo") return send(conn, message, "📝 Sistema de notas de grupo disponible mediante la configuración del bot.");
    
    if (c === "linkgrupo") {
      const code = await conn.groupInviteCode(jid);
      return send(conn, message, "🔗 Enlace del grupo:\nhttps://chat.whatsapp.com/" + code);
    }
    if (c === "revokelink") {
      await requireAdmin(conn, message);
      await conn.groupRevokeInvite(jid);
      return send(conn, message, "🔐 Enlace de invitación revocado.");
    }
    if (c === "tagall" || c === "hidetag") {
      const text = args.join(" ").trim() || "Atención grupo.";
      const tagged = participants.map(p => p.id);
      return conn.sendMessage(jid, { text: text + "\n\n" + tagged.map(x=>"@"+x.split("@")[0]).join(" "), mentions: tagged }, { quoted: message });
    }
    if (c === "tagadmins") {
      return conn.sendMessage(jid, { text: "👑 Administradores:\n" + adminList.map(x=>"@"+x.split("@")[0]).join("\n"), mentions: adminList }, { quoted: message });
    }
    
    const target = targetFrom(args, message);
    if (["kickuser","adduser","promoteuser","demoteuser","warnuser","unwarnuser","warningsuser","clearwarnings"].includes(c) && !target && !["warningsuser","clearwarnings"].includes(c)) {
      return send(conn, message, "⚠️ Menciona a un usuario o proporciona su número.");
    }
    if (c === "kickuser") {
      await requireAdmin(conn,message); await conn.groupParticipantsUpdate(jid,[target],"remove"); return send(conn,message,"👢 Usuario expulsado.");
    }
    if (c === "adduser") {
      await requireAdmin(conn,message); await conn.groupParticipantsUpdate(jid,[target],"add"); return send(conn,message,"➕ Solicitud de adición enviada.");
    }
    if (c === "promoteuser") {
      await requireAdmin(conn,message); await conn.groupParticipantsUpdate(jid,[target],"promote"); return send(conn,message,"⬆️ Usuario promovido a administrador.");
    }
    if (c === "demoteuser") {
      await requireAdmin(conn,message); await conn.groupParticipantsUpdate(jid,[target],"demote"); return send(conn,message,"⬇️ Usuario degradado de administrador.");
    }
    if (c === "mutechat" || c === "soloadmins") {
      await requireAdmin(conn,message); await conn.groupSettingUpdate(jid,"announcement"); return send(conn,message,"🔒 Grupo configurado para que solo administradores envíen mensajes.");
    }
    if (c === "unmutechat" || c === "todoschat") {
      await requireAdmin(conn,message); await conn.groupSettingUpdate(jid,"not_announcement"); return send(conn,message,"🔓 Todos los participantes pueden enviar mensajes.");
    }
    if (c === "cerrarchat") {
      await requireAdmin(conn,message); await conn.groupSettingUpdate(jid,"announcement"); return send(conn,message,"🔒 Chat cerrado para participantes.");
    }
    if (c === "abrirchat") {
      await requireAdmin(conn,message); await conn.groupSettingUpdate(jid,"not_announcement"); return send(conn,message,"🔓 Chat abierto para todos.");
    }
    if (c === "setgruponombre") {
      await requireAdmin(conn,message); const name=args.join(" ").trim(); if(!name) return send(conn,message,"Usa /setgruponombre Nuevo nombre"); await conn.groupUpdateSubject(jid,name); return send(conn,message,"✏️ Nombre actualizado.");
    }
    if (c === "setgrupodesc") {
      await requireAdmin(conn,message); const desc=args.join(" ").trim(); if(!desc) return send(conn,message,"Usa /setgrupodesc Nueva descripción"); await conn.groupUpdateDescription(jid,desc); return send(conn,message,"📝 Descripción actualizada.");
    }
    if (c === "reglasgrupo" || c === "getwelcome" || c === "getgoodbye") {
      const key=c==="reglasgrupo"?"rules":c==="getwelcome"?"welcome":"goodbye";
      return send(conn,message,state[key][jid] || "⚪ No hay configuración guardada.");
    }
    if (c === "setreglas" || c === "setwelcome" || c === "setgoodbye") {
      await requireAdmin(conn,message); const key=c==="setreglas"?"rules":c==="setwelcome"?"welcome":"goodbye"; const val=args.join(" ").trim(); if(!val) return send(conn,message,"Escribe el texto que quieres guardar."); state[key][jid]=val; return send(conn,message,"✅ Configuración guardada.");
    }
    if (c === "welcomeon" || c === "welcomeoff") { await requireAdmin(conn,message); state.welcome[jid]=c==="welcomeon"; return send(conn,message,"👋 Bienvenida: "+(state.welcome[jid]?"ON":"OFF")); }
    if (c === "goodbyeon" || c === "goodbyeoff") { await requireAdmin(conn,message); state.goodbye[jid]=c==="goodbyeon"; return send(conn,message,"👋 Despedida: "+(state.goodbye[jid]?"ON":"OFF")); }
    if (c === "antilinkon" || c === "antilinkoff") { await requireAdmin(conn,message); state.antilink[jid]=c==="antilinkon"; return send(conn,message,"🔗 Antienlace: "+(state.antilink[jid]?"ON":"OFF")); }
    if (c === "warnuser") {
      await requireAdmin(conn,message); const key=target; state.warnings[jid] ||= Object.create(null); state.warnings[jid][key]=(state.warnings[jid][key]||0)+1; return send(conn,message,"⚠️ Advertencia registrada: "+state.warnings[jid][key]);
    }
    if (c === "unwarnuser") {
      await requireAdmin(conn,message); const key=target; state.warnings[jid] ||= Object.create(null); state.warnings[jid][key]=Math.max(0,(state.warnings[jid][key]||0)-1); return send(conn,message,"✅ Advertencia retirada. Total: "+state.warnings[jid][key]);
    }
    if (c === "warningsuser") {
      const key=target || jidUser(message); const n=state.warnings[jid]?.[key]||0; return send(conn,message,"⚠️ Advertencias: "+n);
    }
    if (c === "clearwarnings" || c === "resetwarnings") {
      await requireAdmin(conn,message); if(c==="clearwarnings" && target){ state.warnings[jid] ||= Object.create(null); delete state.warnings[jid][target]; return send(conn,message,"🧹 Advertencias del usuario eliminadas."); } state.warnings[jid]=Object.create(null); return send(conn,message,"🧹 Advertencias del grupo reiniciadas.");
    }
    if (c === "anuncio") {
      await requireAdmin(conn,message); const text=args.join(" ").trim()||"📢 Anuncio del grupo."; const tagged=participants.map(p=>p.id); return conn.sendMessage(jid,{text:"📢 *ANUNCIO*\n\n"+text,mentions:tagged},{quoted:message});
    }
    if (c === "encuesta") return send(conn,message,"📊 Usa la función de encuesta de WhatsApp o indica las opciones con /poll.");
    if (c === "configgrupo") {
      await requireAdmin(conn,message); return send(conn,message,"⚙️ Configuración\nBienvenida: "+(state.welcome[jid]?"ON":"OFF")+"\nDespedida: "+(state.goodbye[jid]?"ON":"OFF")+"\nAntienlace: "+(state.antilink[jid]?"ON":"OFF")+"\nSolo admins: revisa el estado de mensajes del grupo.");
    }
    return send(conn,message,"🛠️ Comando de grupo disponible.");
  } catch (e) {
    return send(conn,message,"❌ "+(e.message || "No se pudo ejecutar el comando."));
  }
}

module.exports = { commands, handler };
