async function handler(conn,{message}){await conn.sendMessage(message.key.remoteJid,{text:"📦 ONYX-BOT v1.0.0"},{quoted:message})}
module.exports={command:"version",handler};