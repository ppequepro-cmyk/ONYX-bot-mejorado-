require("dotenv").config();
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const readline = require('readline');
const pino = require('pino');
const chalk = require('chalk');
const figlet = require('figlet');
const { establecerOwner } = require("./sistemas/premium");
const { list:startSubbots, startExisting:startExistingSubbot } = require("./subbots/manager");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    console.clear();
    figlet('ONYX-BOT', (err, data) => {
        if (err) {
            console.log('Error generando el banner ASCII');
            console.log(err);
            return;
        }
       console.log(chalk.yellow(data));
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.clear();

    const { state, saveCreds } = await useMultiFileAuthState('./sessions');
    const { version } = await fetchLatestBaileysVersion();

    let opcion;
    if (!fs.existsSync('./sessions/creds.json')) {
        do {
            const lineM = '━━━━━━━━━━━━━━━━━━━━';
            opcion = await question(`╔${lineM}╗
❘ ${chalk.bgBlue('          𝗦𝗘𝗟𝗘𝗖𝗖𝗜𝗢𝗡𝗔           ')}
❘ ${chalk.bgMagenta('➥')} ${chalk.bold.cyan('1. Conexión mediante QR')}
❘ ${chalk.bgMagenta('➥')} ${chalk.green.bold('2. Conexión mediante número de teléfono')}
╚${lineM}╝\n${chalk.bold.yellow('➥ ')}${chalk.bold.green('➜ ')}`);

            if (!/^[1-2]$/.test(opcion)) {
                console.log(chalk.bold.redBright(`NO SE PERMITE NÚMEROS QUE NO SEAN ${chalk.bold.greenBright("1")} O ${chalk.bold.greenBright("2")}, TAMPOCO LETRAS O SÍMBOLOS ESPECIALES.\n${chalk.bold.yellowBright("CONSEJO: COPIE EL NÚMERO DE LA OPCIÓN Y PÉGUELO EN LA CONSOLA.")}`));
            }
        } while (opcion !== '1' && opcion !== '2' || fs.existsSync('./sessions/creds.json'));
    }

    const socket = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
    });

    if (opcion === '2') {
        let phoneNumber = await question('Introduce tu número de teléfono (Ej: +123456789): ');
        phoneNumber = phoneNumber.replace(/\D/g, '');
        const pairingCode = await socket.requestPairingCode(phoneNumber);
        console.log(`Código de emparejamiento: ${pairingCode}`);
    }

    socket.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        if (connection === 'open') {
            figlet(`ONYX\nBOT`, (err, data) => {
                if (err) {
                    console.log('Error generando el banner ASCII');
                    console.log(err);
                    return;
                }
                console.log(chalk.magenta(data));
                console.log(`Bot conectado como ${socket.user.id}`);
                establecerOwner(socket.user.id);
                console.log(`👑 OWNER JID: ${socket.user.id}`);
                startSubbots().filter(b=>b.status!=="online").forEach(b=>startExistingSubbot(b.id,async(id,sock,msg)=>{try{const main=require("./main.js");await main.handleMessage(sock,msg)}catch(e){console.error("Subbot "+id+":",e.message)}}).catch(e=>console.error("Subbot "+b.id+":",e.message)));
            });
        }

        if (connection === 'close') {
            console.log(chalk.yellowBright('Bot desconectado, intentando reconectar...'));
            startBot();
        }

        if (qr) qrcode.generate(qr, { small: true });
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('messages.upsert', async (m) => {
     console.log('📩 MENSAJE RECIBIDO');
        try {
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
}

startBot();
