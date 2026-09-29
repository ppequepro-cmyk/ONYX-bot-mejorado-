const fs=require("fs");const {prefix}=require("./settings.js");const path="./database.json";const chalk=require("chalk");const pathPlugins="./plugins";let plugins={};
function readDB(){try{return JSON.parse(fs.readFileSync(path,"utf8"))}catch{return{groups:{},comads:0,users:0}}}
function writeDB(d){fs.writeFileSync(path,JSON.stringify(d,null,2),"utf8")}
function incrementComms(){const d=readDB();d.comads=(d.comads||0)+1;writeDB(d)}
function incrementGrups(){const d=readDB();d.groupsCount=(d.groupsCount||0)+1;writeDB(d)}
function incrementUsers(){const d=readDB();d.users=(d.users||0)+1;writeDB(d)}
function getWelcomeStatus(g){return readDB().groups[g]?.welcomeStatus||"off"}
function setWelcomeStatus(g,s){const d=readDB();d.groups=d.groups||{};d.groups[g]=d.groups[g]||{};d.groups[g].welcomeStatus=s;writeDB(d)}
async function sendText(c,t,x,o={}){await c.sendMessage(t,{text:x,...o})}
async function sendImage(c,t,i,caption=""){await c.sendMessage(t,{image:i,caption})}
async function sendSticker(c,t,s){await c.sendMessage(t,{sticker:s})}
async function sendAudio(c,t,a,ptt=false){await c.sendMessage(t,{audio:a,ptt})}
async function sendVideo(c,t,v,caption=""){await c.sendMessage(t,{video:v,caption})}
async function sendMedia(c,t,m,caption="",type="image"){if(type==="image")return sendImage(c,t,m,caption);if(type==="sticker")return sendSticker(c,t,m);if(type==="audio")return sendAudio(c,t,m);if(type==="video")return sendVideo(c,t,m,caption);return sendText(c,t,"Tipo de mensaje no soportado")}
async function sendMessage(c,t,m,type="text"){if(type==="text")return sendText(c,t,m);if(type==="image")return sendImage(c,t,m);if(type==="sticker")return sendSticker(c,t,m);if(type==="audio")return sendAudio(c,t,m);if(type==="video")return sendVideo(c,t,m);return sendText(c,t,"Tipo de mensaje no soportado")}
function loadPlugins(){plugins={};for(const file of fs.readdirSync(pathPlugins)){if(!file.endsWith(".js")||file.startsWith("_"))continue;try{const full="./"+pathPlugins+"/"+file;delete require.cache[require.resolve(full)];const command=require(full);if(command?.command&&typeof command.handler==="function"){const key=String(command.command).toLowerCase().replace(/^\//,"");if(!plugins[key])plugins[key]=command}else if(Array.isArray(command?.commands)&&typeof command.handler==="function"){for(const cmd of command.commands){const key=String(cmd||"").toLowerCase().replace(/^\//,"");if(key&&!plugins[key])plugins[key]={...command,command:key}}}else console.warn("Plugin inválido:",file)}catch(e){console.error("Error cargando",file,e.message)}}console.log("🔌 Plugins:",Object.keys(plugins).sort().join(", ")||"ninguno")}
fs.watch(pathPlugins,{recursive:true},(eventType,filename)=>{if(filename?.endsWith(".js"))loadPlugins()});loadPlugins();
async function logEvent(conn,m,type,user="Desconocido",groupName=""){console.log(chalk.bold.cyan("━━━━━━━━━━ ONYX LOGS ━━━━━━━━━━")+"\n"+chalk.blue("│⏰ ")+chalk.green(new Date().toLocaleString("es-MX",{timeZone:"America/Mexico_City"}))+"\n"+chalk.cyan("│📑 ")+chalk.white(type)+(m.key.remoteJid?.endsWith("@g.us")?"\n"+chalk.green("│👥 ")+chalk.white(groupName)+" ➜ "+m.key.remoteJid:"\n"+chalk.magenta("│💌 ")+chalk.white(user)))}
async function handleMessage(conn,message){const msg=message.message,key=message.key,from=key.remoteJid;if(!from||!msg)return;const group=from.endsWith("@g.us"),user=key.participant||from;let groupName="";if(group){try{groupName=(await conn.groupMetadata(from)).subject}catch{}}const body=msg.conversation||msg.extendedTextMessage?.text||msg.imageMessage?.caption||msg.videoMessage?.caption||null;
if(group&&!key.fromMe){
    try{
        const normalizeId=(x)=>String(x||"").split(":")[0].split("@")[0].toLowerCase();
        const context=msg.extendedTextMessage?.contextInfo||msg.imageMessage?.contextInfo||msg.videoMessage?.contextInfo||{};
        const mentioned=context.mentionedJid||[];
        const botIds=[conn.user?.id,conn.user?.lid].filter(Boolean).map(normalizeId);
        const isBotMentioned=mentioned.some(j=>botIds.includes(normalizeId(j)));
        if(isBotMentioned){
            const sender=user;
            const senderTag="@"+normalizeId(sender);
            await conn.sendMessage(from,{text:"🔔 *¡ONYX-BOT fue mencionado!*\\n\\n👤 "+senderTag+" me ha etiquetado en el grupo.\\n💬 *"+String(body||"").replace(/\\*/g,"")+"*\\n\\n🖤 *Aquí estoy, atento a tu mensaje.*\\n⚡ *Mención detectada correctamente.*",mentions:[sender]});
        }
    }catch(e){console.error("Error en notificación de mención:",e.message)}
}
if(!body||!body.startsWith(prefix))return;const parts=body.slice(prefix.length).trim().split(/ +/);const name=(parts.shift()||"").toLowerCase();if(!name||!plugins[name])return;try{await plugins[name].handler(conn,{message,args:parts});incrementComms();await logEvent(conn,message,"Comando: "+name,user,groupName)}catch(e){console.error("❌ Error /"+name+":",e);try{await conn.sendMessage(from,{text:"⚠️ Ocurrió un error al ejecutar el comando."})}catch{}}}
async function handleGroupEvents(conn,update){const{id,participants=[],action}=update;const d=readDB();d.groups=d.groups||{};if(!d.groups[id]){d.groups[id]={welcomeStatus:"off",goodbyeStatus:"off",antilink:"off",warnings:{}};writeDB(d)}if(action==="add"&&getWelcomeStatus(id)==="on"){let name="grupo";try{name=(await conn.groupMetadata(id)).subject}catch{}for(const p of participants)await sendText(conn,id,"👋 Bienvenido @"+p.split("@")[0]+" a *"+name+"*",{mentions:[p]})}if(action==="remove"&&d.groups[id].goodbyeStatus==="on")for(const p of participants)await sendText(conn,id,"👋 Hasta luego @"+p.split("@")[0]+".",{mentions:[p]})}
module.exports={handleMessage,handleGroupEvents,sendMedia,sendMessage,incrementComms,incrementGrups,incrementUsers,getWelcomeStatus,setWelcomeStatus};