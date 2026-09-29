const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const COMMANDS = [
  "ytmp3","ytmp4","youtube","play","song","video",
  "tiktok","tiktokmp4","igdl","twitterdl","facebookdl","pinterestdl","mediafire"
];

function runYtdlp(args, cwd) {
  return new Promise((resolve, reject) => {
    const p = spawn("yt-dlp", args, { cwd });
    let stderr = "";
    p.stderr.on("data", d => stderr += d.toString());
    p.on("error", reject);
    p.on("close", code => code === 0 ? resolve(stderr) : reject(new Error(stderr.slice(-1800))));
  });
}

function findOutput(dir) {
  const files = fs.readdirSync(dir).map(x => path.join(dir, x))
    .filter(x => fs.statSync(x).isFile());
  return files[0] || null;
}

async function handler(conn, { message, args }) {
  const jid = message.key.remoteJid;
  const command = String(message.command || "").toLowerCase();
  const input = args.join(" ").trim();

  if (!input) {
    return conn.sendMessage(jid, {
      text: "⚠️ Usa un enlace o una búsqueda.\nEjemplo: /ytmp3 https://www.youtube.com/watch?v=..."
    }, { quoted: message });
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "onyx-media-"));
  const isAudio = ["ytmp3","song","play"].includes(command);
  const isVideo = ["ytmp4","video","tiktokmp4"].includes(command);
  const source = /^https?:\/\//i.test(input) ? input : "ytsearch1:" + input;

  try {
    await conn.sendMessage(jid, {
      text: "⏳ Procesando multimedia... Esto puede tardar un poco."
    }, { quoted: message });

    const output = path.join(dir, "%(title).80s-%(id)s.%(ext)s");
    const argsYt = [
      "--no-playlist",
      "--restrict-filenames",
      "--no-warnings",
      "-o", output
    ];

    if (isAudio) {
      argsYt.push("-x", "--audio-format", "mp3", "--audio-quality", "5");
    } else if (isVideo) {
      argsYt.push("-t", "mp4");
    } else {
      argsYt.push("-t", "mp4");
    }

    argsYt.push(source);
    await runYtdlp(argsYt, dir);

    const file = findOutput(dir);
    if (!file) throw new Error("yt-dlp terminó sin generar un archivo.");

    const filename = path.basename(file);
    if (isAudio) {
      await conn.sendMessage(jid, {
        audio: { url: file },
        mimetype: "audio/mpeg",
        fileName: filename,
        ptt: false
      }, { quoted: message });
    } else {
      await conn.sendMessage(jid, {
        video: { url: file },
        mimetype: "video/mp4",
        fileName: filename,
        caption: "☠️ ONYX-BOT"
      }, { quoted: message });
    }
  } catch (e) {
    console.error("❌ /" + command + ":", e.message);
    await conn.sendMessage(jid, {
      text: "❌ No pude descargar ese contenido.\n\nComprueba el enlace y que yt-dlp + FFmpeg estén instalados y actualizados."
    }, { quoted: message });
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  }
}

module.exports = { commands: COMMANDS, handler };