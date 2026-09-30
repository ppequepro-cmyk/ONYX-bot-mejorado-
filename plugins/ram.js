const os = require("os");

function formatUptime(seconds) {
  const s = Math.floor(seconds);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [d ? d + "d" : "", h ? h + "h" : "", m ? m + "m" : "", sec + "s"].filter(Boolean).join(" ");
}

module.exports = {
  command: "ram",
  async handler(conn, { message }) {
    const jid = message.key.remoteJid;
    const start = process.hrtime.bigint();

    const cpu = os.cpus();
    const totalRam = os.totalmem();
    const freeRam = os.freemem();
    const usedSystemRam = totalRam - freeRam;
    const botRam = process.memoryUsage().rss;

    const processingMs = Number(process.hrtime.bigint() - start) / 1e6;

    const cpuName = cpu[0]?.model || "No disponible";
    const arch = os.arch();
    const cores = cpu.length;
    const botRamMb = botRam / 1024 / 1024;
    const totalRamMb = totalRam / 1024 / 1024;
    const freeRamMb = freeRam / 1024 / 1024;
    const usedSystemRamMb = usedSystemRam / 1024 / 1024;
    const systemPercent = ((usedSystemRam / totalRam) * 100).toFixed(1);

    const text =
      "🖤 *ONYX-BOT | SISTEMA*\n\n" +
      "🧠 *Procesador:* " + cpuName + "\n" +
      "🏗️ *Arquitectura:* " + arch + "\n" +
      "🧮 *Núcleos:* " + cores + "\n\n" +
      "💾 *RAM total:* " + totalRamMb.toFixed(0) + " MB\n" +
      "🟢 *RAM libre:* " + freeRamMb.toFixed(0) + " MB\n" +
      "📊 *RAM usada sistema:* " + usedSystemRamMb.toFixed(0) + " MB (" + systemPercent + "%)\n" +
      "⚙️ *RAM usada por ONYX:* " + botRamMb.toFixed(1) + " MB\n\n" +
      "⚡ *Procesamiento:* " + processingMs.toFixed(2) + " ms\n" +
      "⏱️ *Uptime ONYX:* " + formatUptime(process.uptime());

    await conn.sendMessage(jid, { text });
  }
};