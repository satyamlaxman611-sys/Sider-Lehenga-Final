function b64decodeUtf8(b64) {
  return Buffer.from(String(b64 || ""), "base64").toString("utf8");
}

function safeJsonArray(s) {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });

  try {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    const path = process.env.GITHUB_ORDERS_PATH || "data/orders.json";

    if (!token || !owner || !repo) return res.status(500).json({ ok: false, error: "MISSING_GITHUB_ENV" });

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
    const gr = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json"
      }
    });

    if (gr.status === 404) return res.status(200).json({ ok: true, orders: [] });

    const gj = await gr.json();
    if (!gr.ok) return res.status(gr.status).json({ ok: false, error: "GITHUB_READ_FAILED", details: gj });

    const content = String(gj.content || "").replace(/
/g, "");
    const raw = (gj.encoding === "base64") ? b64decodeUtf8(content) : "";
    const orders = safeJsonArray(raw);

    return res.status(200).json({ ok: true, orders });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "SERVER_ERROR", message: e?.message || "Unknown error" });
  }
}
