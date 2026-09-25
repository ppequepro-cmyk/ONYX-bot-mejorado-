const fs = require("fs");
const { preguntarONYX } = require("../ia/ia");

const CARPETA_MEMORIA = "./memoria";

function archivoMemoria(jid) {
    return `${CARPETA_MEMORIA}/${jid.replace(/[^a-zA-Z0-9]/g, "_")}.json`;
}

function cargarMemoria(jid) {
    const archivo = archivoMemoria(jid);

    if (!fs.existsSync(archivo)) {
        return [];
    }

    try {
        return JSON.parse(fs.readFileSync(archivo, "utf8"));
    } catch {
        return [];
    }
}

function guardarMemoria(jid, memoria) {
    const archivo = archivoMemoria(jid);

    fs.writeFileSync(
        archivo,
        JSON.stringify(memoria, null, 2)
    );
}

async function handler(conn, { message, args }) {
    const query = args.join(" ").trim();
    const jid = message.key.remoteJid;

    if (!query) {
        return conn.sendMessage(jid, {
            text: "🤖 Escribe algo después de /ia.\n\nEjemplo: /ia ¿qué puedes hacer?"
        });
    }

    try {
        const memoria = cargarMemoria(jid);

        const respuesta = await preguntarONYX(
            query,
            memoria
        );

        if (!respuesta) {
            return conn.sendMessage(jid, {
                text: "⚠️ ONYX,IA no pudo generar una respuesta."
            });
        }

        memoria.push({
            usuario: query,
            ia: respuesta
        });

        guardarMemoria(jid, memoria);

        await conn.sendMessage(jid, {
            text: `🧠 *ONYX,IA*\n\n${respuesta}`,
            quoted: message
        });

    } catch (error) {
        console.error(
            "Error en ONYX,IA:",
            error.response?.data || error.message
        );

        await conn.sendMessage(jid, {
            text: "❌ Ocurrió un error al conectar con ONYX,IA."
        });
    }
}

module.exports = {
    command: "ia",
    handler
};
