function b64encodeUtf8(str) {
  return Buffer.from(String(str), "utf8").toString("base64");
}
function b64decodeUtf8(b64) {
  return Buffer.from(String(b64 || ""), "base64").toString("utf8");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });

  try {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";
    const path = process.env.GITHUB_ORDERS_PATH || "data/orders.json";

    if (!token || !owner || !repo) return res.status(500).json({ ok: false, error: "MISSING_GITHUB_ENV" });

    const order = req.body || {};
    if (!order.orderId || !order.paymentId) return res.status(400).json({ ok: false, error: "MISSING_ORDER_FIELDS" });

    // 1) Read existing file to get sha + content (base64). [web:119]
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
    const gr = await fetch(getUrl, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json"
      }
    });
    const gj = await gr.json();

    let sha = gj.sha || null;
    let currentArr = [];

    if (gr.ok && gj && gj.content && gj.encoding === "base64") {
      const raw = b64decodeUtf8(String(gj.content).replace(/
/g, ""));
      try {
        const parsed = JSON.parse(raw);
        currentArr = Array.isArray(parsed) ? parsed : [];
      } catch {
        currentArr = [];
      }
    } else if (gr.status === 404) {
      sha = null;
      currentArr = [];
    } else if (!gr.ok) {
      return res.status(gr.status).json({ ok: false, error: "GITHUB_READ_FAILED", details: gj });
    }

    // prevent duplicates by paymentId
    if (currentArr.some(x => x && x.paymentId === order.paymentId)) {
      return res.status(200).json({ ok: true, deduped: true });
    }

    currentArr.unshift(order);

    const updated = JSON.stringify(currentArr, null, 2);
    const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;

    const payload = {
      message: `order: ${order.orderId}`,
      content: b64encodeUtf8(updated),
      branch
    };
    if (sha) payload.sha = sha;

    // 2) Update/Create file content via Contents API (Base64 + sha). [web:119]
    const pr = await fetch(putUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const pj = await pr.json();
    if (!pr.ok) return res.status(pr.status).json({ ok: false, error: "GITHUB_WRITE_FAILED", details: pj });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "SERVER_ERROR", message: e?.message || "Unknown error" });
  }
}
