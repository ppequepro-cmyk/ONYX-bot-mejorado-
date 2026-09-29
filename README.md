<div align="center">

# ◈ ONYX-BOT

### WhatsApp Automation • Administration • AI • Premium • Subbots

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:050505,50:1a1a1a,100:5c5c5c&height=190&section=header&text=ONYX-BOT&fontColor=ffffff&fontSize=54&fontAlignY=38&animation=fadeIn" width="100%"/>

<img src="https://img.shields.io/badge/STATUS-ACTIVE-111111?style=for-the-badge&logo=whatsapp&logoColor=white"/>
<img src="https://img.shields.io/badge/NODE.JS-26-111111?style=for-the-badge&logo=node.js&logoColor=white"/>
<img src="https://img.shields.io/badge/BAILEYS-6.7.24-111111?style=for-the-badge"/>
<img src="https://img.shields.io/badge/ARCHITECTURE-MODULAR-111111?style=for-the-badge"/>

> **ONYX-BOT** es una plataforma modular para WhatsApp enfocada en automatización, administración de grupos, funciones premium, IA y múltiples subbots con sesiones independientes.

</div>

## ◈ CARACTERÍSTICAS

- 🧩 Sistema de plugins independientes.
- 🧠 Integración con **ONYX,IA**.
- 👥 Herramientas de administración y moderación para grupos.
- 💎 Sistema de planes premium.
- 🤖 Arquitectura de subbots con sesiones separadas.
- 🔐 Comandos sensibles protegidos para subbots.
- 📚 Catálogo central de comandos.
- 🔄 Recarga de plugins sin reconstruir todo el proyecto.
- 📊 Estadísticas y utilidades del bot.
- 👑 Administración del owner desde el propio bot.

## ◈ ARQUITECTURA

```
                         ┌──────────────────────┐
                         │      ONYX-BOT        │
                         │        CORE          │
                         └──────────┬───────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             ▼                      ▼                      ▼
       ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
       │   PLUGINS   │       │   PREMIUM   │       │   SUBBOTS   │
       └──────┬──────┘       └──────┬──────┘       └──────┬──────┘
              │                     │                     │
        comandos separados      planes/owner        sesiones aisladas
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    ▼
                           ┌─────────────────┐
                           │    WHATSAPP     │
                           └─────────────────┘
```

## ◈ INSTALACIÓN

El proyecto está preparado para ejecutarse en un entorno Node.js compatible. Configura las variables privadas en `.env` y nunca publiques tokens, claves o sesiones.

## ◈ EJECUCIÓN

### Desarrollo

```bash
node index.js
```

### PM2

```bash
pm2 start index.js --name ONYX
pm2 save
pm2 logs ONYX
```

## ◈ CONEXIÓN

ONYX-BOT permite la conexión principal mediante:

- QR de WhatsApp.
- Código de emparejamiento.

La sesión principal se guarda en `sessions/`, que está excluida del repositorio.

## ◈ SUBBOTS

Cada subbot tiene su propia carpeta de sesión y puede administrarse desde el bot principal.

```
/subbot list
/subbot create <nombre> <número>
/subbot start <nombre>
/subbot stop <nombre>
/subbot remove <nombre>
/subbot allow <nombre> <comando>
/subbot deny <nombre> <comando>
/subbot commands <nombre>
```

Los comandos administrativos sensibles permanecen bloqueados para los subbots por defecto.

## ◈ MENÚ

ONYX-BOT tiene una portada principal independiente y un catálogo completo de comandos.

### 🖤 Panel principal

    /menux

`/menux` muestra el panel visual de ONYX-BOT con la información de los sistemas creados y un único botón **📋 MENÚ** para abrir el catálogo completo.

### 📋 Catálogo

    /menu
    /menu 1
    /menu 2
    /menu 3
    /menu 4
    /menu 5
    /menu 6
    /menubtns
    /menunrml

- **/menu** → menú tradicional.
- **/menux** → portada visual principal.
- **📋 MENÚ** → abre el catálogo interactivo.
- **/menubtns** → catálogo con botones y navegación.
- **/menunrml** → catálogo en texto.

El catálogo central contiene **229 comandos registrados**. Los comandos que dependen de permisos de grupo, datos externos, multimedia o servicios de terceros deben probarse en su entorno correspondiente.

## ◈ COMANDOS PRINCIPALES

| Área | Ejemplos |
|---|---|
| 🧠 IA | `/ia`, `/iareset` |
| 👥 Grupos | `/tagall`, `/hidetag`, `/add`, `/kick`, `/promote`, `/demote` |
| 🛡️ Moderación | `/mute`, `/warn`, `/welcome`, `/goodbye`, `/antilink` |
| 🛠️ Utilidades | `/ping`, `/uptime`, `/menu`, `/stats`, `/health` |
| 🤖 Subbots | `/subbot list`, `/subbot create`, `/subbot start` |
| 💎 Premium | `/plan`, `/premium`, `/beneficios` |
| 👑 Owner | `/addprem`, `/delprem`, `/autoadmin`, `/restart` |

