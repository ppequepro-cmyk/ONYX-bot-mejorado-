const fs=require("fs");
const os=require("os");
const path=require("path");
const {spawn,execFileSync}=require("child_process");
const COMMANDS=["ytmp3","ytmp4","youtube","play","song","video","tiktok","tiktokmp4","igdl","twitterdl","facebookdl","pinterestdl","mediafire"];
function findExecutable(name,fallback){try{const r=execFileSync("sh",["-lc",`command -v ${name} || true`],{encoding:"utf8"}).trim();return r||fallback}catch{return fallback}}
function runYtdlp(args,cwd){return new Promise((resolve,reject)=>{const yt=findExecutable("yt-dlp",null);const command=yt?"yt-dlp":"python";const finalArgs=yt?args:["-m","yt_dlp",...args];const p=spawn(command,finalArgs,{cwd});let stderr="",stdout="";p.stdout.on("data",d=>stdout+=d.toString());p.stderr.on("data",d=>stderr+=d.toString());p.on("error",reject);p.on("close",code=>code===0?resolve({stdout,stderr}):reject(new Error((stderr||stdout).slice(-5000))))})}
function findOutput(dir,preferredExts=[]){const files=fs.readdirSync(dir).map(x=>path.join(dir,x)).filter(x=>{try{return fs.statSync(x).isFile()&&!x.endsWith(".part")}catch{return false}});if(!files.length)return null;return files.find(x=>preferredExts.includes(path.extname(x).toLowerCase().slice(1)))||files[0]}
async function handler(conn,{message,args}){
  const jid=message.key.remoteJid,command=String(message.command||"").toLowerCase(),input=args.join(" ").trim();
  if(!input)return conn.sendMessage(jid,{text:"⚠️ Usa un enlace o una búsqueda.\nEjemplo: /ytmp3 https://www.youtube.com/watch?v=..."},{quoted:message});
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"onyx-media-")),isAudio=["ytmp3","song","play"].includes(command),source=/^https?:\/\//i.test(input)?input:"ytsearch1:"+input;
  try{
    await conn.sendMessage(jid,{text:"⏳ Descargando multimedia..."},{quoted:message});
    const output=path.join(dir,"%(title).80s-%(id)s.%(ext)s");const ytArgs=["--no-playlist","--restrict-filenames","--no-warnings","--newline","-o",output];
    if(isAudio)ytArgs.push("-f","bestaudio/best","-x","--audio-format","mp3","--audio-quality","5");
    else ytArgs.push("-f","bv*[height<=720][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b","--merge-output-format","mp4");
    ytArgs.push(source);await runYtdlp(ytArgs,dir);
    const file=findOutput(dir,isAudio?["mp3","m4a","opus","webm"]:["mp4","mkv","webm"]);if(!file)throw Error("yt-dlp terminó sin generar un archivo.");
    const filename=path.basename(file),stream=fs.createReadStream(file);
    if(isAudio)await conn.sendMessage(jid,{audio:stream,mimetype:"audio/mpeg",fileName:filename,ptt:false},{quoted:message});
    else await conn.sendMessage(jid,{video:stream,mimetype:"video/mp4",fileName:filename,caption:"☠️ ONYX-BOT"},{quoted:message});
  }catch(e){console.error("❌ /"+command+":",e.stack||e.message);await conn.sendMessage(jid,{text:"❌ No pude descargar ese contenido.\n\nMotivo: "+String(e.message||"error").slice(-1200)},{quoted:message});
  }finally{try{fs.rmSync(dir,{recursive:true,force:true})}catch{}}
}
module.exports={commands:COMMANDS,handler};