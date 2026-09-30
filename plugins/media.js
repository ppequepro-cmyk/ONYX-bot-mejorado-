const fs=require("fs");
const os=require("os");
const path=require("path");
const {spawn,execFileSync}=require("child_process");
const COMMANDS=["ytmp3","ytmp4","youtube","play","song","video","tiktok","tiktokmp4","igdl","twitterdl","facebookdl","pinterestdl","mediafire"];

function findExecutable(name){try{return execFileSync("sh",["-lc",`command -v ${name} || true`],{encoding:"utf8"}).trim()||null}catch{return null}}
function runYtdlp(args,cwd){
 return new Promise((resolve,reject)=>{
  const yt=findExecutable("yt-dlp"); const command=yt?"yt-dlp":"python"; const finalArgs=yt?args:["-m","yt_dlp",...args];
  const p=spawn(command,finalArgs,{cwd}); let stderr="",stdout="";
  p.stdout.on("data",d=>stdout+=d.toString()); p.stderr.on("data",d=>stderr+=d.toString());
  p.on("error",reject); p.on("close",code=>code===0?resolve({stdout,stderr}):reject(new Error((stderr||stdout).slice(-4000))));
 });
}
function findOutput(dir,exts){const files=fs.readdirSync(dir).map(x=>path.join(dir,x)).filter(x=>{try{return fs.statSync(x).isFile()&&!x.endsWith(".part")&&!x.endsWith(".ytdl")}catch{return false}});return files.find(x=>exts.includes(path.extname(x).toLowerCase().slice(1)))||files[0]||null}
function looksLike403(error){return /403|forbidden|unable to download video data|http error/i.test(String(error||""))}
async function download(dir,source,isAudio){
 const output=path.join(dir,"%(title).70s-%(id)s.%(ext)s");
 const common=["--no-playlist","--restrict-filenames","--no-warnings","--newline","--socket-timeout","30","--retries","5","--fragment-retries","5","--extractor-retries","3","--force-ipv4","-o",output];
 const attempts=isAudio?[
  [...common,"-f","bestaudio/best","-x","--audio-format","mp3","--audio-quality","5",source],
  [...common,"-f","ba/b","--audio-format","mp3","source"===source?"":source].filter(Boolean)
 ]:[
  [...common,"-f","bv*[height<=720]+ba/b[height<=720]/b","--merge-output-format","mp4",source],
  [...common,"-f","b[height<=720][ext=mp4]/b[height<=720]/b",source]
 ];
 let last=null;
 for(const args of attempts){try{await runYtdlp(args,dir);const file=findOutput(dir,isAudio?["mp3","m4a","opus","webm"]:["mp4","mkv","webm"]);if(file)return file}catch(e){last=e;if(!looksLike403(e))break;}}
 throw last||new Error("No se pudo descargar el contenido.");
}
async function handler(conn,{message,args}){
 const jid=message.key.remoteJid,command=String(message.command||"").toLowerCase(),input=args.join(" ").trim();
 if(!input)return conn.sendMessage(jid,{text:"⚠️ Usa un enlace o una búsqueda.\nEjemplo: /play música relajante"},{quoted:message});
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"onyx-media-")); const isAudio=["ytmp3","song","play"].includes(command); const source=/^https?:\/\//i.test(input)?input:"ytsearch1:"+input;
 try{
  await conn.sendMessage(jid,{text:"⏳ Buscando y descargando..."},{quoted:message});
  const file=await download(dir,source,isAudio); const stat=fs.statSync(file);
  if(stat.size>65*1024*1024)throw Error("El archivo pesa demasiado para enviarlo por WhatsApp.");
  const filename=path.basename(file);
  if(isAudio)await conn.sendMessage(jid,{audio:fs.createReadStream(file),mimetype:"audio/mpeg",fileName:filename,ptt:false},{quoted:message});
  else await conn.sendMessage(jid,{video:fs.createReadStream(file),mimetype:"video/mp4",fileName:filename,caption:"☠️ ONYX-BOT"},{quoted:message});
 }catch(e){console.error("❌ /"+command+":",e.stack||e.message);await conn.sendMessage(jid,{text:"❌ No pude descargar ese contenido.\n\nMotivo: "+String(e.message||"error").slice(-1400)},{quoted:message})}
 finally{try{fs.rmSync(dir,{recursive:true,force:true})}catch{}}
}
module.exports={commands:COMMANDS,handler};
