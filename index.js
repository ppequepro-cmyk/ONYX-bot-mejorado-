require("dotenv").config();
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require("express");
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const pino = require('pino');
const chalk = require('chalk');
const figlet = require('figlet');
const { establecerOwner, obtenerOwnersNotificacion } = require("./sistemas/premium");
const { list:startSubbots, startExisting:startExistingSubbot, requestCode:startPremiumPair, stop:stopSubbot, remove:removeSubbot } = require("./subbots/manager");

const SESSION_DIR = path.join(__dirname, "sessions");

let reconnectTimer = null;
let starting = false;
let connected = false;

function scheduleReconnect() {
    if (reconnectTimer || starting) return;

    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        
// API privada para que ONYX WEB/ONYX API gestione sesiones Premium.
// No expone esta API públicamente sin un token.
const controlApp = express();
controlApp.use(express.json({limit:"32kb"}));
controlApp.use((req,res,next)=>{
    const configured=process.env.ONYX_BOT_TOKEN;
    const auth=String(req.get("authorization")||"");
    if(!configured || auth !== "Bearer "+configured) return res.status(401).json({ok:false,error:"No autorizado"});
    next();
});
controlApp.get("/api/premium/bots",(_req,res)=>res.json({ok:true,bots:startSubbots()}));
controlApp.post("/api/premium/pair",async(req,res)=>{
    try{
        const phone=String(req.body?.phone||"").replace(/\D/g,"");
        if(!phone) return res.status(400).json({ok:false,error:"phone es obligatorio"});
        const bot=await startPremiumPair(phone,async(id,sock,msg)=>{
            try{const main=require("./main.js");await main.handleMessage(sock,msg)}
            catch(e){console.error("Premium "+id+":",e.message)}
        });
        res.json({ok:true,bot});
    }catch(e){res.status(400).json({ok:false,error:e.message||"No se pudo generar el pairing"})}
});
controlApp.post("/api/premium/bots/:id/stop",async(req,res)=>{try{await stopSubbot(req.params.id);res.json({ok:true})}catch(e){res.status(400).json({ok:false,error:e.message})}});
controlApp.delete("/api/premium/bots/:id",async(req,res)=>{try{const ok=await removeSubbot(req.params.id);res.json({ok})}catch(e){res.status(400).json({ok:false,error:e.message})}});
const CONTROL_PORT=Number(process.env.ONYX_BOT_CONTROL_PORT||3010);
controlApp.listen(CONTROL_PORT,"0.0.0.0",()=>console.log("🔐 ONYX control API en puerto "+CONTROL_PORT));

startBot().catch(err => {
            console.error("Error iniciando ONYX:", err.message);
            scheduleReconnect();
        });
    }, 3000);
}

