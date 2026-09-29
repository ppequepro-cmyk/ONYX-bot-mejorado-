const startedAt=Date.now();
function format(ms){const s=Math.floor(ms/1000),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),x=s%60;return (d?d+"d ":"")+(h?h+"h ":"")+(m?m+"m ":"")+x+"s"}
async function handler(conn,{message}){await conn.sendMessage(message.key.remoteJid,{text:"⏱️ ONYX-BOT\nUptime: "+format(Date.now()-startedAt)},{quoted:message})}
module.exports={command:"uptime",handler};