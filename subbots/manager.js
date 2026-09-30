const fs=require("fs");
const path=require("path");
const pino=require("pino");
const{default:makeWASocket,useMultiFileAuthState,fetchLatestBaileysVersion}=require("@whiskeysockets/baileys");
const ROOT="./subbots";const META=path.join(ROOT,"subbots.json");let sockets=new Map();let reconnecting=new Set();const delay=ms=>new Promise(r=>setTimeout(r,ms));
function ensure(){fs.mkdirSync(ROOT,{recursive:true});if(!fs.existsSync(META))fs.writeFileSync(META,JSON.stringify({bots:{}},null,2))}
function read(){ensure();try{return JSON.parse(fs.readFileSync(META,"utf8"))}catch{return{bots:{}}}}
function write(d){ensure();fs.writeFileSync(META,JSON.stringify(d,null,2))}
function safe(n){return String(n||"").toLowerCase().replace(/[^a-z0-9_-]/g,"").slice(0,32)}
const DEFAULT_BLOCKED=["subbot","restart","shutdown","update","reload","addprem","delprem"];
function isCommandAllowed(id,command){const b=read().bots[id];if(!b)return false;const c=String(command||"").toLowerCase();if(b.allowedCommands?.length)return b.allowedCommands.includes(c);return !DEFAULT_BLOCKED.includes(c)}
function setAllowedCommands(id,commands){const d=read();if(!d.bots[id])return false;d.bots[id].allowedCommands=[...new Set(commands.map(x=>String(x).toLowerCase().replace(/^\//,"")).filter(Boolean))];write(d);return true}
function getCommandPolicy(id){return read().bots[id]?.allowedCommands||null}
function list(){return Object.values(read().bots)}
function socketOptions(state,version){return{version,auth:state,logger:pino({level:"silent"}),browser:["ONYX-BOT","Chrome","1.0.0"],markOnlineOnConnect:false,syncFullHistory:false,generateHighQualityLinkPreview:false}}
function bind(id,sock,saveCreds,onMessage){
  sockets.set(id,sock);sock.ev.on("creds.update",saveCreds);
  sock.ev.on("connection.update",async u=>{
    const d=read(),bot=d.bots[id];if(!bot)return;
    if(u.connection==="open"){bot.status="online";bot.lastConnectedAt=new Date().toISOString();delete bot.pairingCode;write(d);reconnecting.delete(id);console.log("🟢 Subbot conectado:",id);return}
    if(u.connection==="close"){
      const shouldReconnect=bot.status==="online";bot.status="offline";bot.lastDisconnectAt=new Date().toISOString();write(d);sockets.delete(id);
      if(shouldReconnect&&!reconnecting.has(id)){reconnecting.add(id);console.log("🔄 Reconectando subbot:",id);setTimeout(async()=>{try{await startExisting(id,onMessage)}catch(e){console.error("❌ Reconexión de subbot "+id+":",e.message)}finally{reconnecting.delete(id)}},3000)}
      else console.error("Subbot "+id+" desconectado:",u.lastDisconnect?.error?.message||"connection closed");
    }
  });
  sock.ev.on("messages.upsert",async m=>{try{for(const msg of m.messages||[]){if(msg&&onMessage)await onMessage(id,sock,msg)}}catch(e){console.error("Subbot "+id+":",e.message)}})
}
function normalizePairingCode(value){
  return String(value||"").replace(/[^A-Za-z0-9]/g,"").toUpperCase();
}
function validPairingCode(value){
  const code=normalizePairingCode(value);
  return code.length>=6&&code.length<=12;
}
async function requestCode(phone,onMessage){
  ensure();
  const clean=String(phone||"").replace(/\D/g,"");
  if(clean.length<8||clean.length>15)throw Error("Número inválido. Usa el número completo con código de país.");
  const id=safe("subbot_"+clean);const d=read();
  if(d.bots[id]){
    const old=d.bots[id];
    if(old.status==="online")throw Error("Ya existe un subbot conectado para ese número.");
    throw Error("Ya existe un registro para ese número. Usa /subbot start "+id+" o elimina el registro antes de volver a vincularlo.");
  }
  const dir=path.join(ROOT,id,"sessions");fs.mkdirSync(dir,{recursive:true});
  const{state,saveCreds}=await useMultiFileAuthState(dir);const{version}=await fetchLatestBaileysVersion();
  const sock=makeWASocket(socketOptions(state,version));const bot={id,name:id,phone:clean,status:"pairing",createdAt:new Date().toISOString()};
  d.bots[id]=bot;write(d);bind(id,sock,saveCreds,onMessage);
  if(state.creds.registered){bot.status="online";write(read());return bot}
  let code=null,lastError=null;
  for(let attempt=1;attempt<=3&&!code;attempt++){
    try{
      await delay(attempt===1?2500:2000);
      if(state.creds.registered){bot.status="online";write(read());return bot}
      const received=await Promise.race([sock.requestPairingCode(clean),new Promise((_,reject)=>setTimeout(()=>reject(Error("timeout al solicitar pairing code")),15000))]);
      const normalized=normalizePairingCode(received);
      if(!validPairingCode(normalized))throw Error("WhatsApp devolvió un código de emparejamiento incompleto.");
      code=normalized;
    }catch(err){
      lastError=err;console.error("⚠️ Intento "+attempt+" de pairing para "+clean+":",err.message);
      if(attempt<3)await delay(2500);
    }
  }
  if(!code){
    try{sock.end(undefined)}catch{}sockets.delete(id);const x=read();delete x.bots[id];write(x);
    throw lastError||Error("No se pudo obtener el código de emparejamiento.");
  }
  bot.pairingCode=code;bot.status="pairing";bot.pairingUpdatedAt=new Date().toISOString();write(read());
  console.log("📲 Pairing code generado para",clean,":",bot.pairingCode);return bot;
}
async function create(name,phone,onMessage){
  ensure();const id=safe(name);if(!id)throw Error("Nombre inválido");const clean=String(phone||"").replace(/\D/g,"");if(clean.length<8||clean.length>15)throw Error("Número inválido. Usa el número completo con código de país.");
  const d=read();if(d.bots[id])throw Error("Ese subbot ya existe");const dir=path.join(ROOT,id,"sessions");fs.mkdirSync(dir,{recursive:true});
  const{state,saveCreds}=await useMultiFileAuthState(dir);const{version}=await fetchLatestBaileysVersion();const sock=makeWASocket(socketOptions(state,version));const bot={id,name:id,phone:clean,status:"pairing",createdAt:new Date().toISOString()};d.bots[id]=bot;write(d);bind(id,sock,saveCreds,onMessage);console.log("🤖 Creando subbot:",id,"con número",clean);
  if(state.creds.registered){bot.status="online";write(read());return bot}
  try{
    let code=null,lastError=null;
    for(let attempt=1;attempt<=3&&!code;attempt++){try{await delay(attempt===1?2500:2000);const received=await Promise.race([sock.requestPairingCode(clean),new Promise((_,reject)=>setTimeout(()=>reject(Error("timeout al solicitar pairing code")),15000))]);const normalized=normalizePairingCode(received);if(!validPairingCode(normalized))throw Error("WhatsApp devolvió un código de emparejamiento incompleto.");code=normalized}catch(err){lastError=err;console.error("⚠️ Intento "+attempt+" de pairing para "+id+":",err.message);if(attempt<3)await delay(2500)}}
    if(!code)throw lastError||Error("No se pudo obtener el código de emparejamiento");
    bot.pairingCode=code;bot.status="pairing";bot.pairingUpdatedAt=new Date().toISOString();write(read());console.log("📲 Pairing code generado para",id,":",code);return bot
  }catch(e){console.error("❌ Error creando subbot "+id+":",e.message);try{sock.end(undefined)}catch{}sockets.delete(id);const x=read();delete x.bots[id];write(x);throw e}
}
async function stop(id){const sock=sockets.get(id);if(sock){try{sock.end(undefined)}catch{}sockets.delete(id)}const d=read();if(d.bots[id]){d.bots[id].status="offline";write(d)}reconnecting.delete(id)}
async function remove(id){await stop(id);const d=read();if(!d.bots[id])return false;delete d.bots[id];write(d);return true}
async function startExisting(id,onMessage){const d=read(),bot=d.bots[id];if(!bot)return null;if(sockets.has(id))return bot;const dir=path.join(ROOT,id,"sessions");if(!fs.existsSync(path.join(dir,"creds.json"))){bot.status="pairing";write(d);return bot}const{state,saveCreds}=await useMultiFileAuthState(dir);const{version}=await fetchLatestBaileysVersion();const sock=makeWASocket(socketOptions(state,version));bind(id,sock,saveCreds,onMessage);bot.status=state.creds.registered?"starting":"pairing";write(read());return bot}
module.exports={create,requestCode,stop,remove,list,startExisting,isCommandAllowed,setAllowedCommands,getCommandPolicy};
