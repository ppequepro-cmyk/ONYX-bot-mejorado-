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
• /rules
• /grouplink
• /setname <nombre>
• /setdesc <descripción>

🛠️ *UTILIDADES*
• /ping
• /uptime
• /menu

🤖 *SUBBOTS*
• /subbot list
• /subbot create <nombre> <número>
• /subbot start <nombre>
• /subbot stop <nombre>
• /subbot remove <nombre>
• /subbot allow <nombre> <comando>
• /subbot deny <nombre> <comando>
• /subbot commands <nombre>

💎 *PREMIUM*
• /plan
• /premium
• /beneficios

👑 *OWNER*
• /addprem
• /delprem
• /restart

━━━━━━━━━━━━━━━━━━━━
        ı.ᴀᴍ.oɴʏxᴋıɴɢ👑`;await conn.sendMessage(jid,{image:{url:"https://raw.githubusercontent.com/Neveloopp/data/master/uploads/mulz7mll-edab24cdeeaf.jpg"},caption:menu,quoted:message})}
module.exports={command:"menu",handler};