// Mantiene despierta la base de datos de Supabase (el plan gratis la pausa tras 7 días sin uso).
// Vercel lo ejecuta una vez al día (ver vercel.json).
module.exports = async function handler(req, res) {
  const url = "https://pswgldarwsdgznxyegov.supabase.co/rest/v1/rpc/app_ping";
  const key = "sb_publishable_s77cAYroy7Q5XSZsvslQCQ_vHEAmk12";
  try {
    const r = await fetch(url, { method: "POST", headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" }, body: "{}" });
    res.status(200).json({ ok: r.ok, status: r.status, at: new Date().toISOString() });
  } catch (e) {
    res.status(200).json({ ok: false, error: String(e) });
  }
}
