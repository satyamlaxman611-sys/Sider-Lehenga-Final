export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

  try {
    const { amount, currency = "INR", receipt, notes } = req.body || {};
    const amt = Number(amount);

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: "MISSING_RAZORPAY_ENV" });
    }
    if (!Number.isFinite(amt) || amt < 100) {
      return res.status(400).json({ error: "INVALID_AMOUNT" });
    }

    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
    ).toString("base64");

    const payload = {
      amount: Math.round(amt),
      currency,
      receipt: String(receipt || `sl_${Date.now()}`).slice(0, 40),
      notes: (notes && typeof notes === "object") ? notes : undefined
    };

    const r = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: "RAZORPAY_ORDER_CREATE_FAILED", details: data });

    return res.status(200).json({
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (e) {
    return res.status(500).json({ error: "SERVER_ERROR", message: e?.message || "Unknown error" });
  }
}