## ◈ SEGURIDAD

Archivos y datos sensibles se mantienen fuera de Git:

```
node_modules/
sessions/
sessions-backup/
conexiones/
subbots/*/sessions/
subbots/subbots.json
.env
*.key
*.pem
memoria/
usuarios/
database.json
```

**Nunca subas credenciales, tokens de API, archivos de sesión o claves privadas al repositorio.**

## ◈ ESTRUCTURA

```
ONYX-bot-mejorado-/
├── index.js
├── main.js
├── settings.js
├── plugins/
│   ├── menu.js
│   ├── mega.js
│   ├── ia.js
│   ├── subbot.js
│   └── ...
├── sistemas/
│   └── premium.js
├── ia/
│   ├── ia.js
│   └── onyx.js
├── subbots/
│   └── manager.js
├── sessions/          # local, no subir a Git
├── memoria/           # local, no subir a Git
├── usuarios/          # local, no subir a Git
└── database.json      # local, no subir a Git
```

## ◈ PRUEBA DEL CATÁLOGO

La prueba se realiza directamente desde WhatsApp. Ejecuta `/menu 1` hasta `/menu 12` para comprobar el catálogo completo. `/autoadmin` está restringido al owner y solo funciona en grupos donde el owner sea administrador.

### Lista de comandos habilitados

```text
/alive /botinfo /version /ownerinfo /jid /runtime /time /date /timezone /prefix /commands /support /status /stats /groupid /groupname /groupdesc /members /admins /creator /contact /profile /mention /echo /say /reverse /upper /lower /length /count /calc /sum /subtract /multiply /divide /random /choose /coin /dice /eightball /fact /quote /help /rules /grouplink /groupinfo /setname /setdesc /tagall2 /hidetag2 /adminslist /listonline /welcome2 /goodbye2 /antilink2 /warn2 /warnings2 /kick2 /promote2 /demote2 /add2 /mute2 /unmute2 /lock2 /unlock2 /open2 /close2 /invite2 /revoke2 /leave2 /announce2 /everyone2 /poll2 /translate2 /define /wiki /weather /shortlink /qr /stickerinfo /mediainfo /filename /base64 /timestamp /unix /hex /binary /octal /password /uuid /hash /json /encode /decode /backup /reload2 /ping2 /uptime2 /menu2 /premiuminfo /report /feedback /bug /suggest /donate /catalog /features /health /serverinfo /memory /process /license\n```\n
Los comandos sensibles o destructivos conservan sus restricciones de permisos. La presencia en el catálogo significa que están registrados; no significa que una acción administrativa pueda ejecutarse sin autorización.

## ◈ DESARROLLO

Para agregar un comando nuevo:

1. Crea un archivo independiente dentro de `plugins/`.
2. Exporta `command` y `handler`.
3. Mantén la lógica específica dentro de su propio módulo.
4. Ejecuta una comprobación de sintaxis antes de reiniciar.
5. Reinicia PM2 cuando el cambio esté listo.

Ejemplo mínimo:

```js
async function handler(conn,{message,args}){
    await conn.sendMessage(message.key.remoteJid,{
        text:"ONYX-BOT funcionando."
    })
}

module.exports={
    command:"ejemplo",
    handler
}
```

## ◈ IDENTIDAD

**Modular. Escalable. Independiente.**

Proyecto: **ONYX-BOT**  
Creador: **ı.ᴀᴍ.oɴʏxᴋıɴɢ👑**

ONYX-BOT y **ONYX,IA** son proyectos relacionados, pero mantienen responsabilidades separadas.

## ◈ REDES

<div align="center">

[![TikTok](https://img.shields.io/badge/TikTok-%40pequepequepro-111111?style=for-the-badge&logo=tiktok&logoColor=white)](https://www.tiktok.com/@pequepequepro)
[![Instagram](https://img.shields.io/badge/Instagram-%40emma.l.121-111111?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/emma.l.121)

</div>

## ◈ CONTACTO

<div align="center">

### 💬 Soporte, dudas o reportes

[![WhatsApp](https://img.shields.io/badge/WhatsApp-Contactar%20CEO-111111?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/13202109768?text=Hola%20CEO%20de%20ONYX-BOT)

**Mensaje automático:** Hola CEO de ONYX-BOT

</div>

## ◈ LICENCIA

Este repositorio es el proyecto de desarrollo de ONYX-BOT. Revisa las condiciones del repositorio antes de redistribuir o reutilizar componentes.

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:5c5c5c,50:1a1a1a,100:050505&height=120&section=footer&animation=fadeIn" width="100%"/>

### ı.ᴀᴍ.oɴʏxᴋıɴɢ👑

</div>
