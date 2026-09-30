require("dotenv").config();
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const pino = require('pino');
const chalk = require('chalk');
const figlet = require('figlet');
const { establecerOwner } = require("./sistemas/premium");
const { list:startSubbots, startExisting:startExistingSubbot } = require("./subbots/manager");

const SESSION_DIR = path.join(__dirname, "sessions");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (text) => new Promise((resolve) => rl.question(text, resolve));

let reconnectTimer = null;
let starting = false;
let connected = false;

function scheduleReconnect() {
    if (reconnectTimer || starting) return;

    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
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

        let opcion = null;
        const hasCreds = fs.existsSync(path.join(SESSION_DIR, "creds.json"));

        if (!hasCreds) {
            console.log(chalk.yellowBright("\n📱 Sesión nueva de ONYX."));
            console.log(chalk.cyan("1. Escanea el QR desde WhatsApp."));
            console.log(chalk.cyan("2. Si prefieres código de vinculación, usa la opción 2.\n"));

            do {
                opcion = await question(
                    chalk.bold.yellow("➜ Selecciona 1 para QR o 2 para código de vinculación: ")
                );

                if (opcion !== "1" && opcion !== "2") {
                    console.log(chalk.red("❌ Escribe solamente 1 o 2."));
                }
            } while (opcion !== "1" && opcion !== "2");
        }

        const socket = makeWASocket({
            version,
            auth: state,
            logger: pino({ level: 'silent' }),
            markOnlineOnConnect: false,
            syncFullHistory: false,
            generateHighQualityLinkPreview: false
        });
        if (opcion === "2") {
            try {
                let phoneNumber = await question("Introduce el número con código de país (ej. 521XXXXXXXXXX): ");
                phoneNumber = phoneNumber.replace(/\D/g, "");

                if (!phoneNumber) {
                    throw new Error("Número de teléfono vacío.");
                }

                console.log(chalk.yellow("⏳ Solicitando código de vinculación..."));
                const pairingCode = await socket.requestPairingCode(phoneNumber);
                console.log(chalk.greenBright("\n🔐 CÓDIGO DE VINCULACIÓN: " + pairingCode));
                console.log(chalk.cyan("En WhatsApp abre Dispositivos vinculados → Vincular con número de teléfono.\n"));
            } catch (err) {
                console.error(chalk.red("❌ No se pudo generar el código:"), err.message);
            }
        }

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
                console.log(chalk.greenBright("\n📲 ESCANEA ESTE QR CON WHATSAPP:\n"));
                qrcode.generate(qr, { small: true });
                console.log(chalk.cyan("\nWhatsApp → Dispositivos vinculados → Vincular dispositivo"));
            }
        });

        socket.ev.on('creds.update', saveCreds);

        socket.ev.on('messages.upsert', async (m) => {
            try {
                if (!m.messages?.length) return;
                const main = require('./main.js');
                await main.handleMessage(socket, m.messages[0]);
            } catch (err) {
                console.error('Error procesando el mensaje:', err.message);
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
