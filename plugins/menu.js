const{obtenerUsuario}=require("../usuarios");const{obtenerPlan}=require("../sistemas/premium");
async function handler(conn,{message}){const jid=message.key.remoteJid,u=message.key.participant||jid,user=obtenerUsuario(u)||{},plan=obtenerPlan(u),nombre=message.pushName||user.nombre||"Usuario";const menu=`╔══════════════════════════════╗
║        ☠️  ONYX-BOT  ☠️       ║
╚══════════════════════════════╝

👤 *USUARIO*
• Nombre: ${nombre}
• Plan: ${plan.toUpperCase()}

🧠 *ONYX,IA*
• /ia <texto>
• /iareset

👥 *GRUPOS*
• /tagall
• /hidetag
• /add 521XXXXXXXXXX
• /kick @usuario
• /promote @usuario
• /demote @usuario
• /mute @usuario
• /warn @usuario
• /welcome on|off
• /goodbye on|off
• /antilink on|off

⚙️ *UTILIDADES*
• /ping
• /menu

💎 *PREMIUM*
• /plan
• /premium
• /beneficios

👑 *OWNER*
• /addprem
• /delprem
• /restart

━━━━━━━━━━━━━━━━━━━━
        ı.ᴀᴍ.oɴʏxᴋıɴɢ👑`;await conn.sendMessage(jid,{text:menu,quoted:message})}
module.exports={command:"menu",handler};