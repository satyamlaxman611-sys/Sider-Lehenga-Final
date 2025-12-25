import crypto from "crypto";

function safeEqual(a, b) {
  const ba = Buffer.from(String(a || ""), "utf8");
  const bb = Buffer.from(String(b || ""), "utf8");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });

  try {
    const { orderId, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!process.env.RAZORPAY_KEY_SECRET) return res.status(500).json({ ok: false, error: "MISSING_RAZORPAY_ENV" });

    if (!orderId || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ ok: false, error: "MISSING_FIELDS" });
    }

    // Mandatory signature verification. [web:2]
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${razorpay_payment_id}`)
      .digest("hex");

    return res.status(200).json({ ok: safeEqual(expected, razorpay_signature) });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "SERVER_ERROR", message: e?.message || "Unknown error" });
  }
}
