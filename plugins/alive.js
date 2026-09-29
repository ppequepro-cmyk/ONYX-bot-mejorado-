async function handler(conn,{message}){await conn.sendMessage(message.key.remoteJid,{text:"🟢 ONYX-BOT está vivo y operativo."},{quoted:message})}
module.exports={command:"alive",handler};