const axios = require("axios");

async function preguntarONYX(texto, historial = []) {
    const historialTexto = historial
        .slice(-10)
        .map((m) => `Usuario: ${m.usuario}\nONYX: ${m.ia || ""}`)
        .join("\n");

    const respuesta = await axios.get(
        "https://api.lempi.lat/ai/gemini",
        {
            params: {
                q: `Tu nombre es ONYX,IA. Eres una inteligencia artificial creada por tu dueño, ı.ᴀᴍ.oɴʏxᴋıɴɢ. Responde de forma natural, clara y útil.

Historial reciente:
${historialTexto}

Mensaje actual del usuario:
${texto}`
            },
            headers: {
                Authorization:
                    `Bearer ${process.env.LEMPI_API_KEY}`
            }
        }
    );

    return respuesta.data?.resultado?.respuesta || null;
}

module.exports = {
    preguntarONYX
};
