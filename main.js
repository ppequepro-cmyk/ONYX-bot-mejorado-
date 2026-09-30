const fs=require("fs");const {prefix}=require("./settings.js");const path="./database.json";const chalk=require("chalk");const pathPlugins="./plugins";let plugins={};let ownerActivity=new Map();let botMessageIds=new Set();const OWNER_ACTIVE_MS=10*60*1000;
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
function registerPlugin(file){if(!file.endsWith(".js")||file.startsWith("_"))return;try{const full="./"+pathPlugins+"/"+file;delete require.cache[require.resolve(full)];const command=require(full);if(command?.disabled===true)return;if(command?.command&&typeof command.handler==="function"){const key=String(command.command).toLowerCase().replace(/^\//,"");if(!plugins[key])plugins[key]=command}else if(Array.isArray(command?.commands)&&typeof command.handler==="function"){for(const cmd of command.commands){const key=String(cmd||"").toLowerCase().replace(/^\//,"");if(key&&!plugins[key])plugins[key]={...command,command:key}}}else console.warn("Plugin inválido:",file)}catch(e){console.error("Error cargando",file,e.message)}}
function loadPlugins(){plugins={};const files=fs.readdirSync(pathPlugins).filter(file=>file.endsWith(".js")&&!file.startsWith("_"));const ordered=files.filter(file=>file!=="mega.js").sort((a,b)=>a.localeCompare(b));for(const file of ordered)registerPlugin(file);if(files.includes("mega.js"))registerPlugin("mega.js");console.log("🔌 Plugins:",Object.keys(plugins).sort().join(", ")||"ninguno")}
fs.watch(pathPlugins,{recursive:true},(eventType,filename)=>{if(filename?.endsWith(".js"))loadPlugins()});loadPlugins();
async function logEvent(conn,m,type,user="Desconocido",groupName=""){const location=m.key.remoteJid?.endsWith("@g.us");const log=chalk.bold.cyan("━━━━━━━━━━ ONYX LOGS ━━━━━━━━━━")+"\n"+chalk.blue("│⏰ ")+chalk.green(new Date().toLocaleString("es-MX",{timeZone:"America/Mexico_City"}))+"\n"+chalk.cyan("│📑 ")+chalk.white(type)+(location?"\n"+chalk.green("│👥 ")+chalk.white(groupName)+" ➜ "+m.key.remoteJid:"\n"+chalk.magenta("│💌 ")+chalk.white(user));console.log(log)}
async function handleMessage(conn, message) {
  const msg = message?.message;
  const key = message?.key;
  const from = key?.remoteJid;
  if (!from || !msg) return;

  if (key.fromMe) {
    if (!from.endsWith("@g.us") && !botMessageIds.has(key.id)) {
      ownerActivity.set(from, Date.now());
    }
    botMessageIds.delete(key.id);
    return;
  }

  const group = from.endsWith("@g.us");
  const user = key.participant || from;
  let groupName = "";

  if (group) {
    try {
      groupName = (await conn.groupMetadata(from)).subject || "";
    } catch {}
  }

  const buttonId =
    msg.buttonsResponseMessage?.selectedButtonId ||
    msg.templateButtonReplyMessage?.selectedId ||
    msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
    null;

  const body =
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    buttonId ||
    null;

  if (group) {
    try {
      const normalizeId = x =>
        String(x || "").split(":")[0].split("@")[0].toLowerCase();

      const context =
        msg.extendedTextMessage?.contextInfo ||
        msg.imageMessage?.contextInfo ||
        msg.videoMessage?.contextInfo ||
        {};

      const mentioned = context.mentionedJid || [];
      const botIds = [conn.user?.id, conn.user?.lid]
        .filter(Boolean)
        .map(normalizeId);

      if (mentioned.some(j => botIds.includes(normalizeId(j)))) {
        const sender = user;
        const senderTag = "@" + normalizeId(sender);

        await conn.sendMessage(
          from,
          {
            text:
              "🔔 *¡ONYX-BOT fue mencionado!*\n\n" +
              "👤 " + senderTag + " me ha etiquetado en el grupo.\n" +
              "💬 *" + String(body || "").replace(/\*/g, "") + "*\n\n" +
              "🖤 *Aquí estoy, atento a tu mensaje.*\n" +
              "⚡ *Mención detectada correctamente.*",
            mentions: [sender]
          }
        );
      }
    } catch (e) {
      console.error("Error en notificación de mención:", e.message);
    }
  }

  const imageMessage = msg.imageMessage || msg.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage || null;

  if (!body && !imageMessage) return;

  const textBody = String(body || "").trim();

  if (!textBody.startsWith(prefix)) {
    if (!group) {
      try {
        const d = readDB();
        const auto = d.chatAuto?.[from] !== false;

        if (
          auto &&
          (!ownerActivity.has(from) ||
            Date.now() - ownerActivity.get(from) > OWNER_ACTIVE_MS)
        ) {
          const { preguntarONYX, analizarImagen, buscarImagenes, mejorarImagen } = require("./ia/ia");

          if (imageMessage) {
            const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
            const chunks = [];
            const stream = await downloadContentFromMessage(imageMessage, "image");
            for await (const chunk of stream) chunks.push(chunk);
            const imageBuffer = Buffer.concat(chunks);

            const mejorarSolicitado = /(?:mejora|mejorar|mejórala|mejorala|mejorame|mejórame|mejorar esta|mejora esta|aumenta la calidad|sube la calidad|mejora la calidad)/i.test(textBody);

            if (mejorarSolicitado) {
              try {
                await conn.sendMessage(from, { text: "✨ Mejorando la imagen..." }, { quoted: message });
                const imagenMejorada = await mejorarImagen(imageBuffer);
                const sent = await conn.sendMessage(from, {
                  image: imagenMejorada,
                  caption: "✨ *ONYX,IA*\nImagen mejorada automáticamente."
                }, { quoted: message });
                if (sent?.key?.id) botMessageIds.add(sent.key.id);
              } catch (e) {
                console.error("❌ Mejora automática de imagen:", e.message);
                await conn.sendMessage(from, {
                  text: "❌ No pude mejorar la imagen. Verifica que FFmpeg esté instalado."
                }, { quoted: message });
              }
              return;
            }

            const instruccion = textBody || "Analiza esta imagen y dime qué ves.";
            const respuestaImagen = await analizarImagen(
              imageBuffer,
              imageMessage.mimetype || "image/jpeg",
              instruccion
            );

            if (respuestaImagen) {
              const sent = await conn.sendMessage(from, {
                text: "🧠 *ONYX,IA VISION*\n\n" + respuestaImagen,
                quoted: message
              });
              if (sent?.key?.id) botMessageIds.add(sent.key.id);
            }
            return;
          }

          const searchMatch = textBody.match(/^(?:busca|buscar|búscame|buscame|encuentra|mu[eé]strame)\s+(?:una\s+)?(?:imagen|foto|fotos|imágenes|imagenes)\s+(?:de\s+)?(.+)$/i);
          if (searchMatch) {
            const resultados = await buscarImagenes(searchMatch[1]);
            if (!resultados.length) {
              await conn.sendMessage(from, { text: "🔎 No encontré imágenes para esa búsqueda.", quoted: message });
              return;
            }
            for (const url of resultados) {
              await conn.sendMessage(from, {
                image: { url },
                caption: "🖼️ *ONYX,IA*\nBúsqueda: " + searchMatch[1]
              }, { quoted: message });
            }
            return;
          }
          const dir = "./memoria";

          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          const file =
            dir +
            "/" +
            from.replace(/[^a-zA-Z0-9]/g, "_") +
            ".json";

          let memoria = [];
          try {
            memoria = JSON.parse(fs.readFileSync(file, "utf8"));
          } catch {}

          const respuesta = await preguntarONYX(textBody, memoria);

          if (respuesta) {
            memoria.push({
              usuario: textBody,
              ia: respuesta
            });

            fs.writeFileSync(
              file,
              JSON.stringify(memoria.slice(-50), null, 2)
            );

            const sent = await conn.sendMessage(from, {
              text: "🧠 *ONYX,IA*\n\n" + respuesta,
              quoted: message
            });

            if (sent?.key?.id) {
              botMessageIds.add(sent.key.id);
            }
          }
        }
      } catch (e) {
        console.error(
          "❌ IA automática:",
          e.response?.data || e.message || e
        );
      }
    }

    return;
  }

  const parts = textBody
    .slice(prefix.length)
    .trim()
    .split(/ +/);

  const name = (parts.shift() || "").toLowerCase();

  if (!name || !plugins[name]) return;

  try {
    await plugins[name].handler(conn, {
      message: { ...message, command: name },
      args: parts
    });

    incrementComms();
    await logEvent(
      conn,
      message,
      "Comando: " + name,
      user,
      groupName
    );
  } catch (e) {
    console.error("❌ Error /" + name + ":", e);

    try {
      await conn.sendMessage(from, {
        text: "⚠️ Ocurrió un error al ejecutar el comando."
      });
    } catch {}
  }
}

async function handleGroupEvents(conn,update){const{id,participants=[],action}=update;const d=readDB();d.groups=d.groups||{};if(!d.groups[id]){d.groups[id]={welcomeStatus:"off",goodbyeStatus:"off",antilink:"off",warnings:{}};writeDB(d)}if(action==="add"&&getWelcomeStatus(id)==="on"){let name="grupo";try{name=(await conn.groupMetadata(id)).subject}catch{}for(const p of participants)await sendText(conn,id,"👋 Bienvenido @"+p.split("@")[0]+" a *"+name+"*",{mentions:[p]})}if(action==="remove"&&d.groups[id].goodbyeStatus==="on")for(const p of participants)await sendText(conn,id,"👋 Hasta luego @"+p.split("@")[0]+".",{mentions:[p]})}
module.exports={handleMessage,handleGroupEvents,sendMedia,sendMessage,incrementComms,incrementGrups,incrementUsers,getWelcomeStatus,setWelcomeStatus};
function marcarMensajeBot(key){if(key?.id)botMessageIds.add(key.id)}
module.exports.marcarMensajeBot=marcarMensajeBot;
