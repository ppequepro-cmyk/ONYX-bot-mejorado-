const { obtenerUsuario, guardarUsuario } = require("../usuarios.js");
function getSender(message){return message.key.participant||message.key.remoteJid}
function isGroup(message){return message.key.remoteJid?.endsWith("@g.us")}
async function getMetadata(conn,jid){return conn.groupMetadata(jid)}
async function isAdmin(conn,message){if(!isGroup(message))return false;const md=await getMetadata(conn,message.key.remoteJid);const s=getSender(message);return md.participants.some(p=>p.id===s&&p.admin)}
async function isBotAdmin(conn,jid){const md=await getMetadata(conn,jid);const ids=[conn.user?.id,conn.user?.lid].filter(Boolean).map(x=>x.split(":")[0]);return md.participants.some(p=>ids.includes(p.id.split("@")[0])&&p.admin)}
function targets(message){const c=message.message?.extendedTextMessage?.contextInfo||{};return [...new Set([...(c.mentionedJid||[]),...(c.participant?[c.participant]:[])])]}
function dbRead(){const fs=require("fs");try{return JSON.parse(fs.readFileSync("./database.json","utf8"))}catch{return{comads:0,users:0,groups:{}}}}
function dbWrite(db){require("fs").writeFileSync("./database.json",JSON.stringify(db,null,2))}
module.exports={getSender,isGroup,getMetadata,isAdmin,isBotAdmin,targets,dbRead,dbWrite};