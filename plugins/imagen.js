const axios=require("axios");
const fs=require("fs");
const os=require("os");
const path=require("path");
const {spawn}=require("child_process");
const {downloadContentFromMessage}=require("@whiskeysockets/baileys");

const COMMANDS=["imagen","img","image","mejorar","enhance","verimagen"];

async function bufferFromStream(stream){const chunks=[];for await(const chunk of stream)chunks.push(chunk);return Buffer.concat(chunks)}

function getImageMessage(message){
  const m=message?.message||{};
  if(m.imageMessage)return m.imageMessage;
  const q=m.extendedTextMessage?.contextInfo?.quotedMessage;
  if(q?.imageMessage)return q.imageMessage;
  return null;
}

async function searchWikimedia(query){
  const r=await axios.get("https://commons.wikimedia.org/w/api.php",{params:{
    action:"query",generator:"search",gsrsearch:query,gsrnamespace:6,gsrlimit:5,
    prop:"imageinfo",iiprop:"url|mime|extmetadata",iiurlwidth:900,format:"json",origin:"*"
  },timeout:15000});
  return Object.values(r.data?.query?.pages||{}).map(p=>p.imageinfo?.[0]).filter(x=>x?.url);
}

async function improveImage(conn,jid,message){
  const image=getImageMessage(message);
  if(!image)return conn.sendMessage(jid,{text:"🖼️ Responde a una imagen con /mejorar."},{quoted:message});
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"onyx-img-"));
  const input=path.join(dir,"input");
  const output=path.join(dir,"mejorada.jpg");
  try{
    const stream=await downloadContentFromMessage(image,"image");
    fs.writeFileSync(input,await bufferFromStream(stream));
    await new Promise((resolve,reject)=>{
      const p=spawn("ffmpeg",["-y","-i",input,"-vf","scale=iw*2:ih*2:flags=lanczos,unsharp=5:5:0.7:5:5:0,eq=contrast=1.04:saturation=1.05","-q:v","2",output]);
      let err="";p.stderr.on("data",d=>err+=d.toString());p.on("error",reject);p.on("close",c=>c===0?resolve():reject(new Error(err.slice(-1200))));
    });
    await conn.sendMessage(jid,{image:{url:output},caption:"✨ *ONYX,IA*\nImagen mejorada automáticamente."},{quoted:message});
  }catch(e){console.error("❌ /mejorar:",e.message);await conn.sendMessage(jid,{text:"❌ No pude mejorar la imagen: "+e.message},{quoted:message})}
  finally{try{fs.rmSync(dir,{recursive:true,force:true})}catch{}}
}

async function analyzeImage(conn,jid,message,text){
  const image=getImageMessage(message);
  if(!image)return conn.sendMessage(jid,{text:"🖼️ Responde a una imagen con /verimagen y escribe qué quieres analizar."},{quoted:message});
  if(!process.env.GROQ_API_KEY)return conn.sendMessage(jid,{text:"⚠️ Falta GROQ_API_KEY en .env."},{quoted:message});
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"onyx-vision-"));
  try{
    const stream=await downloadContentFromMessage(image,"image");
    const buf=await bufferFromStream(stream);
    const data=buf.toString("base64");
    const response=await axios.post(process.env.GROQ_API_URL||"https://api.groq.com/openai/v1/chat/completions",{
      model:process.env.GROQ_VISION_MODEL||"qwen/qwen3.8-27b",
      messages:[{role:"system",content:"Eres ONYX,IA. Analiza imágenes de forma clara y útil. No inventes detalles que no puedas ver."},{role:"user",content:[
        {type:"text",text:text||"Describe y analiza esta imagen."},
        {type:"image_url",image_url:{url:"data:"+ (image.mimetype||"image/jpeg")+";base64,"+data}}
      ]}],
      max_completion_tokens:700
    },{headers:{Authorization:"Bearer "+process.env.GROQ_API_KEY,"Content-Type":"application/json"},timeout:30000});
    const answer=response.data?.choices?.[0]?.message?.content||"No pude analizar la imagen.";
    await conn.sendMessage(jid,{text:"🧠 *ONYX,IA VISION*\n\n"+answer},{quoted:message});
  }catch(e){console.error("❌ /verimagen:",e.response?.data||e.message);await conn.sendMessage(jid,{text:"❌ No pude analizar la imagen. Revisa GROQ_VISION_MODEL y la API de Groq."},{quoted:message})}
  finally{try{fs.rmSync(dir,{recursive:true,force:true})}catch{}}
}

async function handler(conn,{message,args}){
  const jid=message.key.remoteJid;
  const command=String(message.command||"").toLowerCase();
  const query=args.join(" ").trim();
  if(["imagen","img","image"].includes(command)){
    if(!query)return conn.sendMessage(jid,{text:"🖼️ Usa: /imagen <qué buscas>\nEjemplo: /imagen gato negro"},{quoted:message});
    try{
      await conn.sendMessage(jid,{text:"🔎 Buscando imágenes..."},{quoted:message});
      const results=await searchWikimedia(query);
      if(!results.length)return conn.sendMessage(jid,{text:"❌ No encontré imágenes para esa búsqueda."},{quoted:message});
      for(const item of results.slice(0,3)){
        await conn.sendMessage(jid,{image:{url:item.url},caption:"🖼️ ONYX-BOT • "+query},{quoted:message});
      }
    }catch(e){console.error("❌ /imagen:",e.message);await conn.sendMessage(jid,{text:"❌ Falló la búsqueda de imágenes."},{quoted:message})}
    return;
  }
  if(["mejorar","enhance"].includes(command))return improveImage(conn,jid,message);
  if(command==="verimagen")return analyzeImage(conn,jid,message,query);
}

module.exports={commands:COMMANDS,handler};