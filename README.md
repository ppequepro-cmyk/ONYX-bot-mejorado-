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

```bash
git clone https://github.com/ppequepro-cmyk/ONYX-bot-mejorado-.git
cd ONYX-bot-mejorado-
npm install
```

Configura las variables privadas en `.env` y nunca publiques tokens, claves o sesiones.

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

El menú principal está organizado por categorías y el catálogo se divide en páginas para evitar convertir WhatsApp en una novela rusa.

```
/menu
/menu 1
/menu 2
/menu 3
/menu 4
/menu 5
```

El catálogo central contiene **100 comandos registrados**. Algunos son utilidades base y otros son módulos preparados para futuras implementaciones. El catálogo no significa que cada entrada tenga todavía una integración externa completa.

## ◈ COMANDOS PRINCIPALES

| Área | Ejemplos |
|---|---|
| 🧠 IA | `/ia`, `/iareset` |
| 👥 Grupos | `/tagall`, `/hidetag`, `/add`, `/kick`, `/promote`, `/demote` |
| 🛡️ Moderación | `/mute`, `/warn`, `/welcome`, `/goodbye`, `/antilink` |
| 🛠️ Utilidades | `/ping`, `/uptime`, `/menu`, `/stats`, `/health` |
| 🤖 Subbots | `/subbot list`, `/subbot create`, `/subbot start` |
| 💎 Premium | `/plan`, `/premium`, `/beneficios` |
| 👑 Owner | `/addprem`, `/delprem`, `/restart` |

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
