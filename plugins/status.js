async function handler(conn,{message}){await conn.sendMessage(message.key.remoteJid,{text:"🟢 Estado: operativo"},{quoted:message})}
module.exports={command:"status",handler};