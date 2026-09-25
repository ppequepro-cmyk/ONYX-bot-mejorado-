const fs = require("fs");

const CARPETA_USUARIOS = "./usuarios";

if (!fs.existsSync(CARPETA_USUARIOS)) {
    fs.mkdirSync(CARPETA_USUARIOS, { recursive: true });
}

function archivoUsuario(jid) {
    return `${CARPETA_USUARIOS}/${jid.replace(/[^a-zA-Z0-9]/g, "_")}.json`;
}

function obtenerUsuario(jid) {
    const archivo = archivoUsuario(jid);

    if (!fs.existsSync(archivo)) {
        const usuarioNuevo = {
            jid,
            plan: "free",
            premium: false,
            fechaPremium: null,
            creado: new Date().toISOString()
        };

        fs.writeFileSync(
            archivo,
            JSON.stringify(usuarioNuevo, null, 2)
        );

        return usuarioNuevo;
    }

    try {
        return JSON.parse(
            fs.readFileSync(archivo, "utf8")
        );
    } catch {
        return null;
    }
}

function guardarUsuario(usuario) {
    const archivo = archivoUsuario(usuario.jid);

    fs.writeFileSync(
        archivo,
        JSON.stringify(usuario, null, 2)
    );
}

module.exports = {
    obtenerUsuario,
    guardarUsuario
};
