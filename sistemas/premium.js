const { obtenerUsuario, guardarUsuario } = require("../usuarios");

let OWNER_JID = null;

function establecerOwner(jid) {
    OWNER_JID = jid;
}

function esOwner(jid) {
    return jid === OWNER_JID;
}

function esOwner(jid) {
    return jid === OWNER_JID;
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
    esOwner,
    esPremium,
    obtenerPlan,
    activarPremium,
    quitarPremium
};
