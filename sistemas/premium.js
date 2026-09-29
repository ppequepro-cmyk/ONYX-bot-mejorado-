const { obtenerUsuario, guardarUsuario } = require("../usuarios");

let OWNER_JID = null;
let OWNER_LID = null;

function normalizarJid(jid) {
    return String(jid || "").split(":")[0].trim().toLowerCase();
}

function establecerOwner(jid, lid = null) {
    OWNER_JID = normalizarJid(jid);
    OWNER_LID = normalizarJid(lid);
}

function esOwner(jid) {
    const actual = normalizarJid(jid);
    return !!actual && (actual === OWNER_JID || actual === OWNER_LID);
}


function esPremium(jid) {
    if (esOwner(jid)) return true;

    const usuario = obtenerUsuario(jid);

    if (!usuario) return false;

    if (usuario.premium !== true) return false;

    if (usuario.fechaPremium) {
        const fecha = new Date(usuario.fechaPremium);

        if (Date.now() > fecha.getTime()) {
            usuario.premium = false;
            usuario.plan = "free";
            guardarUsuario(usuario);
            return false;
        }
    }

    return true;
}

function obtenerPlan(jid) {
    if (esOwner(jid)) return "owner";
    return esPremium(jid) ? "premium" : "free";
}

function activarPremium(jid, dias = 30) {
    const usuario = obtenerUsuario(jid);

    if (!usuario) return false;

    const fecha = new Date();
    fecha.setDate(fecha.getDate() + dias);

    usuario.premium = true;
    usuario.plan = "premium";
    usuario.fechaPremium = fecha.toISOString();

    guardarUsuario(usuario);

    return usuario;
}

function quitarPremium(jid) {
    const usuario = obtenerUsuario(jid);

    if (!usuario) return false;

    usuario.premium = false;
    usuario.plan = "free";
    usuario.fechaPremium = null;

    guardarUsuario(usuario);

    return usuario;
}

    module.exports = {
    establecerOwner,
    esOwner,
    esPremium,
    obtenerPlan,
    activarPremium,
    quitarPremium
};
