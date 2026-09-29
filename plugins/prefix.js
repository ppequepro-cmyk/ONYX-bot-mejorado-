async function handler(conn,{message}){await conn.sendMessage(message.key.remoteJid,{text:"⚙️ Prefijo actual: /"},{quoted:message})}
module.exports={command:"prefix",handler};