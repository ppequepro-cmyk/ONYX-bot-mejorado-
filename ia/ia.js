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

async function analizarImagen(buffer, mimeType="image/jpeg", instruccion="Analiza esta imagen y responde de forma natural.") {
  if (!process.env.GROQ_API_KEY) return null;
  const response = await axios.post(
    process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions",
    {
      model: process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b",
      messages: [{
        role: "system",
        content: SYSTEM_PROMPT + "\nPuedes analizar imágenes. No inventes detalles que no puedas ver."
      }, {
        role: "user",
        content: [
          { type: "text", text: instruccion },
          { type: "image_url", image_url: { url: "data:" + mimeType + ";base64," + buffer.toString("base64") } }
        ]
      }],
      max_completion_tokens: 900
    },
    {
      headers: {
        Authorization: "Bearer " + process.env.GROQ_API_KEY,
        "Content-Type": "application/json"
      },
      timeout: 30000
    }
  );
  return response.data?.choices?.[0]?.message?.content || null;
}

async function buscarImagenes(query) {
  const response = await axios.get("https://commons.wikimedia.org/w/api.php", {
    params: {
      action: "query",
      generator: "search",
      gsrsearch: query,
      gsrnamespace: 6,
      gsrlimit: 3,
      prop: "imageinfo",
      iiprop: "url",
      iiurlwidth: 900,
      format: "json",
      origin: "*"
    },
    timeout: 15000
  });
  return Object.values(response.data?.query?.pages || {})
    .map(p => p.imageinfo?.[0]?.url)
    .filter(Boolean);
}

async function mejorarImagen(buffer) {
  const fs = require("fs");
  const os = require("os");
  const path = require("path");
  const { spawn } = require("child_process");

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "onyx-enhance-"));
  const input = path.join(dir, "input.jpg");
  const output = path.join(dir, "output.jpg");

  try {
    fs.writeFileSync(input, buffer);

    await new Promise((resolve, reject) => {
      const p = spawn("ffmpeg", [
        "-y",
        "-i", input,
        "-vf", "scale=iw*2:ih*2:flags=lanczos,unsharp=5:5:0.7:5:5:0,eq=contrast=1.04:saturation=1.05",
        "-q:v", "2",
        output
      ]);

      let err = "";
      p.stderr.on("data", d => err += d.toString());
      p.on("error", reject);
      p.on("close", code => {
        if (code === 0) resolve();
        else reject(new Error(err.slice(-1200)));
      });
    });

    return fs.readFileSync(output);
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  }
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

module.exports = { preguntarONYX, analizarImagen, buscarImagenes, mejorarImagen };
