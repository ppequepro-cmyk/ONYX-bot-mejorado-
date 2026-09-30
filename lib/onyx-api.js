require("dotenv").config();

const API_URL = String(process.env.ONYX_API_URL || "").replace(/\/$/, "");
const API_TOKEN = String(process.env.ONYX_API_TOKEN || "");

async function onyxApi(path, options = {}) {
    if (!API_URL) {
        throw new Error("ONYX_API_URL no configurada");
    }

    if (!API_TOKEN) {
        throw new Error("ONYX_API_TOKEN no configurado");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: {
                "content-type": "application/json",
                Authorization: `Bearer ${API_TOKEN}`,
                ...(options.headers || {})
            },
            signal: controller.signal
        });

        const text = await response.text();
        let data;

        try {
            data = JSON.parse(text);
        } catch {
            data = { raw: text };
        }

        if (!response.ok) {
            const error = new Error(data?.error || `ONYX API respondió HTTP ${response.status}`);
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    } finally {
        clearTimeout(timeout);
    }
}

async function health() {
    return onyxApi("/api/health", { method: "GET" });
}

module.exports = {
    onyxApi,
    health
};
