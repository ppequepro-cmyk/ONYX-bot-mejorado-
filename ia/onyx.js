const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const axios = require("axios");
const { obtenerUsuario } = require("./usuarios");
require("dotenv").config();
const CARPETA_MEMORIA = "./memoria";
const estadosChat = {};
const OWNERS = [
    "529622523422@s.whatsapp.net",
    "13202109768@s.whatsapp.net",
    "9622188688@s.whatsapp.net"
];
const UMBRAL_INACTIVIDAD = 2 * 60 * 1000;
const ultimaActividad = {};
const CHATSTOP_TIEMPO = 2 * 60 * 1000;

function obtenerEstado(jid) {
    return estadosChat[jid] || "on";
}

function establecerEstado(jid, estado) {
    estadosChat[jid] = estado;
}

function cargarMemoria(jid) {
    const archivo = `${CARPETA_MEMORIA}/${jid.replace(/[^a-zA-Z0-9]/g, "_")}.json`;

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
    const archivo = `${CARPETA_MEMORIA}/${jid.replace(/[^a-zA-Z0-9]/g, "_")}.json`;

    fs.writeFileSync(
        archivo,
        JSON.stringify(memoria, null, 2)
   );
}
async function iniciarONYX() {

    const { state, saveCreds } =
        await useMultiFileAuthState("./sesion");

    const sock = makeWASocket({
        auth: state,
        logger: P({ level: "silent" })
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", ({
        connection,
        lastDisconnect,
        qr
    }) => {

        if (qr) {
            console.log("\n📱 ESCANEA EL QR\n");
            qrcode.generate(qr, { small: true });
        }

        if (connection === "open") {
            console.log("\n🖤 ONYX,IA CONECTADA\n");
        }

        if (connection === "close") {

            const codigo =
                lastDisconnect?.error?.output?.statusCode;

            if (codigo !== DisconnectReason.loggedOut) {
                console.log("\n🔄 REINICIANDO ONYX,IA...\n");
                iniciarONYX();
            } else {
                console.log("\n❌ SESIÓN CERRADA.\n");
            }
        }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {

        for (const mensaje of messages) {

            if (!mensaje.message) continue;
            

            const jid = mensaje.key.remoteJidAlt || mensaje.key.remoteJid;
            const mensajeMio = mensaje.key.fromMe;
           if (mensajeMio) {
    ultimaActividad[jid] = Date.now();
    establecerEstado(jid, "stop");
    continue;
}
            if (!jid) continue;

            // Ignorar grupos por ahora
            if (jid.endsWith("@g.us")) continue;
            const usuario = obtenerUsuario(jid);
            const texto =
                mensaje.message.conversation ||
                mensaje.message.extendedTextMessage?.text ||
                "";

            if (!texto.trim()) continue;

const comando = texto.trim().toLowerCase();
console.log("🔎 COMANDO:", comando);
const identificadorOwner = mensaje.key.remoteJidAlt || jid;

console.log(
    "👑 ID RECIBIDO:",
    identificadorOwner.slice(0, 6) + "..." + identificadorOwner.slice(-15)
);

const esOwner = OWNERS.includes(identificadorOwner);

console.log("👑 OWNER:", esOwner);
if (comando === "chatbot on" || comando === "chat on") {
    establecerEstado(jid, "on");

    await sock.sendMessage(jid, {
        text: "🖤 ONYX,IA\n\n🟢 Chatbot activado."
    });

    continue;
}

if (comando === "chatbot off" || comando === "chat off") {
    establecerEstado(jid, "off");

    await sock.sendMessage(jid, {
        text: "🖤 ONYX,IA\n\n🔴 Chatbot desactivado en este chat."
    });

    continue;
}

if (false && esOwner && comando === "chatstop") {
    establecerEstado(jid, "stop");
    ultimaActividad[jid] = Date.now();

    await sock.sendMessage(jid, {
        text: "🖤 ONYX,IA\n\n🟡 Chatstop activado."
    });

    continue;
}

if (obtenerEstado(jid) === "off") {
    continue;
}
   if (obtenerEstado(jid) === "stop") {
    const tiempoInactivo = Date.now() - (ultimaActividad[jid] || Date.now());

    if (tiempoInactivo < CHATSTOP_TIEMPO) {
        continue;
    }

    ultimaActividad[jid] = Date.now();
}

console.log(`\n💬 MENSAJE: ${texto}`);

            try {

                console.log("🧠 Consultando ONYX,IA...");
const memoria = cargarMemoria(jid);

memoria.push({
    usuario: texto,
    fecha: new Date().toISOString()
});

const historial = memoria
    .slice(-10)
    .map((m) => `Usuario: ${m.usuario}`)
    .join("\n");
                const respuesta = await axios.get(
    "https://api.lempi.lat/ai/gemini",
    {
        params: {
            q: `Tu nombre es ONYX,IA. Eres una inteligencia artificial creada por tu dueño. No digas que eres Gemini ni que fuiste creada por Google. Responde de forma natural, clara y útil.

Historial reciente:
${historial}

Mensaje actual del usuario:
${texto}`
        },

        headers: {
            Authorization:
                `Bearer ${process.env.LEMPI_API_KEY}`
        }
    }
);
                const resultado =
                    respuesta.data?.resultado?.respuesta;

                if (!resultado) {
                    console.log(
                        "⚠️ La API no devolvió una respuesta válida."
                    );
                    continue;
                }

                console.log(`🤖 RESPUESTA: ${resultado}`);

memoria.push({
    ia: resultado,
    fecha: new Date().toISOString()
});

guardarMemoria(jid, memoria);
                await sock.sendMessage(jid, {
                    text: `🖤 ONYX,IA\n\n${resultado}`
                });

                console.log("✅ RESPUESTA ENVIADA");

            } catch (error) {

                console.log(
                    "❌ ERROR IA:",
                    error.response?.data ||
                    error.message
                );
            }
        }
    });
}

iniciarONYX();
