const axios = require("axios");

const SYSTEM_PROMPT = `Tu nombre es ONYX,IA. Eres una inteligencia artificial creada por tu dueño, ı.ᴀᴍ.oɴʏxᴋıɴɢ. Responde de forma natural, clara y útil.`;

async function preguntarLemPi(texto, historialTexto) {
  const respuesta = await axios.get("https://api.lempi.lat/ai/gemini", {
    params: {
      q: `${SYSTEM_PROMPT}

Historial reciente:
${historialTexto}

Mensaje actual del usuario:
${texto}`
    },
    headers: { Authorization: `Bearer ${process.env.LEMPI_API_KEY}` },
    timeout: 30000
  });
  return respuesta.data?.resultado?.respuesta || null;
}

async function preguntarGroq(texto, historialTexto) {
  if (!process.env.GROQ_API_KEY) return null;

  const response = await axios.post(
    process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions",
    {
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + "\n\nHistorial reciente:\n" + historialTexto },
        { role: "user", content: texto }
      ],
      temperature: 0.6,
      max_completion_tokens: 1024
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      timeout: 30000
    }
  );

  return response.data?.choices?.[0]?.message?.content || null;
}

async function preguntarONYX(texto, historial = []) {
  const historialTexto = historial
    .slice(-10)
    .map((m) => `Usuario: ${m.usuario}\nONYX: ${m.ia || ""}`)
    .join("\n");

  try {
    const respuesta = await preguntarLemPi(texto, historialTexto);
    if (respuesta) return respuesta;
    console.warn("⚠️ LemPi respondió vacío. Intentando Groq...");
  } catch (error) {
    console.error("⚠️ LemPi falló:", error.response?.data || error.message);
  }

  try {
    const respuesta = await preguntarGroq(texto, historialTexto);
    if (respuesta) return respuesta;
    console.warn("⚠️ Groq respondió vacío o no está configurado.");
  } catch (error) {
    console.error("⚠️ Groq falló:", error.response?.data || error.message);
  }

  return null;
}

module.exports = { preguntarONYX };
