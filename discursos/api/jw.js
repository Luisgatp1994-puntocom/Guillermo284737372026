// Trae el programa de Vida y Ministerio de una semana desde wol.jw.org (Guía de actividades en español)
// Uso: /api/jw?fecha=2026-11-16  (lunes de la semana)
const BASE = "https://wol.jw.org";
const H = { "User-Agent": "Mozilla/5.0 (CRABS Tierra Baja)", "Accept-Language": "es" };

function semanaIso(f) {
  const d = new Date(f + "T12:00:00Z");
  const dia = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - dia + 3);
  const y = d.getUTCFullYear(); const p = new Date(Date.UTC(y, 0, 4));
  const w = 1 + Math.round(((d - p) / 864e5 - 3 + ((p.getUTCDay() + 6) % 7)) / 7);
  return { y, w };
}
const ent = s => s.replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&rsquo;|&lsquo;/g, "'").replace(/&ldquo;|&rdquo;/g, '"').replace(/&laquo;/g, "«").replace(/&raquo;/g, "»").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
function lineas(html) {
  const cuerpo = (html.match(/<article[\s\S]*?<\/article>/i) || [html])[0];
  return ent(cuerpo.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "").replace(/<\/(h\d|p|li|div|header|section)>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""))
    .split("\n").map(l => l.replace(/[​­]/g, "").replace(/\s+/g, " ").trim()).filter(Boolean);
}
function abrevia(t) {
  return t.replace(/lecci[oó]n\s+(\d+)\s+punto\s+(\d+)/gi, "$1/$2").replace(/lecci[oó]n\s+/gi, "").replace(/ap[eé]ndice A punto (\d+)/gi, "ap. A/$1").trim();
}
function parsear(ls) {
  const out = { lectura: "", c1: "", c2: "", c3: "", partes: [] };
  const canc = []; let sec = "";
  const MESES = /(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)/;
  for (let i = 0; i < ls.length; i++) {
    const l = ls[i];
    for (const m of l.matchAll(/Canci[oó]n\s+(\d{1,3})/g)) canc.push(m[1]);
    const U = l.toUpperCase();
    if (/^TESOROS DE LA BIBLIA/.test(U)) { sec = "tesoros"; continue; }
    if (/^SEAMOS MEJORES MAESTROS/.test(U)) { sec = "maestros"; continue; }
    if (/^NUESTRA VIDA CRISTIANA/.test(U)) { sec = "vida"; continue; }
    if (!out.lectura && !sec && l === U && /[A-ZÁÉÍÓÚÑ]{3,}/.test(l) && !MESES.test(U) && l.length < 40 && !/CANCI|VIDA Y MINISTERIO|GU[IÍ]A/.test(U)) { out.lectura = l; continue; }
    const m = l.match(/^(\d{1,2})\.\s*(.+)$/);
    if (m && sec) {
      let titulo = m[2].replace(/^[“"]|[”"]$/g, "").trim(); let resto = "";
      const enLinea = titulo.match(/^(.*?)\s*\((\d+)\s*mins?\.?\)\s*(.*)$/);
      if (enLinea) { titulo = enLinea[1].replace(/[“”"]/g, "").trim(); resto = `(${enLinea[2]} mins.) ${enLinea[3]}`; } else resto = ls[i + 1] || "";
      const min = (resto.match(/\((\d+)\s*mins?\.?\)/) || [])[1] || "";
      let ref = "";
      if (/^Lectura de la Biblia/i.test(titulo)) { const c = resto.replace(/\(\d+\s*mins?\.?\)/, "").trim().replace(/\.$/, ""); ref = abrevia(c.replace(/\(th\s+/i, "(th ")); titulo = "Lectura de la Biblia"; }
      else if (sec === "maestros") { const r = [...resto.matchAll(/\(([^()]*(?:lmd|th|lff|uoa)[^()]*)\)/gi)].map(x => x[1]).pop(); if (r) ref = "(" + abrevia(r.replace(/;.*$/, "")) + ")"; const tt = resto.match(/T[ií]tulo:\s*([^(]+?)\s*(\(|$)/); if (/^Discurso$/i.test(titulo) && tt) titulo = `Discurso: «${tt[1].replace(/\.$/, "").trim()}»`; }
      else if (/Estudio b[ií]blico/i.test(titulo)) { const r = resto.match(/wcg[^.]*?(cap\.\s*\d+)/i); if (r) ref = "(wcg " + r[1].replace(/cap\.\s*/i, "") + ")"; }
      if (!out.partes.find(p => p.n === +m[1])) out.partes.push({ n: +m[1], sec, titulo, min, ref });
    }
  }
  [out.c1, out.c2, out.c3] = [canc[0] || "", canc[1] || "", canc[2] || ""];
  return out;
}
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const fecha = String((req.query || {}).fecha || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return res.status(400).json({ error: "fecha=YYYY-MM-DD" });
    const { y, w } = semanaIso(fecha);
    const pr = await fetch(`${BASE}/es/wol/meetings/r4/lp-s/${y}/${w}`, { headers: H });
    const ph = await pr.text();
    const ids = [...ph.matchAll(/\/es\/wol\/d\/r4\/lp-s\/(\d{9,10})/g)].map(x => x[1]);
    const cerca = x => { const k = ph.indexOf(x); return ph.slice(Math.max(0, k - 800), k + 800); };
    const cand = [...new Set(ids)].filter(x => x.startsWith("20"));
    const id = cand.find(x => /Gu[ií]a de actividades|Vida y Ministerio/i.test(cerca(x))) || cand[0];
    if (!id) return res.status(404).json({ error: "Esa semana aún no está publicada en JW" });
    const dr = await fetch(`${BASE}/es/wol/d/r4/lp-s/${id}`, { headers: H });
    const prog = parsear(lineas(await dr.text()));
    if (!prog.partes.length) return res.status(404).json({ error: "No se pudo leer el programa", id });
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    res.status(200).json({ fecha, semana: w, anio: y, id, fuente: `${BASE}/es/wol/d/r4/lp-s/${id}`, ...prog });
  } catch (e) { res.status(500).json({ error: String(e) }); }
};
Object.assign(module.exports, { parsear, lineas, semanaIso });
