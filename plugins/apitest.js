const { health } = require("../lib/onyx-api");

async function handler(conn, { message }) {
    try {
        const data = await health();
        await conn.sendMessage(message.key.remoteJid, {
            text: `🔐 *ONYX API*\n\n🟢 Conexión correcta\n📡 Estado: ${data.status || "online"}\n🧠 Servicio: ${data.name || "ONYX API"}`
        });
    } catch (error) {
        console.error("Error /apitest:", error.message);
        await conn.sendMessage(message.key.remoteJid, {
            text: "🔴 ONYX API no respondió correctamente."
        });
    }
}

module.exports = {
    command: "apitest",
    handler
};