async function startBot() {
    if (starting) return;
    starting = true;

    try {
        console.clear();
        figlet('ONYX-BOT', (err, data) => {
            if (!err) console.log(chalk.yellow(data));
        });

        await new Promise(resolve => setTimeout(resolve, 1200));

        fs.mkdirSync(SESSION_DIR, { recursive: true });

        const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
        const { version } = await fetchLatestBaileysVersion();

        const hasCreds = fs.existsSync(path.join(SESSION_DIR, "creds.json"));

        if (!hasCreds) {
            console.log(chalk.yellowBright("\n📱 SESIÓN NUEVA: ONYX iniciará directamente con QR."));
            console.log(chalk.cyan("📲 Esperando QR de WhatsApp...\n"));
        }

        const socket = makeWASocket({
            version,
            auth: state,
            logger: pino({ level: 'silent' }),
            markOnlineOnConnect: false,
            syncFullHistory: false,
            generateHighQualityLinkPreview: false
        });
        const originalSendMessage = socket.sendMessage.bind(socket);
        socket.sendMessage = async (...args) => {
            const sent = await originalSendMessage(...args);
            try {
                const main = require('./main.js');
                main.marcarMensajeBot(sent?.key);
            } catch {}
            return sent;
        };

        socket.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (connection === 'open') {
                connected = true;
                console.log(chalk.green('🟢 ONYX conectado correctamente.'));
                console.log(`Bot conectado como ${socket.user.id}`);

                try {
                    establecerOwner(socket.user.id, socket.user.lid);
                } catch (err) {
                    console.error("Error estableciendo owner:", err.message);
                }

                console.log(`👑 OWNER JID: ${socket.user.id}`);
                console.log(`👑 OWNER LID: ${socket.user.lid || "no disponible"}`);

                try {
                    startSubbots()
                        .filter(b => b.status !== "online")
                        .forEach(b =>
                            startExistingSubbot(
                                b.id,
                                async (id, sock, msg) => {
                                    try {
                                        const main = require("./main.js");
                                        await main.handleMessage(sock, msg);
                                    } catch (e) {
                                        console.error("Subbot " + id + ":", e.message);
                                    }
                                }
                            ).catch(e => console.error("Subbot " + b.id + ":", e.message))
                        );
                } catch (err) {
                    console.error("Error iniciando subbots:", err.message);
                }

                return;
            }

            if (connection === 'close') {
                connected = false;

                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const loggedOut = statusCode === DisconnectReason.loggedOut;

                console.log(
                    chalk.yellowBright(
                        `⚠️ ONYX desconectado (código ${statusCode || "desconocido"}). ` +
                        (loggedOut ? "Sesión cerrada en WhatsApp." : "Reintentando automáticamente...")
                    )
                );

                if (loggedOut) {
                    console.log(chalk.red("❌ WhatsApp cerró la sesión. No se borrará sessions/ automáticamente."));
                    return;
                }

                scheduleReconnect();
            }

            if (qr) {
                console.log(chalk.greenBright("\n📲 QR RECIBIDO. ESCANÉALO EN WHATSAPP:\n"));
                qrcode.generate(qr, { small: true });
                console.log(chalk.cyan("\nWhatsApp → Dispositivos vinculados → Vincular dispositivo\n"));
            }
        });

        const { isAntiCall } = require("./sistemas/anticall");
        const llamadasProcesadas = new Set();

        socket.ev.on("call", async (calls) => {
            if (!isAntiCall()) return;
            const lista = Array.isArray(calls) ? calls : [calls];

            for (const call of lista) {
                try {
                    if (!call || call.status !== "offer" || !call.id || !call.from) continue;
                    if (llamadasProcesadas.has(call.id)) continue;
                    llamadasProcesadas.add(call.id);

                    console.log("📵 AntiCall: llamada rechazada de", call.from);

                    if (typeof socket.rejectCall === "function") {
                        await socket.rejectCall(call.id, call.from);
                    }

                    try {
                        await socket.sendMessage(call.from, {
                            text: "📵 No puedo atender llamadas. Usa un mensaje de WhatsApp para contactar con ONYX."
                        });
                    } catch {}

                    setTimeout(() => llamadasProcesadas.delete(call.id), 60000);
                } catch (err) {
                    console.error("❌ AntiCall:", err?.stack || err?.message || err);
                }
            }
        });

        socket.ev.on('creds.update', saveCreds);

        socket.ev.on('messages.upsert', async (m) => {
            if (!m.messages?.length) return;

            const main = require('./main.js');

            for (const message of m.messages) {
                try {
                    await main.handleMessage(socket, message);
                } catch (err) {
                    console.error('❌ Error procesando mensaje:', err?.stack || err?.message || err);
                }
            }
        });

        socket.ev.on('group-participants.update', async (update) => {
            try {
                const main = require('./main.js');
                await main.handleGroupEvents(socket, update);
            } catch (err) {
                console.error('Error procesando evento de grupo:', err.message);
            }
        });

        starting = false;
    } catch (err) {
        starting = false;
        console.error("Error iniciando ONYX:", err.message);
        scheduleReconnect();
    }
}

startBot().catch(err => {
    console.error("Error fatal iniciando ONYX:", err.message);
    scheduleReconnect();
});
