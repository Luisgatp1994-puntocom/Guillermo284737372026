/* CRABS · Congregación Tierra Baja — secciones de toda la congregación
   Publicadores y grupos · Predicación (salidas y territorios) · Reuniones (Vida y Ministerio, acomodadores)
   Informes · Recordatorios (aseo, hospitalidad, eventos) · Notificaciones · Usuarios
   Usa helpers de app.js: $, esc, toast, hoja, I, rpc, fd, MES, HOY, dias, copiar, linkWa, normContacto, LS */

I.xls = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8.5 12.5l4 5M12.5 12.5l-4 5"/></svg>';
const CG = { imgs:{}, imgIds:{}, imgsOk:false, me:null, personas:[], reg:[], avisos:[], sec:null, tab:null, mes:null };
const HOR = { tb16:"4:00 PM", tb18:"6:15 PM" };
const PRIV = { anciano:"Anciano", siervo:"Siervo ministerial", publicador:"Publicador", no_bautizado:"No bautizado" };
const PREC = { no:"", regular:"Precursor regular", auxiliar:"Precursor auxiliar", especial:"Precursor especial", misionero:"Misionero en el campo" };
const DIAS = ["","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const COLOR_DIA = { 1:"D9BDE8", 2:"E8604C", 3:"8DC66B", 4:"C9372C", 5:"7CC8EC", 6:"F3DDD3", 7:"FFD200" };
const MODALIDADES = ["Predicación pública","Cartas y teléfono","Cartas, teléfono y Zoom"];
const MOD_NOMBRE = { disc:"Discursos", pub:"Publicadores", pred_salida:"Predicación", territorio:"Territorios", terr_visita:"Territorios", vmc:"Vida y Ministerio", acomod:"Acomodadores", aseo:"Aseo", informe:"Informes", evento:"Eventos", recordatorio:"Recordatorios" };

const cAdmin = () => CG.me && CG.me.rol === "admin";
const cSuper = () => cAdmin();
const P = id => CG.personas.find(p => p.id === id);
const nom = v => { if (!v) return ""; const p = P(v); return p ? p.nombre : String(v); };
const nomCorto = v => { const n = nom(v); const a = n.split(" "); return a.length > 2 ? a[0] + " " + a[a.length - 1] : n; };
const R = m => CG.reg.filter(r => r.m === m);
const mesActual = () => HOY.slice(0, 7);
const mesNombre = ym => { const [y, m] = ym.split("-").map(Number); return MES[m - 1] + " " + y; };
const mesMas = (ym, n) => { const [y, m] = ym.split("-").map(Number); const d = new Date(y, m - 1 + n, 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); };
const isoDia = f => { const d = new Date(f + "T12:00:00").getDay(); return d === 0 ? 7 : d; };
const lunesDe = f => { const d = new Date(f + "T12:00:00"); d.setDate(d.getDate() - (isoDia(f) - 1)); return d.toISOString().slice(0, 10); };
const sumDias = (f, n) => { const d = new Date(f + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const diasMes = ym => { const [y, m] = ym.split("-").map(Number); const out = []; const d = new Date(y, m - 1, 1, 12); while (d.getMonth() === m - 1) { out.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); } return out; };
const corto = f => { const F = fd(f); return F.d + " " + F.m.slice(0, 3); };

/* ---------- Datos ---------- */
async function cCargar(mods) {
  const d = await rpc("cong_data", { p_modulos: mods || ["pred_salida","territorio","terr_visita","vmc","acomod","aseo","informe","evento","recordatorio","pred_nota","asist"] });
  CG.me = d.me; CG.personas = d.personas || []; CG.reg = d.reg || [];
}
async function cGuardar(m, clave, id, datos, aviso) {
  document.body.classList.add("loading");
  try { const r = await rpc("cong_reg_guardar", { p_modulo: m, p_clave: clave || "", p_id: id || null, p_d: datos, p_aviso: aviso || null }); await cCargar(); return r; }
  catch (e) { toast(e.message); throw e; }
  finally { document.body.classList.remove("loading"); }
}
async function cBorrar(id, aviso) {
  document.body.classList.add("loading");
  try { await rpc("cong_reg_borrar", { p_id: id, p_aviso: aviso || null }); await cCargar(); }
  catch (e) { toast(e.message); throw e; }
  finally { document.body.classList.remove("loading"); }
}

/* ---------- Controles comunes ---------- */
function selPersona(id, val, filtro, vacio) {
  const lista = CG.personas.filter(filtro || (() => true));
  const H = lista.filter(p => p.sexo === "H"), M = lista.filter(p => p.sexo === "M");
  const op = p => `<option value="${p.id}" ${val === p.id ? "selected" : ""}>${esc(p.nombre)}</option>`;
  const extra = val && !P(val) ? `<option value="${esc(val)}" selected>${esc(val)}</option>` : "";
  return `<select id="${id}" class="csel"><option value="">${vacio || "—"}</option>${extra}${H.length ? `<optgroup label="Hermanos">${H.map(op).join("")}</optgroup>` : ""}${M.length ? `<optgroup label="Hermanas">${M.map(op).join("")}</optgroup>` : ""}</select>`;
}
const esHermano = p => p.sexo === "H";
const esNombrado = p => p.privilegio === "anciano" || p.privilegio === "siervo";
const val = (bg, id) => { const e = bg.querySelector("#" + id); return e ? e.value.trim() : ""; };
const campo = (lab, html) => `<div class="cf"><span class="flab">${lab}</span>${html}</div>`;
const mayus = t => (t = String(t || "").trim()) ? t[0].toUpperCase() + t.slice(1) : t;
const inp = (id, v, ph, extra) => `<input id="${id}" value="${esc(v || "")}" placeholder="${esc(ph || "")}" ${extra || ""}>`;
function mesSelector(onCambio) {
  return { html: `<div class="mesnav"><button class="x" data-mes="-1" aria-label="Mes anterior">‹</button><label class="mespick"><b>${mesNombre(CG.mes)} ▾</b><input type="month" id="mesPick" value="${CG.mes}"></label><button class="x" data-mes="1" aria-label="Mes siguiente">›</button></div>`,
    bind: () => { document.querySelectorAll("[data-mes]").forEach(b => b.onclick = () => { CG.mes = mesMas(CG.mes, +b.dataset.mes); onCambio(); });
      const mp = document.querySelector("#mesPick"); if (mp) mp.onchange = () => { if (/^\d{4}-\d{2}$/.test(mp.value)) { CG.mes = mp.value; onCambio(); } }; } };
}
function tabs(lista) {
  return `<div class="roles ctabs">${lista.map(([k, l]) => `<button class="chipo ${CG.tab === k ? "" : "off"}" data-ctab="${k}">${l}</button>`).join("")}</div>`;
}
function bindTabs() { document.querySelectorAll("[data-ctab]").forEach(b => b.onclick = () => { CG.tab = b.dataset.ctab; cRender(); }); }
const vacio = t => `<div class="card empty">${t}</div>`;
const btnExcel = (id, t) => `<button class="btn line xls" id="${id}">${I.xls} ${t || "Exportar a Excel"}</button>`;

/* ---------- Excel (ExcelJS bajo demanda) ---------- */
let _xl = null;
function cargarExcel() {
  if (window.ExcelJS) return Promise.resolve(window.ExcelJS);
  if (_xl) return _xl;
  _xl = new Promise((ok, no) => { const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js"; s.onload = () => ok(window.ExcelJS); s.onerror = () => { _xl = null; no(new Error("No se pudo cargar el generador de Excel. Revisa tu internet.")); }; document.head.appendChild(s); });
  return _xl;
}
const borde = { top: { style: "thin", color: { argb: "FF555555" } }, left: { style: "thin", color: { argb: "FF555555" } }, bottom: { style: "thin", color: { argb: "FF555555" } }, right: { style: "thin", color: { argb: "FF555555" } } };
const relleno = hex => ({ type: "pattern", pattern: "solid", fgColor: { argb: "FF" + hex } });
function hojaImprimible(ws, horizontal) {
  ws.pageSetup = { paperSize: 1, orientation: horizontal ? "landscape" : "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } };
  ws.headerFooter = { oddFooter: "&L&8CRABS · Congregación Tierra Baja&R&8Página &P de &N" };
}
function celda(ws, ref, v, o) {
  const c = ws.getCell(ref); c.value = v; o = o || {};
  c.font = { name: "Arial", size: o.size || 10, bold: !!o.bold, color: { argb: "FF" + (o.color || "111111") } };
  c.alignment = { vertical: "middle", horizontal: o.align || "left", wrapText: true };
  if (o.fill) c.fill = relleno(o.fill);
  if (o.border !== false) c.border = borde;
  return c;
}
// Entrega de archivos: abre el menú de compartir del celular (WhatsApp sale ahí). Si el celular ya no deja abrirlo
// porque el archivo tardó en armarse, muestra un botón para compartir con un toque.
function bajarArchivo(blob, nombre) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); }
const saludoHora = () => { const h = new Date().getHours(); return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches"; };
function copiarSilencio(t) { try { navigator.clipboard.writeText(t).catch(() => {}); } catch (e) {} }
// PDF → imágenes JPG (para quien no abre PDF en el celular), con pdf.js
let _pdfjs = null;
async function cargarPdfJs() {
  if (_pdfjs) return _pdfjs;
  await new Promise((ok, ko) => { const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"; sc.onload = ok; sc.onerror = () => ko(new Error("No se pudo cargar el conversor a imagen. Revisa el internet.")); document.head.appendChild(sc); });
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  return (_pdfjs = window.pdfjsLib);
}
async function pdfAImagenes(bytes, base) {
  const L = await cargarPdfJs(); const doc = await L.getDocument({ data: bytes.slice(0) }).promise; const out = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const pg = await doc.getPage(i); const vp = pg.getViewport({ scale: 2.4 }); const c = document.createElement("canvas"); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
    const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); await pg.render({ canvasContext: ctx, viewport: vp }).promise;
    const bl = await new Promise(r => c.toBlob(r, "image/jpeg", .92)); out.push(new File([bl], `${base}${doc.numPages > 1 ? ` (${i} de ${doc.numPages})` : ""}.jpg`, { type: "image/jpeg" }));
  }
  return out;
}
// Pregunta si lo quiere en PDF o en imagen
function elegirFormato(titulo, cb) {
  const bg = document.createElement("div"); bg.className = "sheet-bg";
  bg.innerHTML = `<div class="sheet" role="dialog"><div class="grab"></div><div class="shead"><h2>${esc(titulo)}</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
    <p class="note" style="margin:0 2px 6px">¿Cómo lo quieres compartir?</p>
    <div class="fmt"><button data-f="img"><i>🖼</i><b>Imagen</b><small>Se ve en cualquier celular, directo en el chat</small></button><button data-f="pdf"><i>📄</i><b>PDF</b><small>Para imprimir o guardar</small></button></div></div>`;
  document.body.appendChild(bg);
  const close = () => bg.remove(); bg.onclick = e => { if (e.target === bg) close(); }; bg.querySelector("[data-close]").onclick = close;
  bg.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { close(); cb(b.dataset.f); });
}
// Entrega: abre el menú de compartir del celular (WhatsApp sale ahí). Si el celular no deja abrirlo solo, muestra un botón.
async function entregar(arch, nombre, listo, mensaje) {
  const files = Array.isArray(arch) ? arch : [new File([arch], nombre, { type: arch.type })];
  const bajarTodo = () => files.forEach((f, i) => setTimeout(() => bajarArchivo(f, f.name), i * 400));
  const puede = !!(navigator.canShare && navigator.canShare({ files }));
  if (!puede) { bajarTodo(); toast(listo); return; }
  const datos = mensaje ? { files, title: nombre, text: mensaje } : { files, title: nombre };
  if (mensaje) copiarSilencio(mensaje);
  try { await navigator.share(datos); if (mensaje) toast("El mensaje también quedó copiado, por si WhatsApp no lo pega"); return; } catch (e) { if (e && e.name === "AbortError") return; }
  const esImg = files[0].type.startsWith("image/");
  const bg = document.createElement("div"); bg.className = "sheet-bg";
  bg.innerHTML = `<div class="sheet" role="dialog"><div class="grab"></div><div class="shead"><h2>✅ ${esc(listo)}</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
    <p class="note" style="margin:0 2px 10px">${esImg ? "🖼" : "📄"} ${files.length > 1 ? `${files.length} imágenes` : esc(files[0].name)}</p>
    ${mensaje ? `<div class="card spad" style="margin-bottom:12px;white-space:pre-line;font-size:14px">${esc(mensaje)}</div>` : ""}
    <button class="btn ok" id="shWa" style="width:100%;font-size:17px;padding:16px">${I.wa} Compartir por WhatsApp</button><p class="note" style="margin:8px 2px 12px;text-align:center">Escoge WhatsApp y el chat o grupo.${mensaje ? " El mensaje queda copiado: si no aparece, mantén presionado y pega." : ""}</p>
    <button class="btn line" id="shBaj" style="width:100%">⬇ Descargar</button></div>`;
  document.body.appendChild(bg);
  const close = () => bg.remove(); bg.onclick = e => { if (e.target === bg) close(); }; bg.querySelector("[data-close]").onclick = close;
  bg.querySelector("#shWa").onclick = async () => { if (mensaje) copiarSilencio(mensaje); try { await navigator.share(datos); close(); } catch (e) { if (!e || e.name !== "AbortError") { bajarTodo(); close(); } } };
  bg.querySelector("#shBaj").onclick = () => { bajarTodo(); close(); };
}
async function descargar(wb, nombre) {
  nombre = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  await entregar(blob, nombre, "Excel listo");
}
async function conExcel(fn) {
  document.body.classList.add("loading");
  try { const X = await cargarExcel(); await fn(X); } catch (e) { toast(e.message || "No se pudo exportar"); }
  finally { document.body.classList.remove("loading"); }
}

/* ---------- Navegación ---------- */
const SEC = {
  pub: { titulo: "Publicadores", sub: "Grupos de servicio", tabs: [["lista", "Por grupo"], ["usuarios", "Usuarios y PIN"]] },
  pred: { titulo: "Predicación", sub: "Salidas y territorios", tabs: [["horario", "Horario"], ["terr", "Territorios"], ["stats", "📊 Estadísticas"]] },
  reu: { titulo: "Reuniones", sub: "Programa y asignaciones", tabs: [["vmc", "Vida y Ministerio"], ["acomod", "Acomodadores"], ["asist", "Asistencia"]] },
  inf: { titulo: "Informes", sub: "Informe mensual por grupo", tabs: [] },
  rec: { titulo: "Recordatorios", sub: "Aseo, hospitalidad y eventos", tabs: [["aseo", "Aseo y hospitalidad"], ["eventos", "Eventos"]] },
  avi: { titulo: "Notificaciones", sub: "Cambios de toda la congregación", tabs: [] }
};
async function abrirCong(sec) {
  if (sec !== "avi" && !puede(sec)) { toast("No tienes acceso a esa sección"); return; }
  CG.sec = sec; CG.tab = (SEC[sec].tabs[0] || [])[0] || null; CG.mes = CG.mes || mesActual();
  $("#hub").hidden = true; $("#app").hidden = true; $("#cong").hidden = false; $("#fab").hidden = true;
  $("#cview").innerHTML = `<div class="empty">Cargando…</div>`;
  try { await cCargar(); if (sec === "avi") CG.avisos = await rpc("cong_avisos", {}); } catch (e) { toast(e.message); }
  if (sec === "avi") LS.set("crabs_avisos_vistos", CG.avisos[0] ? CG.avisos[0].t : "");
  cRender(); scrollTo(0, 0);
}
function cRender() {
  const S = SEC[CG.sec];
  $("#ctit").textContent = S.titulo; $("#csub").textContent = S.sub;
  const fn = { pub: vPub, pred: vPred, reu: vReu, inf: vInf, rec: vRec, avi: vAvi }[CG.sec];
  fn();
}
function cVolver() { $("#cong").hidden = true; mostrarInicio(); }

/* ================= PUBLICADORES ================= */
let fPub = "";
function chipsPersona(p) {
  const c = [];
  if (p.encargado === "encargado") c.push(`<span class="pill t-acc">Encargado</span>`);
  if (p.encargado === "auxiliar") c.push(`<span class="pill t-acc">Auxiliar</span>`);
  if (p.privilegio === "anciano") c.push(`<span class="pill t-info">Anciano</span>`);
  if (p.privilegio === "siervo") c.push(`<span class="pill t-cyan">Siervo</span>`);
  if (p.privilegio === "no_bautizado") c.push(`<span class="pill t-idle">No bautizado</span>`);
  if (p.precursor !== "no") c.push(`<span class="pill t-ok">${PREC[p.precursor].replace("Precursor ", "P. ")}</span>`);
  return c.join("");
}
function vPub() {
  if (CG.tab === "usuarios") return vUsuarios();
  const q = norm(fPub);
  const tot = CG.personas.length, anc = CG.personas.filter(p => p.privilegio === "anciano").length, sm = CG.personas.filter(p => p.privilegio === "siervo").length, pr = CG.personas.filter(p => p.precursor === "regular" || p.precursor === "especial").length, pa = CG.personas.filter(p => p.precursor === "auxiliar").length;
  let h = (cSuper() ? tabs(SEC.pub.tabs) : "") + `<div class="kpis">${[[tot, "Publicadores"], [anc, "Ancianos"], [sm, "Siervos"], [pr + pa, "Precursores"]].map(([n, l]) => `<div class="kpi"><span class="n">${n}</span><span class="l">${l}</span></div>`).join("")}</div>
  <input id="bqp" placeholder="Buscar hermano…" value="${esc(fPub)}" style="margin:12px 0 4px">`;
  for (const hor of ["tb16", "tb18"]) {
    h += `<div class="label">Horario ${HOR[hor]}</div>`;
    for (const g of [1, 2, 3]) {
      if (!veTodos() && miGrupoKey() !== hor + "|" + g) continue;
      const l = CG.personas.filter(p => p.horario === hor && p.grupo === g && (!q || norm(p.nombre).includes(q)));
      if (!l.length && q) continue;
      const enc = CG.personas.find(p => p.horario === hor && p.grupo === g && p.encargado === "encargado");
      h += `<div class="card gcard"><div class="ghead"><span class="gnum g${g}">Grupo ${g}</span><span class="note">${enc ? "Encargado: <b>" + esc(enc.nombre) + "</b>" : "Sin encargado"} · ${l.length}</span></div>
        ${l.map(p => `<button class="prow" data-pid="${p.id}"><span class="av ${p.sexo === "H" ? "t-acc" : "t-warn"}">${esc(ini(p.nombre))}</span><span class="pn">${esc(p.nombre)}</span><span class="pchips">${chipsPersona(p)}</span></button>`).join("")}</div>`;
    }
  }
  h += `<div class="row" style="margin-top:12px">${cSuper() ? `<button class="btn pri" id="nuevoP">+ Publicador</button>` : ""}${btnExcel("xlsGrupos", "Excel de grupos")}</div>
  ${cSuper() ? "" : `<p class="note" style="margin-top:8px">Solo el super administrador agrega publicadores o los cambia de grupo.</p>`}`;
  $("#cview").innerHTML = h; bindTabs();
  $("#bqp").oninput = e => { fPub = e.target.value; const pos = e.target.selectionStart; vPub(); const n = $("#bqp"); n.focus(); n.setSelectionRange(pos, pos); };
  document.querySelectorAll("[data-pid]").forEach(b => b.onclick = () => fichaPersona(b.dataset.pid));
  if ($("#nuevoP")) $("#nuevoP").onclick = () => fichaPersona(null);
  $("#xlsGrupos").onclick = () => conExcel(xlsGrupos);
}
function fichaPersona(id) {
  const p = id ? P(id) : { nombre: "", sexo: "H", horario: "tb16", grupo: 1, privilegio: "publicador", precursor: "no", encargado: "", tel: "", notas: "" };
  const ed = cAdmin(), sup = cSuper();
  const opt = (o, v) => Object.entries(o).map(([k, l]) => `<option value="${k}" ${v === k ? "selected" : ""}>${l || "No"}</option>`).join("");
  const dis = ed ? "" : "disabled", disS = sup ? "" : "disabled";
  hoja(`<div class="shead"><h2>${id ? esc(p.nombre) : "Nuevo publicador"}</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
    ${campo("Nombre", inp("pfN", p.nombre, "Nombre y apellido", disS))}
    <div class="grid2">${campo("Sexo", `<select id="pfS" class="csel" ${dis}>${opt({ H: "Hermano", M: "Hermana" }, p.sexo)}</select>`)}${campo("Horario del sábado", `<select id="pfH" class="csel" ${disS}>${opt(HOR, p.horario)}</select>`)}</div>
    <div class="grid2">${campo("Grupo de servicio", `<select id="pfG" class="csel" ${disS}>${[1, 2, 3].map(g => `<option ${p.grupo === g ? "selected" : ""}>${g}</option>`).join("")}</select>`)}${campo("En el grupo", `<select id="pfE" class="csel" ${dis}>${opt({ "": "Integrante", encargado: "Encargado", auxiliar: "Auxiliar" }, p.encargado)}</select>`)}</div>
    <div class="grid2">${campo("Privilegio", `<select id="pfP" class="csel" ${dis}>${opt(PRIV, p.privilegio)}</select>`)}${campo("Precursor", `<select id="pfR" class="csel" ${dis}>${opt(PREC, p.precursor)}</select>`)}</div>
    ${cAdmin() ? `<div class="grid2">${campo("Fecha de nacimiento", `<input id="pfNa" type="date" value="${esc(p.nacimiento || "")}" ${dis}>`)}${campo("Fecha de bautismo", `<input id="pfBa" type="date" value="${esc(p.bautismo || "")}" ${dis}>`)}</div>
    ${campo("Esperanza", `<select id="pfU" class="csel" ${dis}><option value="0" ${p.ungido ? "" : "selected"}>Otras ovejas</option><option value="1" ${p.ungido ? "selected" : ""}>Ungido</option></select>`)}` : ""}
    ${cAdmin() ? campo("WhatsApp (celular o @usuario)", inp("pfT", p.tel, "300 000 0000", dis)) + campo("Notas", inp("pfO", p.notas, "", dis)) : ""}
    ${cAdmin() && id ? `<button class="btn line" id="pfAcc">${p.acceso ? "🔑 Ya tiene acceso a la app" : "🔑 Darle acceso a la app (publicador)"}</button>` : ""}
    ${cAdmin() && id ? `<button class="btn line" id="pfS21">📄 Tarjeta S-21 (año de servicio ${anioServicio(CG.mes || mesActual())})</button>` : ""}
    ${!sup && ed ? `<p class="note">Nombre, horario y grupo solo los cambia el super administrador.</p>` : ""}${ed ? `<button class="btn pri" id="pfOk">Guardar</button>${id && sup ? `<button class="btn bad" id="pfDel">Quitar de la lista</button>` : ""}` : `<p class="note">Solo los administradores pueden editar.</p>`}`,
    (bg, close) => {
      const acc = bg.querySelector("#pfAcc"); if (acc) acc.onclick = async () => { if (p.acceso) { close(); CG.tab = "usuarios"; cRender(); toast("Búscalo en la lista para cambiarle el PIN"); return; } close(); fichaUsuario(null, id); };
      const s21 = bg.querySelector("#pfS21"); if (s21) s21.onclick = () => exportarS21([P(id)], anioServicio(CG.mes || mesActual()), `S-21 ${p.nombre} ${anioServicio(CG.mes || mesActual())}`);
      if (!ed) return;
      const datos = () => ({ nacimiento: val(bg, "pfNa"), bautismo: val(bg, "pfBa"), ungido: val(bg, "pfU") === "1", nombre: val(bg, "pfN"), sexo: val(bg, "pfS"), horario: val(bg, "pfH"), grupo: +val(bg, "pfG"), encargado: val(bg, "pfE"), privilegio: val(bg, "pfP"), precursor: val(bg, "pfR"), tel: normContacto(val(bg, "pfT")), notas: val(bg, "pfO") });
      bg.querySelector("#pfOk").onclick = async () => {
        const d = datos(); if (!d.nombre) { toast("Escribe el nombre"); return; }
        if (id && (d.grupo !== p.grupo || d.horario !== p.horario)) d.aviso = `${d.nombre} pasó al grupo ${d.grupo} (${HOR[d.horario]})`;
        else if (id && (d.privilegio !== p.privilegio || d.precursor !== p.precursor)) d.aviso = `${d.nombre}: ${PRIV[d.privilegio]}${d.precursor !== "no" ? " · " + PREC[d.precursor] : ""}`;
        try { await rpc("cong_persona_guardar", { p_id: id, p_d: d }); await cCargar(); close(); toast("Guardado"); } catch (e) { toast(e.message); }
      };
      const del = bg.querySelector("#pfDel");
      if (del) del.onclick = () => { del.outerHTML = `<div class="row"><button class="btn line" id="pfNo">Cancelar</button><button class="btn bad" id="pfSi">Sí, quitar</button></div>`;
        bg.querySelector("#pfNo").onclick = close;
        bg.querySelector("#pfSi").onclick = async () => { try { await rpc("cong_persona_guardar", { p_id: id, p_d: { activo: false, aviso: `${p.nombre} salió de la lista de publicadores` } }); await cCargar(); close(); toast("Quitado"); } catch (e) { toast(e.message); } }; };
    });
}
async function xlsGrupos(X) {
  const wb = new X.Workbook(); wb.creator = "CRABS";
  for (const hor of ["tb16", "tb18"]) {
    const ws = wb.addWorksheet("Grupos " + HOR[hor].replace(":", "."), { views: [{ showGridLines: false }] });
    ws.columns = [{ width: 30 }, { width: 30 }, { width: 30 }];
    ws.mergeCells("A1:C1"); celda(ws, "A1", `GRUPOS DE SERVICIO · HORARIO ${HOR[hor]}`, { bold: true, size: 14, align: "center", border: false, color: "1F2A7A" });
    ws.mergeCells("A2:C2"); celda(ws, "A2", "Congregación Tierra Baja", { align: "center", border: false, color: "666666" });
    const fills = ["FFE24D", "8BD17C", "F4A261"];
    const cols = [1, 2, 3].map(g => CG.personas.filter(p => p.horario === hor && p.grupo === g));
    [1, 2, 3].forEach((g, i) => celda(ws, String.fromCharCode(65 + i) + "4", "Grupo " + g, { bold: true, fill: fills[i] }));
    const max = Math.max(...cols.map(c => c.length));
    for (let r = 0; r < max; r++) cols.forEach((c, i) => { const p = c[r]; const mark = p ? (p.precursor !== "no" ? " (" + (p.precursor === "auxiliar" ? "PA" : "PR") + ")" : "") : ""; celda(ws, String.fromCharCode(65 + i) + (5 + r), p ? p.nombre + mark : "", { bold: p && p.encargado === "encargado" }); });
    const fr = 6 + max; ws.mergeCells(`A${fr}:C${fr}`); celda(ws, "A" + fr, "En negrilla: encargado del grupo · PR: precursor regular · PA: precursor auxiliar", { size: 8, color: "666666", border: false });
    hojaImprimible(ws, false);
  }
  await descargar(wb, "Grupos de servicio.xlsx");
}
/* Usuarios y PIN (solo super) */
async function vUsuarios() {
  let us = []; try { us = await rpc("cong_usuarios", {}); } catch (e) { toast(e.message); }
  let h = tabs(SEC.pub.tabs) + `<p class="note" style="margin:6px 4px 12px">Cada uno entra con <b>su nombre y su PIN</b>. <b>Administrador</b> organiza y edita (solo su grupo en Informes, salvo que vea todos). <b>Consulta</b> solo mira. <b>Publicador</b> ve su espacio: asignaciones e informe.</p>
  <input id="bqu" placeholder="Buscar usuario…" style="margin:0 0 8px"><div class="list" id="ulist">`;
  h += us.map(u => `<button class="card prow2" data-uid="${u.id}" ${u.super ? "disabled" : ""}><span class="av ${u.rol === "admin" ? "t-acc" : u.rol === "publicador" ? "t-ok" : "t-idle"}">${esc(ini(u.etiqueta))}</span><span style="flex:1;min-width:0;text-align:left"><b>${esc(u.etiqueta)}</b><small class="note" style="display:block">${u.super ? "Super administrador" : u.rol === "admin" ? (u.todos ? "Administrador · ve todos los grupos" : "Administrador") : u.rol === "publicador" ? "Publicador" : "Consulta"} · ${HOR[u.grupo] || ""}</small></span></button>`).join("");
  h += `</div><button class="btn pri" style="width:100%;margin-top:12px" id="nuevoU">+ Crear acceso para un hermano</button>`;
  if (SUPER) h += vPermisos() + `<div class="label" style="margin-top:22px">Respaldos</div><div class="card spad" id="respBox"><p class="note" style="margin:0">Cargando…</p></div>`;
  $("#cview").innerHTML = h; bindTabs();
  if (SUPER) { bindPermisos(); pintaRespaldos(); }
  document.querySelectorAll("[data-uid]").forEach(b => b.onclick = () => fichaUsuario(us.find(u => u.id === +b.dataset.uid)));
  $("#nuevoU").onclick = () => fichaUsuario(null);
  $("#bqu").oninput = e => { const t = norm(e.target.value); document.querySelectorAll("#ulist [data-uid]").forEach(b => b.hidden = t && !norm(b.textContent).includes(t)); };
}
function fichaUsuario(u, personaId) {
  const per = u ? (u.persona_id ? P(u.persona_id) : null) : (personaId ? P(personaId) : null);
  const rol0 = u ? u.rol : personaId ? "publicador" : "publicador";
  hoja(`<div class="shead"><h2>${u ? esc(u.etiqueta) : "Nuevo acceso"}</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
    ${campo("Tipo de acceso", `<div class="picks" id="uRol">${[["publicador", "Publicador", "Su informe y sus asignaciones"], ["consulta", "Consulta", "Solo mira los programas"], ["admin", "Administrador", "Anciano: organiza y edita"]].map(([k, n, d]) => `<button class="pk ${rol0 === k ? "on" : ""}" data-r="${k}">${n}<small class="ciu">${d}</small></button>`).join("")}</div>`)}
    ${campo("Hermano", u && !u.persona_id && u.rol !== "publicador" ? inp("uN", u.etiqueta) : selPersona("uP", per ? per.id : "", null, "Escoge el hermano"))}
    <div id="uHw">${campo("Discursos de (horario del sábado)", `<select id="uH" class="csel">${Object.entries(HOR).map(([k, l]) => `<option value="${k}" ${(u ? u.grupo : per ? per.horario : "") === k ? "selected" : ""}>${l}</option>`).join("")}</select>`)}</div>
    ${SUPER ? `<label class="ic chk" id="uTw" style="margin:4px 0 10px"><input type="checkbox" id="uT" ${u && u.todos ? "checked" : ""}> Ve todos los grupos (coordinador o secretario)</label>` : ""}
    ${campo(u ? "Nuevo PIN (déjalo vacío para no cambiarlo)" : "PIN", inp("uX", "", "Publicador y consulta: 4 a 8 números · Admin: 6 a 8", 'inputmode="numeric" maxlength="8" autocomplete="off"'))}
    <p class="note" style="margin:0 2px 10px">El PIN puede repetirse entre hermanos: cada uno entra escogiendo su nombre.</p>
    <button class="btn pri" id="uOk">Guardar</button>${u ? `<button class="btn bad" id="uDel">Quitar acceso</button>` : ""}`,
    (bg, close) => {
      const q = x => bg.querySelector(x); let rol = rol0;
      const vis = () => { if (q("#uHw")) q("#uHw").hidden = rol === "publicador"; if (q("#uTw")) q("#uTw").hidden = rol !== "admin"; };
      bg.querySelectorAll("[data-r]").forEach(b => b.onclick = () => { rol = b.dataset.r; bg.querySelectorAll("[data-r]").forEach(x => x.classList.toggle("on", x === b)); vis(); });
      vis();
      q("#uOk").onclick = async () => {
        const pid = q("#uP") ? val(bg, "uP") : ""; const nombre = q("#uN") ? val(bg, "uN") : (pid ? nom(pid) : "");
        if (!nombre) { toast("Escoge el hermano"); return; }
        const d = { id: u ? u.id : null, rol, nombre, persona: pid || null, horario: rol === "publicador" && pid ? P(pid).horario : val(bg, "uH"), pin: val(bg, "uX") };
        if (SUPER && q("#uT")) d.todos = rol === "admin" && q("#uT").checked;
        try { document.body.classList.add("loading"); await rpc("cong_acceso_guardar", { p_d: d }); close(); toast(u ? "Acceso actualizado" : `Listo: ${nombre} ya puede entrar con su nombre y PIN`); if (CG.tab === "usuarios") vUsuarios(); else { await cCargar(); cRender(); } }
        catch (e) { toast(e.message); } finally { document.body.classList.remove("loading"); }
      };
      const dl = q("#uDel"); if (dl) dl.onclick = async () => { if (!confirm(`¿Quitarle el acceso a ${u.etiqueta}?`)) return; try { await rpc("cong_usuario_borrar", { p_id: u.id }); close(); toast("Acceso quitado"); vUsuarios(); } catch (e) { toast(e.message); } };
    });
}

/* ================= PREDICACIÓN ================= */
function salidasDelMes(ym) {
  const out = [];
  const regs = R("pred_salida");
  for (const f of diasMes(ym)) {
    const dd = isoDia(f);
    regs.filter(r => r.d.tipo === "fija" && +r.d.dia === dd && (!r.d.desde || r.d.desde <= f) && (!r.d.hasta || r.d.hasta >= f)).forEach(r => out.push({ f, r, fija: true }));
    regs.filter(r => r.d.tipo === "fecha" && r.d.fecha === f).forEach(r => out.push({ f, r, fija: false }));
  }
  return out.sort((a, b) => a.f < b.f ? -1 : a.f > b.f ? 1 : (a.r.d.turno === "Mañana" ? -1 : 1));
}
const nomTerr = v => { if (!v) return ""; const t = R("territorio").find(x => x.id === v); return t ? `${t.d.numero ? t.d.numero + " · " : ""}${t.d.nombre}` : v; };
function visitaDe(f, salidaId) { return R("terr_visita").find(v => v.k === f && v.d.salida === salidaId); }
let PS = { lunes: null, dia: null, mes: null };
function vPred() {
  if (CG.tab === "terr") return vTerr();
  if (CG.tab === "stats") return vStats();
  const ms = mesSelector(vPred);
  const fijas = R("pred_salida").filter(r => r.d.tipo === "fija").sort((a, b) => a.d.dia - b.d.dia || (a.d.turno === "Mañana" ? -1 : 1));
  const delMes = salidasDelMes(CG.mes);
  const hechas = delMes.filter(s => visitaDe(s.f, s.r.id)).length;
  let h = tabs(SEC.pred.tabs) + ms.html + `<div class="kpis k3">${[[delMes.length, "Salidas del mes"], [hechas, "Realizadas"], [delMes.filter(s => s.f < HOY && !visitaDe(s.f, s.r.id)).length, "Sin marcar"]].map(([n, l]) => `<div class="kpi"><span class="n">${n}</span><span class="l">${l}</span></div>`).join("")}</div>`;
  // Semana con detalle por día
  const lun0 = lunesDe(HOY);
  if (!PS.lunes || (PS.mes !== CG.mes)) { PS.mes = CG.mes; PS.lunes = lun0.slice(0, 7) === CG.mes || sumDias(lun0, 6).slice(0, 7) === CG.mes ? lun0 : lunesDe(CG.mes + "-01"); PS.dia = null; }
  const d7 = [0, 1, 2, 3, 4, 5, 6].map(n => sumDias(PS.lunes, n));
  const sal7 = [...new Set(d7.map(f => f.slice(0, 7)))].flatMap(m => salidasDelMes(m)).filter(x => d7.includes(x.f));
  if (!PS.dia || !d7.includes(PS.dia)) PS.dia = d7.includes(HOY) ? HOY : d7[0];
  h += `<div class="label">Semana</div><div class="card spad"><div class="wknav"><button class="x" data-ps="-7" aria-label="Semana anterior">‹</button><b>${fd(d7[0]).d} ${fd(d7[0]).m.slice(0, 3)} – ${fd(d7[6]).d} ${fd(d7[6]).m.slice(0, 3)}</b><button class="x" data-ps="7" aria-label="Semana siguiente">›</button></div>
    <div class="wk">${d7.map(f => { const l = sal7.filter(x => x.f === f); const dd = isoDia(f); const ok = l.filter(x => visitaDe(x.f, x.r.id)).length;
      return `<button class="wkd ${f === PS.dia ? "on" : ""}" data-pd="${f}" style="--c:#${COLOR_DIA[dd]}"><small>${f === HOY ? "Hoy" : DIAS[dd].slice(0, 3)}</small><b>${fd(f).d}</b><i>${l.length ? (ok === l.length && f < HOY ? "✓" : "•".repeat(Math.min(l.length, 3))) : "–"}</i></button>`; }).join("")}</div>
    <div class="wkt">${(t => t[0].toUpperCase() + t.slice(1))(DIAS[isoDia(PS.dia)])} ${fd(PS.dia).d} de ${fd(PS.dia).m}</div>
    ${(l => l.length ? l.map(x => { const d = x.r.d; const v = visitaDe(x.f, x.r.id);
      return `<div class="wki"><button class="wkbtn" data-sid="${x.r.id}"><b>${esc([d.turno, d.hora].filter(Boolean).join(" · "))}</b>${d.nota ? ` <span class="pill t-warn">${esc(d.nota)}</span>` : ""}<div class="note">👤 ${esc(nomCorto(d.capitan) || "Sin capitán")} · 📍 ${esc(d.lugar || "—")}</div><div class="note">🗺️ ${esc(nomTerr(d.territorio) || "—")}${x.fija ? " · fija" : ""}</div></button>${cAdmin() ? `<button class="chipo mini ${v ? "" : "off"}" data-hecha="${x.f}|${x.r.id}">${v ? "✓ Hecha" : "Marcar"}</button>` : v ? `<span class="pill t-ok">✓</span>` : ""}</div>`; }).join("") : `<div class="note" style="padding:6px 2px">No hay salida este día.</div>`)(sal7.filter(x => x.f === PS.dia))}
  </div>`;
  const fechas = R("pred_salida").filter(r => r.d.tipo === "fecha" && r.d.fecha.startsWith(CG.mes)).sort((a, b) => a.d.fecha < b.d.fecha ? -1 : 1);
  h += `<details class="plg"><summary>Salidas fijas de cada semana <span class="pill t-idle">${fijas.length}</span></summary><div class="list" style="margin-top:8px">${fijas.length ? fijas.map(r => filaSalida(r, null)).join("") : vacio("Aún no hay salidas fijas. Agrega las de lunes a viernes.")}</div></details>`;
  h += `<details class="plg"><summary>Salidas por fecha · ${MES[+CG.mes.slice(5) - 1]} <span class="pill t-idle">${fechas.length}</span></summary><div class="list" style="margin-top:8px">${fechas.length ? fechas.map(r => filaSalida(r, r.d.fecha)).join("") : vacio("Sábados, domingos y visitas del superintendente van aquí.")}</div></details>`;
  const nota = R("pred_nota").find(x => x.k === CG.mes);
  h += `<div class="label">Nota del mes (sale al pie del Excel)</div><button class="card srow" id="pNota"><span style="flex:1;text-align:left;font-weight:700;color:${nota && nota.d.texto ? "#C0392B" : "var(--muted)"}">${nota && nota.d.texto ? esc(nota.d.texto) : "Sin nota. Ej: Van a haber cambios en los territorios."}</span></button>`;
  h += `<div class="row" style="margin-top:12px">${cAdmin() ? `<button class="btn pri" id="nuevaS">+ Salida</button><button class="btn line" id="copiaMes">⧉ Copiar fines de semana de ${MES[+mesMas(CG.mes, -1).slice(5) - 1]}</button>` : ""}${btnExcel("xlsPred", "Excel del mes")}</div>`;
  $("#cview").innerHTML = h; ms.bind(); bindTabs();
  document.querySelectorAll("[data-sid]").forEach(b => b.onclick = () => fichaSalida(R("pred_salida").find(r => r.id === b.dataset.sid)));
  document.querySelectorAll("[data-hecha]").forEach(b => b.onclick = () => marcarHecha(...b.dataset.hecha.split("|")));
  document.querySelectorAll("[data-ps]").forEach(b => b.onclick = () => { PS.lunes = sumDias(PS.lunes, +b.dataset.ps); PS.dia = null; const m = sumDias(PS.lunes, 3).slice(0, 7); if (m !== CG.mes) { CG.mes = m; PS.mes = m; } vPred(); });
  document.querySelectorAll("[data-pd]").forEach(b => b.onclick = () => { PS.dia = b.dataset.pd; vPred(); });
  if ($("#nuevaS")) $("#nuevaS").onclick = () => fichaSalida(null);
  $("#xlsPred").onclick = () => conExcel(xlsPredicacion);
  $("#pNota").onclick = () => { if (!cAdmin()) return; hoja(`<div class="shead"><h2>Nota de ${mesNombre(CG.mes)}</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>${campo("Nota en rojo al pie", inp("nT", nota ? nota.d.texto : "", "Van a haber cambios en los territorios"))}${campo("Nota pequeña (columna territorio)", inp("nE", nota ? nota.d.extra : "", "Manzanillo / Puerto Rey"))}<button class="btn pri" id="nOk">Guardar</button>`, (bg, close) => { bg.querySelector("#nOk").onclick = async () => { await cGuardar("pred_nota", CG.mes, nota ? nota.id : null, { texto: val(bg, "nT"), extra: val(bg, "nE") }); close(); toast("Nota guardada"); }; }); };
  if ($("#copiaMes")) $("#copiaMes").onclick = copiarFinesDeSemana;
}
function filaSalida(r, f) {
  const d = r.d; const dia = f ? isoDia(f) : +d.dia;
  return `<button class="card srow" data-sid="${r.id}"><span class="dpill" style="background:#${COLOR_DIA[dia]}">${f ? DIAS[dia].slice(0, 3) + " " + fd(f).d : DIAS[dia]}</span><div style="min-width:0;flex:1;text-align:left"><b>${esc([d.turno,d.hora].filter(Boolean).join(" · "))}</b>${d.nota ? ` <span class="pill t-warn">${esc(d.nota)}</span>` : ""}<div class="note">${esc(nomCorto(d.capitan) || "Sin capitán")} · ${esc(d.lugar || "—")} · ${esc(nomTerr(d.territorio) || "—")}</div></div></button>`;
}
function selTerritorio(id, v) {
  const ts = R("territorio").sort((a, b) => (+a.d.numero || 0) - (+b.d.numero || 0) || a.d.nombre.localeCompare(b.d.nombre));
  return `<input id="${id}" list="${id}L" value="${esc(nomTerr(v))}" placeholder="Escribe o escoge: Puerto Rey, Cartas y teléfono…" autocomplete="off"><datalist id="${id}L">${ts.map(t => `<option value="${esc(nomTerr(t.id))}">`).join("")}${MODALIDADES.map(m => `<option value="${m}">`).join("")}</datalist>`;
}
const terrDeTexto = t => { t = (t || "").trim(); if (!t) return ""; const n = norm(t); const x = R("territorio").find(r => norm(nomTerr(r.id)) === n || norm(r.d.nombre) === n || (r.d.numero && norm(r.d.numero) === n)); return x ? x.id : t; };
const lugaresUsados = () => [...new Set(["Salón del Reino", ...R("pred_salida").map(r => r.d.lugar).filter(Boolean)])];
function fichaSalida(r) {
  const d = r ? r.d : { tipo: "fija", dia: 1, turno: "Mañana", hora: "8:15", capitan: "", lugar: "Salón del Reino", territorio: "", fecha: HOY, nota: "" };
  if (!cAdmin()) { toast("Solo los administradores pueden editar"); return; }
  hoja(`<div class="shead"><h2>${r ? "Editar salida" : "Nueva salida"}</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
    ${campo("Tipo", `<div class="picks"><button class="pk ${d.tipo === "fija" ? "on" : ""}" data-tipo="fija">Fija cada semana</button><button class="pk ${d.tipo === "fecha" ? "on" : ""}" data-tipo="fecha">Una fecha</button></div>`)}
    <div id="sDia" ${d.tipo === "fija" ? "" : "hidden"}>${campo("Día", `<select id="sD" class="csel">${[1, 2, 3, 4, 5, 6, 7].map(i => `<option value="${i}" ${+d.dia === i ? "selected" : ""}>${DIAS[i]}</option>`).join("")}</select>`)}</div>
    <div id="sFecha" ${d.tipo === "fecha" ? "" : "hidden"}>${campo("Fecha", `<input id="sF" type="date" value="${esc(d.fecha || HOY)}">`)}</div>
    <div class="grid2">${campo("Turno", `<select id="sT" class="csel">${["Mañana", "Tarde"].map(x => `<option ${d.turno === x ? "selected" : ""}>${x}</option>`).join("")}</select>`)}${campo("Hora", inp("sH", d.hora, "8:15"))}</div>
    ${campo("Capitán", selPersona("sC", d.capitan, esHermano))}
    ${campo("Lugar de encuentro", inp("sL", d.lugar, "Salón del Reino, Familia Gómez…", 'list="sLL" autocomplete="off"') + `<datalist id="sLL">${lugaresUsados().map(x => `<option value="${esc(x)}">`).join("")}</datalist>`)}
    ${campo("Territorio", selTerritorio("sR", d.territorio))}
    ${campo("Nota (opcional)", inp("sN", d.nota, "Visita del superintendente, Grupo 3…"))}
    <button class="btn pri" id="sOk">Guardar</button>${r ? `<button class="btn bad" id="sDel">Borrar salida</button>` : ""}`,
    (bg, close) => {
      let tipo = d.tipo;
      bg.querySelectorAll("[data-tipo]").forEach(b => b.onclick = () => { tipo = b.dataset.tipo; bg.querySelectorAll("[data-tipo]").forEach(x => x.classList.toggle("on", x === b)); bg.querySelector("#sDia").hidden = tipo !== "fija"; bg.querySelector("#sFecha").hidden = tipo !== "fecha"; });
      bg.querySelector("#sOk").onclick = async () => {
        const nd = { tipo, dia: +val(bg, "sD"), fecha: tipo === "fecha" ? val(bg, "sF") : "", turno: val(bg, "sT"), hora: val(bg, "sH"), capitan: val(bg, "sC"), lugar: val(bg, "sL"), territorio: terrDeTexto(val(bg, "sR")), nota: val(bg, "sN") };
        const quien = tipo === "fija" ? DIAS[nd.dia] + " " + nd.turno.toLowerCase() : corto(nd.fecha);
        const aviso = r && r.d.capitan !== nd.capitan ? `Predicación ${quien}: capitán ahora ${nom(nd.capitan) || "sin asignar"}` : r ? `Predicación ${quien}: salida actualizada` : `Nueva salida de predicación: ${quien}`;
        await cGuardar("pred_salida", tipo === "fija" ? "fija" : nd.fecha.slice(0, 7), r ? r.id : null, nd, aviso); close(); toast("Salida guardada");
      };
      const del = bg.querySelector("#sDel"); if (del) del.onclick = async () => { await cBorrar(r.id, "Se borró una salida de predicación"); close(); };
    });
}
async function copiarFinesDeSemana() {
  const ant = mesMas(CG.mes, -1);
  const origen = R("pred_salida").filter(r => r.d.tipo === "fecha" && r.d.fecha.startsWith(ant));
  if (!origen.length) { toast(`${mesNombre(ant)} no tiene salidas por fecha`); return; }
  const ya = R("pred_salida").filter(r => r.d.tipo === "fecha" && r.d.fecha.startsWith(CG.mes));
  const asam = new Set(R("vmc").filter(r => r.d && /Asamblea/i.test(r.d.evento || "")).flatMap(r => [sumDias(r.k, 5), sumDias(r.k, 6)]));
  const porDia = (ym, dd) => diasMes(ym).filter(f => isoDia(f) === dd);
  let n = 0, salt = []; const nuevos = [];
  for (const dd of [1, 2, 3, 4, 5, 6, 7]) {
    const src = origen.filter(r => isoDia(r.d.fecha) === dd).sort((a, b) => a.d.fecha < b.d.fecha ? -1 : 1); if (!src.length) continue;
    const fechasO = [...new Set(src.map(r => r.d.fecha))];
    porDia(CG.mes, dd).forEach((f, i) => {
      if (ya.some(r => r.d.fecha === f)) return;
      if (asam.has(f)) { salt.push(corto(f)); return; }
      const fo = fechasO[i % fechasO.length];
      src.filter(r => r.d.fecha === fo).forEach(r => nuevos.push({ ...r.d, fecha: f }));
    });
  }
  if (!nuevos.length) { toast("No hay nada nuevo que copiar"); return; }
  document.body.classList.add("loading");
  try { for (const d of nuevos) { await rpc("cong_reg_guardar", { p_modulo: "pred_salida", p_clave: CG.mes, p_id: null, p_d: d, p_aviso: n ? null : `Predicación: se copiaron los fines de semana de ${mesNombre(ant)} a ${mesNombre(CG.mes)}` }); n++; } }
  catch (e) { toast(e.message); }
  await cCargar(); document.body.classList.remove("loading"); vPred();
  toast(`Copiadas ${n} salidas${salt.length ? ". Sin salida por asamblea: " + salt.join(", ") : ""}`);
}
async function marcarHecha(f, sid) {
  const s = R("pred_salida").find(r => r.id === sid); const v = visitaDe(f, sid);
  if (v) { await cBorrar(v.id); toast("Desmarcada"); }
  else { await cGuardar("terr_visita", f, null, { salida: sid, territorio: s.d.territorio, capitan: s.d.capitan, fecha: f }); toast("Marcada como realizada"); }
  vPred();
}
async function xlsPredicacion(X) {
  const wb = new X.Workbook(); const ws = wb.addWorksheet("Predicación", { views: [{ showGridLines: false }] });
  ws.columns = [{ width: 15 }, { width: 17 }, { width: 18 }, { width: 19 }, { width: 19 }, { width: 23 }];
  const fino = { style: "thin", color: { argb: "FF333333" } }; const caja = { top: fino, left: fino, bottom: fino, right: fino };
  const put = (ref, v, o = {}) => { const c = ws.getCell(ref); c.value = v; c.font = { name: o.font || "Arial", size: o.size || 11, bold: !!o.bold, color: { argb: "FF" + (o.color || "111111") } }; c.alignment = { vertical: "middle", horizontal: o.align || "center", shrinkToFit: true }; if (o.fill) c.fill = relleno(o.fill); if (o.box !== false) c.border = caja; return c; };
  const MX = t => String(t || "").toUpperCase();
  ws.mergeCells("A1:F1"); put("A1", "Horarios De Predicacion", { bold: true, size: 14, fill: "E7E6E6", box: false }); ws.getRow(1).height = 24;
  ws.mergeCells("A2:F2"); put("A2", `${MX(MES[+CG.mes.slice(5) - 1])}  HORARIO DE PREDICACION`, { bold: true, size: 22, color: "D0021B", fill: "FFD200", font: "Arial Black" }); ws.getRow(2).height = 34;
  ["Dia", "MAÑANA Y TARDE", "Horario", "Capitan", "Lugar", "Territorio"].forEach((t, i) => put(String.fromCharCode(65 + i) + "3", t, { bold: true, size: 9, color: "D0021B", fill: "FFD200" })); ws.getRow(3).height = 20;
  let row = 4;
  const fila = (dia, etiqueta, d) => { const fill = COLOR_DIA[dia];
    put("A" + row, etiqueta, { fill, bold: true, align: "right", size: 11 }); put("B" + row, MX(d.turno), { fill, bold: true }); put("C" + row, d.hora, { fill });
    put("D" + row, MX(nom(d.capitan)), { fill }); put("E" + row, MX(d.lugar), { fill, size: 10 }); put("F" + row, MX(nomTerr(d.territorio)), { fill, size: 10.5 }); ws.getRow(row).height = 21; row++; };
  const vacia = dia => { ["A", "B", "C", "D", "E", "F"].forEach(c => put(c + row, "", { fill: COLOR_DIA[dia] })); ws.getRow(row).height = 21; row++; };
  const ord = (a, b) => (a.r.d.turno === "Mañana" ? 0 : 1) - (b.r.d.turno === "Mañana" ? 0 : 1);
  const fijas = R("pred_salida").filter(r => r.d.tipo === "fija" && +r.d.dia <= 5 && (!r.d.hasta || r.d.hasta >= CG.mes + "-01") && (!r.d.desde || r.d.desde <= CG.mes + "-31")).sort((a, b) => a.d.dia - b.d.dia || (a.d.turno === "Mañana" ? -1 : 1));
  fijas.forEach(r => fila(+r.d.dia, MX(DIAS[r.d.dia]).normalize("NFD").replace(/[\u0300-\u036f]/g, ""), r.d));
  const mes = salidasDelMes(CG.mes);
  const otros = mes.filter(s => !s.fija && isoDia(s.f) <= 5);
  otros.forEach(s => fila(isoDia(s.f), `${MX(DIAS[isoDia(s.f)]).normalize("NFD").replace(/[\u0300-\u036f]/g, "")} ${fd(s.f).d}`, { ...s.r.d, turno: s.r.d.nota || s.r.d.turno }));
  const sab = mes.filter(s => isoDia(s.f) === 6).sort((a, b) => a.f < b.f ? -1 : a.f > b.f ? 1 : ord(a, b));
  const dom = mes.filter(s => isoDia(s.f) === 7).sort((a, b) => a.f < b.f ? -1 : a.f > b.f ? 1 : ord(a, b));
  sab.forEach(s => fila(6, `Sabado ${fd(s.f).d}`, s.r.d)); vacia(6);
  dom.forEach(s => fila(7, `DOMINGO ${fd(s.f).d}`, s.r.d)); vacia(7);
  const nota = R("pred_nota").find(x => x.k === CG.mes);
  put("A" + row, "", { fill: "F3DDD3" }); ws.mergeCells(`B${row}:E${row}`); put("B" + row, MX(nota ? nota.d.texto : ""), { bold: true, size: 10, color: "E0245E" }); put("F" + row, nota ? nota.d.extra : "", { size: 7, fill: "E7E6E6" });
  ws.pageSetup = { paperSize: 1, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 1, horizontalCentered: true, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } };
  // Hoja 2: territorios trabajados en el mes
  const w2 = wb.addWorksheet("Territorios del mes", { views: [{ showGridLines: false }] });
  w2.columns = [{ width: 10 }, { width: 30 }, { width: 14 }, { width: 40 }];
  w2.mergeCells("A1:D1"); celda(w2, "A1", `TERRITORIOS TRABAJADOS · ${mesNombre(CG.mes).toUpperCase()}`, { bold: true, size: 13, align: "center", border: false });
  ["N.º", "Territorio", "Veces", "Fechas"].forEach((t, i) => celda(w2, String.fromCharCode(65 + i) + "3", t, { bold: true, fill: "DDE3F5", align: "center" }));
  let r2 = 4; const vis = R("terr_visita").filter(v => v.k.startsWith(CG.mes));
  R("territorio").sort((a, b) => (+a.d.numero || 0) - (+b.d.numero || 0)).forEach(t => { const vs = vis.filter(v => v.d.territorio === t.id); celda(w2, "A" + r2, t.d.numero || "", { align: "center" }); celda(w2, "B" + r2, t.d.nombre); celda(w2, "C" + r2, vs.length, { align: "center", fill: vs.length ? "E3F6EC" : "FDECEB" }); celda(w2, "D" + r2, vs.map(v => corto(v.k)).join(", ")); r2++; });
  hojaImprimible(w2, false);
  await descargar(wb, `Predicación ${mesNombre(CG.mes)}.xlsx`);
}
/* Territorios */
function vTerr() {
  const ts = R("territorio").sort((a, b) => (+a.d.numero || 1e9) - (+b.d.numero || 1e9) || (tieneMapa(b) ? 1 : 0) - (tieneMapa(a) ? 1 : 0) || a.d.nombre.localeCompare(b.d.nombre));
  const vis = R("terr_visita");
  const ultima = id => vis.filter(v => v.d.territorio === id).map(v => v.k).sort().pop();
  const veces = id => vis.filter(v => v.d.territorio === id && v.k.startsWith(CG.mes)).length;
  const ms = mesSelector(vTerr);
  let h = tabs(SEC.pred.tabs) + ms.html + `<div class="list">`;
  h += `<div class="card" style="padding:8px"><div class="roles ctabs" style="margin:0 0 8px"><button class="chipo ${modoColorT === "terr" ? "" : "off"}" data-mc="terr">Color por territorio</button><button class="chipo ${modoColorT === "est" ? "" : "off"}" data-mc="est">Color por última vez</button></div><div class="tmap gen" id="tGen"></div><div class="tleg" id="tLeg"></div></div>`;
  h += `<div class="card note" style="display:flex;gap:10px;align-items:center"><span class="pill t-warn">En desarrollo</span><span>Toca un territorio en el mapa o en la lista. Dentro de cada uno se marca el límite sobre la foto satelital.</span></div>`;
  h += ts.length ? `<div class="tgrid">` + ts.map(t => { const u = ultima(t.id); const m = u ? Math.floor(dias(u, HOY) / 30.44) : null; const warn = !u || m >= 4; const im = CG.imgs[t.id];
    return `<button class="card tcard" data-tid="${t.id}"><div class="timg">${tieneMapa(t) ? `<div class="tmini" data-mini="${t.id}"></div>` : im ? `<img src="${im}" alt="">` : `<span class="note">${CG.imgsOk ? "Sin mapa ni imagen" : "Cargando…"}</span>`}<span class="tnum">${esc(t.d.numero || "—")}</span></div><div class="tinfo"><b>${esc(t.d.nombre)}</b><div class="note">${t.d.lamina ? "Lámina " + esc(t.d.lamina) + " · " : ""}${veces(t.id)}× este mes</div>${warn ? `<div class="note wtxt">${u ? "Hace " + m + " meses" : "Nunca trabajado"}</div>` : ""}</div></button>`; }).join("") + `</div>` : vacio("Agrega los territorios: número, nombre, lámina y la foto de la tarjeta.");
  h += `</div><div class="row" style="margin-top:12px">${cAdmin() ? `<button class="btn pri" id="nuevoT">+ Territorio</button>` : ""}${btnExcel("xlsTerr", "Excel de territorios")}</div>`;
  $("#cview").innerHTML = h; ms.bind(); bindTabs();
  document.querySelectorAll("[data-tid]").forEach(b => b.onclick = () => fichaTerr(ts.find(t => t.id === b.dataset.tid)));
  if ($("#nuevoT")) $("#nuevoT").onclick = () => fichaTerr(null);
  miniMapas(ts);
  document.querySelectorAll("[data-mc]").forEach(b => b.onclick = () => { modoColorT = b.dataset.mc; vTerr(); });
  if ($("#tGen")) mapaGeneral($("#tGen"), ts, ultima).then(ley => { const el = $("#tLeg"); if (!el) return;
    el.innerHTML = modoColorT === "terr" ? ley.map(x => `<span><i style="background:${x.col}"></i>${x.t.d.numero ? x.t.d.numero + " · " : ""}${esc(x.t.d.nombre)}</span>`).join("") + `<span class="nota">El puntico de cada etiqueta: 🟢 menos de 2 meses · 🟠 2 a 4 · 🔴 más de 4 o nunca</span>`
      : `<span><i style="background:#30A46C"></i>Menos de 2 meses</span><span><i style="background:#F5A524"></i>2 a 4 meses</span><span><i style="background:#E5484D"></i>Más de 4 meses o nunca</span>`; }).catch(e => { $("#tGen").innerHTML = `<div class="note" style="padding:20px">${esc(e.message)}</div>`; });
  if (!CG.imgsOk && ts.length) cargarImgs().then(() => { if (CG.sec === "pred" && CG.tab === "terr") vTerr(); });
  $("#xlsTerr").onclick = () => conExcel(xlsTerritorios);
}
function fichaTerr(t) {
  const d = t ? t.d : { numero: "", nombre: "", lamina: "", mapa: "", notas: "" };
  const vis = t ? R("terr_visita").filter(v => v.d.territorio === t.id).sort((a, b) => a.k < b.k ? 1 : -1) : [];
  const ed = cAdmin(), dis = ed ? "" : "disabled";
  hoja(`<div class="shead"><h2>${t ? esc(d.nombre) : "Nuevo territorio"}</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
    <div class="grid2">${campo("Número", inp("tN", d.numero, "1", dis + ' inputmode="numeric"'))}${campo("Lámina", inp("tL", d.lamina, "A", dis))}</div>
    ${campo("Nombre / barrio", inp("tB", d.nombre, "Puerto Rey", dis))}
    <span class="flab">Mapa del territorio</span>
    <div class="tmap" id="tMap"><div class="note" style="padding:20px;text-align:center">Cargando mapa…</div></div>
    <div class="note" id="tMapInfo" style="margin:4px 2px 0">${(d.manzanas || []).length || (d.area || []).length >= 3 ? `${(d.manzanas || [d.area]).length} manzana(s) marcadas.` : "Todavía no tiene las manzanas marcadas."}${ed ? " Usa los botones para marcarlo sobre la foto satelital." : ""}</div>
    ${ed ? `<div class="tmbar" id="tBar"><button class="btn line" data-mm="area">🟩 Manzanas</button><button class="btn line" data-mm="calle">🟨 Calles</button><button class="btn line" data-mm="ref">📍 Referencia</button><button class="btn line" id="tYo">🎯 Estoy aquí</button></div>
    <div class="tmbar" id="tBar2" hidden><button class="btn line" id="tUndo">↶ Deshacer</button><button class="btn line" id="tNueva">＋ Otra calle</button><button class="btn line" id="tNuevaM">＋ Otra manzana</button><button class="btn line" id="tBorrM">✕ Quitar manzana</button><button class="btn line" id="tClear">🗑 Borrar</button><button class="btn pri" id="tFin">✓ Listo</button></div>
    <div class="cf"><span class="flab">Ir a un punto (pega enlace o coordenadas de Google Maps)</span><div style="display:grid;grid-template-columns:1fr auto;gap:8px"><input id="tIr" placeholder="10.5123, -75.4687" autocomplete="off"><button class="btn line" id="tIrB">Ir</button></div></div>` : ""}
    ${(d.area || []).length || (d.manzanas || []).length || (d.refs || []).length || d.centro ? `<a class="btn ok" id="tNav" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${(d.centro || centroDe(d.area) || [d.refs[0].lat, d.refs[0].lng]).join(",")}">🧭 Cómo llegar (Google Maps)</a>` : ""}
    <span class="flab">Imagen del territorio</span>
    <div class="timg big" id="tImgBox">${t && CG.imgs[t.id] ? `<img src="${CG.imgs[t.id]}" alt="" id="tImg">` : `<span class="note">Sin imagen todavía</span>`}</div>
    ${ed ? `<label class="btn line" style="cursor:pointer">📷 ${t && CG.imgs[t.id] ? "Cambiar imagen" : "Subir foto o imagen"}<input type="file" accept="image/*" id="tFile" hidden></label>` : ""}
    ${campo("Enlace de Google Maps", inp("tM", d.mapa, "https://maps.app.goo.gl/…", dis))}
    ${d.mapa ? `<a class="btn line" href="${esc(d.mapa)}" target="_blank" rel="noopener">Abrir en Google Maps</a>` : ""}
    ${campo("Notas", inp("tO", d.notas, "Límites, calles, indicaciones", dis))}
    ${ed ? `<button class="btn pri" id="tOk">Guardar</button>` : ""}
    ${t ? `<span class="flab">Registro de predicación (${vis.length})</span><div class="card" style="padding-block:6px">${vis.length ? vis.slice(0, 30).map(v => `<div class="vrow"><b>${corto(v.k)} ${fd(v.k).y}</b><span class="note">${esc(nomCorto(v.d.capitan))}</span></div>`).join("") : `<div class="note">Aún no se ha marcado ninguna salida en este territorio.</div>`}</div>` : ""}
    ${ed && t ? `<button class="btn bad" id="tDel">Borrar territorio</button>` : ""}`,
    (bg, close) => {
      let nueva = null, M = null;
      const AYUDA = { area: "Acerca el mapa y toca las esquinas de una manzana siguiendo el borde de la calle. Al terminarla toca ＋ Otra manzana y sigue con la siguiente. Arrastra un punto para corregirlo; toca el ＋ blanco para meter un punto entre dos; toca una manzana ya hecha para editarla.", calle: "Toca a lo largo de cada calle que se trabaja (inicio, curvas y final). Para pasar a otra calle toca ＋ Otra calle.", ref: "Toca donde está la referencia (una casa, una tienda…). Tócala otra vez para quitarla." };
      mapaTerritorio(bg.querySelector("#tMap"), d, ed, (a, r, c, m) => { const i = bg.querySelector("#tMapInfo"); if (!i) return; const nm = a.filter(x => x.length >= 3).length; i.textContent = m ? AYUDA[m] + (m === "area" ? ` · Llevas ${nm} manzana${nm === 1 ? "" : "s"}.` : "") : `${nm} manzana${nm === 1 ? "" : "s"} · ${c.filter(x => x.length >= 2).length} calle(s) · ${r.length} referencia(s). Dale Guardar abajo.`; })
        .then(m => { M = m;
          if (!ed) return;
          const q = x => bg.querySelector(x);
          bg.querySelectorAll("[data-mm]").forEach(b => b.onclick = () => { M.modo(b.dataset.mm); q("#tBar").hidden = true; q("#tBar2").hidden = false; q("#tUndo").hidden = b.dataset.mm === "ref"; q("#tClear").hidden = b.dataset.mm === "ref"; q("#tNueva").hidden = b.dataset.mm !== "calle"; q("#tNuevaM").hidden = b.dataset.mm !== "area"; q("#tBorrM").hidden = b.dataset.mm !== "area"; q("#tMap").scrollIntoView({ block: "center", behavior: "smooth" }); });
          q("#tFin").onclick = () => { M.modo(null); q("#tBar").hidden = false; q("#tBar2").hidden = true; };
          q("#tUndo").onclick = () => M.deshacer(); q("#tClear").onclick = () => { if (confirm("¿Borrar lo marcado en este modo?")) M.limpiar(); }; q("#tNueva").onclick = () => { M.nuevaCalle(); toast("Toca el inicio de la otra calle"); }; q("#tNuevaM").onclick = () => { M.nuevaManzana(); toast("Toca la primera esquina de la siguiente manzana"); }; q("#tBorrM").onclick = () => M.borrarManzana();
          q("#tYo").onclick = () => { if (!navigator.geolocation) { toast("Tu teléfono no comparte ubicación"); return; } toast("Buscando tu ubicación…"); navigator.geolocation.getCurrentPosition(pp => M.ir([pp.coords.latitude, pp.coords.longitude], 19), () => toast("Activa la ubicación para la app"), { enableHighAccuracy: true, timeout: 12000 }); };
          q("#tIrB").onclick = () => { const c = coordsDeTexto(val(bg, "tIr")); if (!c) { toast("No encontré coordenadas. En Google Maps deja el dedo sobre el sitio y copia los números."); return; } M.ir(c, 18); };
        }).catch(e => { bg.querySelector("#tMap").innerHTML = `<div class="note" style="padding:20px">${esc(e.message)}</div>`; });
      const verImg = () => { const im = bg.querySelector("#tImg"); if (im) im.onclick = () => visor(im.src); };
      verImg();
      if (!ed) return;
      bg.querySelector("#tFile").onchange = async e => {
        const f = e.target.files[0]; if (!f) return;
        try { nueva = await comprimir(f); bg.querySelector("#tImgBox").innerHTML = `<img src="${nueva}" alt="" id="tImg">`; verImg(); toast("Imagen lista, dale Guardar"); } catch (er) { toast("No se pudo leer la imagen"); }
      };
      bg.querySelector("#tOk").onclick = async () => {
        const md = M ? M.datos() : { area: d.area || [], manzanas: d.manzanas, refs: d.refs || [], calles: d.calles || [], centro: d.centro || null };
        const nd = { numero: val(bg, "tN"), lamina: val(bg, "tL"), nombre: val(bg, "tB"), mapa: val(bg, "tM"), notas: val(bg, "tO"), area: md.area, manzanas: md.manzanas || (md.area && md.area.length ? [md.area] : []), refs: md.refs, calles: md.calles || [], centro: md.centro };
        if (!nd.nombre) { toast("Escribe el nombre"); return; }
        const tid = await cGuardar("territorio", nd.numero, t ? t.id : null, nd, t ? null : `Nuevo territorio: ${nd.numero} ${nd.nombre}`);
        if (nueva) { const id = t ? t.id : tid; const ya = CG.imgIds[id];
          try { await rpc("cong_reg_guardar", { p_modulo: "terr_img", p_clave: id, p_id: ya || null, p_d: { img: nueva }, p_aviso: `Imagen del territorio ${nd.numero} ${nd.nombre} actualizada` }); CG.imgs[id] = nueva; } catch (er) { toast(er.message); return; } }
        close(); toast("Territorio guardado");
      };
      const del = bg.querySelector("#tDel"); if (del) del.onclick = async () => { await cBorrar(t.id, `Se borró el territorio ${d.nombre}`); close(); };
    });
}
async function cargarImgs() {
  try { const d = await rpc("cong_data", { p_modulos: ["terr_img"] }); (d.reg || []).forEach(r => { CG.imgs[r.k] = r.d.img; CG.imgIds[r.k] = r.id; }); } catch (e) {}
  CG.imgsOk = true;
}
function comprimir(file, max = 1600, q = 0.75) {
  return new Promise((ok, mal) => { const r = new FileReader(); r.onerror = mal; r.onload = () => { const im = new Image(); im.onerror = mal; im.onload = () => {
    const k = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
    c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL("image/jpeg", q)); }; im.src = r.result; }; r.readAsDataURL(file); });
}
function visor(src) {
  const v = document.createElement("div"); v.className = "visor"; v.innerHTML = `<button class="x" aria-label="Cerrar">✕</button><div class="vz"><img src="${src}" alt=""></div><div class="vt">Toca la imagen para acercar</div>`;
  document.body.appendChild(v); const z = v.querySelector(".vz");
  z.querySelector("img").onclick = () => z.classList.toggle("zoom");
  v.querySelector(".x").onclick = () => v.remove();
}
async function xlsTerritorios(X) {
  const wb = new X.Workbook();
  const ts = R("territorio").sort((a, b) => (+a.d.numero || 0) - (+b.d.numero || 0));
  const vis = R("terr_visita");
  // Resumen general
  const ws = wb.addWorksheet("Resumen", { views: [{ showGridLines: false }] });
  ws.columns = [{ width: 8 }, { width: 10 }, { width: 28 }, { width: 14 }, { width: 14 }, { width: 40 }];
  ws.mergeCells("A1:F1"); celda(ws, "A1", "REGISTRO DE TERRITORIOS · CONGREGACIÓN TIERRA BAJA", { bold: true, size: 13, align: "center", border: false });
  ["N.º", "Lámina", "Territorio", "Última vez", "Veces en el año", "Mapa"].forEach((t, i) => celda(ws, String.fromCharCode(65 + i) + "3", t, { bold: true, fill: "DDE3F5", align: "center" }));
  const anio = HOY.slice(0, 4); let r = 4;
  ts.forEach(t => { const vs = vis.filter(v => v.d.territorio === t.id).map(v => v.k).sort(); const u = vs[vs.length - 1];
    celda(ws, "A" + r, t.d.numero, { align: "center" }); celda(ws, "B" + r, t.d.lamina, { align: "center" }); celda(ws, "C" + r, t.d.nombre); celda(ws, "D" + r, u ? corto(u) + " " + u.slice(0, 4) : "Sin registro", { align: "center", fill: !u || dias(u, HOY) > 120 ? "FDECEB" : undefined });
    celda(ws, "E" + r, vs.filter(v => v.startsWith(anio)).length, { align: "center" }); const c = celda(ws, "F" + r, t.d.mapa ? { text: "Abrir mapa", hyperlink: t.d.mapa } : "", { color: "1F4FD1" }); r++; });
  hojaImprimible(ws, true);
  // Tarjetas por lámina (una hoja por lámina, tipo S-13)
  const laminas = [...new Set(ts.map(t => t.d.lamina || "Sin lámina"))];
  for (const l of laminas) {
    const w = wb.addWorksheet(("Lámina " + l).slice(0, 30), { views: [{ showGridLines: false }] });
    w.columns = [{ width: 22 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }];
    w.mergeCells("A1:E1"); celda(w, "A1", `LÁMINA ${l} · REGISTRO DE ASIGNACIÓN`, { bold: true, size: 13, align: "center", border: false });
    let rr = 3;
    ts.filter(t => (t.d.lamina || "Sin lámina") === l).forEach(t => {
      w.mergeCells(`A${rr}:E${rr}`); celda(w, "A" + rr, `Territorio ${t.d.numero} · ${t.d.nombre}`, { bold: true, fill: "FFE24D" }); rr++;
      ["Fecha", "Capitán", "", "", ""].forEach((x, i) => celda(w, String.fromCharCode(65 + i) + rr, x, { bold: true, fill: "EEEEEE" })); rr++;
      const vs = vis.filter(v => v.d.territorio === t.id).sort((a, b) => a.k < b.k ? -1 : 1);
      for (let i = 0; i < Math.max(4, vs.length); i++) { const v = vs[i]; celda(w, "A" + rr, v ? corto(v.k) + " " + v.k.slice(0, 4) : ""); celda(w, "B" + rr, v ? nom(v.d.capitan) : ""); ["C", "D", "E"].forEach(c => celda(w, c + rr, "")); rr++; }
      rr++;
    });
    hojaImprimible(w, false);
  }
  await descargar(wb, "Territorios.xlsx");
}

/* ================= REUNIONES ================= */
function vReu() { return CG.tab === "acomod" ? vAcomod() : CG.tab === "asist" ? vAsist() : CG.tab === "rot" ? vRot() : vVmc(); }

/* ================= ROTACIÓN: cómo van repartidas las asignaciones ================= */
let ROT = "est", ROT_VOLVER = "vmc";
function abrirRot(desde, tipo) { ROT_VOLVER = desde; if (tipo) ROT = tipo; CG.tab = "rot"; vRot(); }
const ROT_TIPOS = { est: "Estudiantes", nomb: "Partes y oraciones", acom: "Acomodadores y audio" };
// Todas las asignaciones como { id, f (fecha), tipo, que }
function todasAsign() {
  const out = []; const add = (id, f, tipo, que) => { if (id) out.push({ id, f, tipo, que }); };
  R("vmc").forEach(r => { const d = r.d; if (!d || !d.t1 || sinReunion(d)) return; const f = sumDias(r.k, 3);
    add(d.lect.p, f, "est", "Lectura de la Biblia"); add(d.lect.a, f, "est", "Lectura (sala aux.)");
    (d.maestros || []).forEach((m, i) => { const t = `Parte ${4 + i}`; add(m.p, f, "est", t); add(m.a, f, "est", t + " (sala aux.)"); add(m.pa, f, "est", "Ayudante"); add(m.aa, f, "est", "Ayudante (sala aux.)"); });
    add(d.intro, f, "nomb", "Presidente"); add(d.oracion1, f, "nomb", "Oración inicial"); add(d.t1.p, f, "nomb", "Discurso de Tesoros"); add(d.t2.p, f, "nomb", "Perlas escondidas"); add(d.consejero, f, "nomb", "Consejero sala aux.");
    (d.vida || []).forEach(v => { if (!v.video) add(v.p, f, "nomb", "Nuestra vida cristiana"); });
    if (d.evento !== "Visita del superintendente de circuito") { add(d.estudio && d.estudio.p, f, "nomb", "Estudio bíblico"); add(d.estudio && d.estudio.lector, f, "nomb", "Lector del estudio"); } add(d.oracion2, f, "nomb", "Oración final"); });
  R("acomod").forEach(r => { const d = r.d || {}, f = r.k.slice(0, 10);
    add(d.presidente, f, "acom", "Presidente"); add(d.lector, f, "acom", "Lector"); add(d.acomodador, f, "acom", "Acomodador"); (d.microfonos || []).forEach(x => add(x, f, "acom", "Micrófonos")); add(d.plataforma, f, "acom", "Plataforma"); });
  return out;
}
function vRot() {
  const todas = todasAsign().filter(a => a.tipo === ROT), hoy = HOY, desde = sumDias(hoy, -182), d90 = sumDias(hoy, -91);
  const elegibles = CG.personas.filter(p => ROT === "est" ? true : p.sexo === "H").filter(p => ROT !== "nomb" || p.privilegio !== "no_bautizado");
  const fila = p => { const mias = todas.filter(a => a.id === p.id).sort((a, b) => a.f < b.f ? -1 : 1); const pas = mias.filter(a => a.f <= hoy), fut = mias.filter(a => a.f > hoy);
    return { p, ult: pas[pas.length - 1], prox: fut[0], n6: mias.filter(a => a.f >= desde).length }; };
  const filas = elegibles.map(fila);
  const conAlgo = filas.filter(x => (x.ult && x.ult.f >= d90) || x.prox).length;
  const primero = todas.map(a => a.f).sort()[0];
  const espera = filas.filter(x => !x.prox).sort((a, b) => (a.ult ? a.ult.f : "") < (b.ult ? b.ult.f : "") ? -1 : (a.ult ? a.ult.f : "") > (b.ult ? b.ult.f : "") ? 1 : a.p.nombre.localeCompare(b.p.nombre));
  const filaHtml = x => `<div class="pend"><span><b>${esc(x.p.nombre)}</b><small>${x.ult ? `Última: ${esc(x.ult.que)} · ${corto(x.ult.f)} (${hace(x.ult.f, hoy)})` : "Sin asignación registrada"}</small></span><span class="pill ${!x.ult ? "t-bad" : dias(x.ult.f, hoy) > 90 ? "t-warn" : "t-ok"}">${x.ult ? hace(x.ult.f, hoy).replace("hace ", "") : "nunca"}</span></div>`;
  const prox = filas.filter(x => x.prox).sort((a, b) => a.prox.f < b.prox.f ? -1 : 1);
  const top = filas.filter(x => x.n6).sort((a, b) => b.n6 - a.n6).slice(0, 10);
  let h = `<button class="btn line" id="rotVolver" style="width:100%;margin-bottom:12px">‹ Volver a Reuniones</button><div class="label" style="margin-top:0">📊 Rotación de asignaciones</div><div class="roles ctabs" style="margin-bottom:10px">${Object.entries(ROT_TIPOS).map(([k, t]) => `<button class="chipo ${ROT === k ? "" : "off"}" data-rot="${k}">${t}</button>`).join("")}</div>
    <div class="kpis" style="grid-template-columns:1fr 1fr 1fr"><div class="kpi"><span class="n">${elegibles.length}</span><span class="l">${ROT === "est" ? "Publicadores" : "Hermanos"}</span></div><div class="kpi"><span class="n">${conAlgo}</span><span class="l">Con asignación (3 meses)</span></div><div class="kpi"><span class="n">${elegibles.length - conAlgo}</span><span class="l">Sin asignación</span></div></div>
    <p class="note" style="margin:6px 4px 12px">${ROT === "est" ? "Lectura de la Biblia y partes de Seamos mejores maestros (titular y ayudante)." : ROT === "nomb" ? "Presidente, oraciones, discursos, perlas, consejero, Nuestra vida cristiana, estudio y lector. Solo hermanos bautizados." : "Presidente y lector del fin de semana, acomodadores, micrófonos y plataforma."} ${primero ? `Cuenta desde ${corto(primero)}, que es lo que hay cargado en la app.` : "Todavía no hay asignaciones cargadas."}</p>
    <details class="plg" open><summary>⏳ Llevan más tiempo sin asignación <span class="pill t-warn">${elegibles.length - conAlgo}</span></summary><div class="card spad" style="margin-top:8px">${espera.slice(0, 15).map(filaHtml).join("") || `<p class="note">Todos tienen algo programado 🙌</p>`}
      ${espera.length > 15 ? `<details class="mas"><summary>Ver los otros ${espera.length - 15}</summary>${espera.slice(15).map(filaHtml).join("")}</details>` : ""}</div></details>
    <details class="plg"><summary>📅 Ya tienen asignación próxima <span class="pill t-ok">${prox.length}</span></summary><div class="card spad" style="margin-top:8px">${prox.map(x => `<div class="pend"><span><b>${esc(x.p.nombre)}</b><small>${esc(x.prox.que)}</small></span><span class="pill t-ok">${corto(x.prox.f)}</span></div>`).join("") || `<p class="note">Nada programado todavía.</p>`}</div></details>
    <details class="plg"><summary>🔁 Los que más asignaciones han tenido (6 meses)</summary><div class="card spad" style="margin-top:8px">${top.length ? barras(top.map(x => ({ l: esc(nomCorto(x.p.id)), v: x.n6 }))) : `<p class="note">Sin datos todavía.</p>`}</div></details>`;
  $("#cview").innerHTML = h; window.scrollTo(0, 0);
  $("#rotVolver").onclick = () => { CG.tab = ROT_VOLVER; cRender(); };
  document.querySelectorAll("[data-rot]").forEach(b => b.onclick = () => { ROT = b.dataset.rot; vRot(); });
}

/* ================= ASISTENCIA a las reuniones ================= */
const asistDe = (f, tipo) => R("asist").find(r => r.k === f + "|" + tipo);
const totalAsist = r => (+r.d.sala || 0) + (+r.d.zoom || 0);
// Fechas en que hubo (o habrá) reunión en el mes: jueves para entre semana, sábado para fin de semana
function reunionesMes(mes, tipo) {
  const out = []; const [y, m] = mes.split("-").map(Number); const ult = new Date(y, m, 0).getDate();
  for (let dd = 1; dd <= ult; dd++) {
    const f = `${mes}-${String(dd).padStart(2, "0")}`; const dw = new Date(y, m - 1, dd).getDay();
    if (tipo === "entre" ? dw !== 4 : dw !== 6) continue;
    const lun = lunesDe(f); const v = R("vmc").find(x => x.k === lun);
    if (v && sinReunion(v.d)) continue;
    if (R("evento").some(e => f >= e.k && f <= (e.d.hasta || e.k) && /asamblea|conmemoraci/i.test(e.d.titulo || e.d.nombre || ""))) continue;
    out.push(f);
  }
  return out;
}
function resumenAsist(mes) {
  const r = {};
  for (const t of ["entre", "tb16", "tb18"]) { const l = R("asist").filter(x => x.d.reunion === t && x.k.startsWith(mes)); const tot = l.reduce((s, x) => s + totalAsist(x), 0); r[t] = { n: l.length, tot, prom: l.length ? Math.round(tot / l.length) : 0 }; }
  const fines = {}; R("asist").filter(x => x.d.reunion !== "entre" && x.k.startsWith(mes)).forEach(x => { const f = x.k.split("|")[0]; fines[f] = (fines[f] || 0) + totalAsist(x); });
  const nf = Object.keys(fines).length, tf = Object.values(fines).reduce((a, b) => a + b, 0);
  r.fin = { n: nf, tot: tf, prom: nf ? Math.round(tf / nf) : 0 };
  return r;
}
function vAsist() {
  const ms = mesSelector(vAsist); const rs = resumenAsist(CG.mes);
  let h = tabs(SEC.reu.tabs) + ms.html + `<div class="kpis" style="grid-template-columns:1fr 1fr"><div class="kpi"><span class="n">${rs.entre.prom || "—"}</span><span class="l">Promedio entre semana</span></div><div class="kpi"><span class="n">${rs.fin.prom || "—"}</span><span class="l">Promedio fin de semana</span></div></div>`;
  for (const t of ["entre", "tb16", "tb18"]) {
    const fechas = [...new Set([...reunionesMes(CG.mes, t), ...R("asist").filter(x => x.d.reunion === t && x.k.startsWith(CG.mes)).map(x => x.k.split("|")[0])])].sort();
    h += `<div class="label">${REU[t]}${rs[t].n ? ` · promedio ${rs[t].prom}` : ""}</div><div class="card" style="padding:4px 14px">${fechas.map(f => { const r = asistDe(f, t); const fut = f > HOY;
      return `<button class="asr ${r ? "" : fut ? "fut" : "falta"}" data-af="${f}" data-at="${t}"><span><b>${DIAS[((new Date(f + "T12:00").getDay() + 6) % 7) + 1]} ${corto(f)}</b>${r ? `<small>${+r.d.sala || 0} en el salón · ${+r.d.zoom || 0} por videoconferencia</small>` : `<small>${fut ? "Próxima" : "Sin registrar"}</small>`}</span><b class="asn">${r ? totalAsist(r) : fut ? "" : "+"}</b></button>`; }).join("") || `<p class="note">No hay reuniones este mes.</p>`}</div>`;
  }
  h += `<p class="note" style="margin:10px 4px">Toca una reunión para anotar cuántos asistieron. El promedio del fin de semana suma las dos reuniones del sábado. Sirve para el informe a la sucursal.</p>`;
  $("#cview").innerHTML = h; ms.bind(); bindTabs();
  document.querySelectorAll("[data-af]").forEach(b => b.onclick = () => fichaAsist(b.dataset.af, b.dataset.at));
}
function fichaAsist(f, t) {
  if (!cAdmin()) { toast("Solo los administradores pueden anotar la asistencia"); return; }
  const r = asistDe(f, t); const d = r ? r.d : { reunion: t, sala: "", zoom: "" };
  hoja(`<div class="shead"><h2>Asistencia</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
    <p class="note" style="margin:0 2px 12px"><b>${REU[t]}</b> · ${DIAS[((new Date(f + "T12:00").getDay() + 6) % 7) + 1]} ${corto(f)}</p>
    <div class="grid2">${campo("En el salón", inp("asS", d.sala, "0", 'type="number" inputmode="numeric" min="0"'))}${campo("Por videoconferencia", inp("asZ", d.zoom, "0", 'type="number" inputmode="numeric" min="0"'))}</div>
    <div class="aviso" style="margin:4px 0 12px">Total: <b id="asT">${(+d.sala || 0) + (+d.zoom || 0)}</b></div>
    <button class="btn pri" id="asOk">Guardar</button>${r ? `<button class="btn bad" id="asDel">Borrar</button>` : ""}`, (bg, close) => {
    const tot = () => bg.querySelector("#asT").textContent = (+val(bg, "asS") || 0) + (+val(bg, "asZ") || 0);
    bg.querySelector("#asS").oninput = tot; bg.querySelector("#asZ").oninput = tot; setTimeout(() => bg.querySelector("#asS").focus(), 200);
    bg.querySelector("#asOk").onclick = async () => { const nd = { reunion: t, sala: Math.max(0, +val(bg, "asS") || 0), zoom: Math.max(0, +val(bg, "asZ") || 0) };
      if (!nd.sala && !nd.zoom) { toast("Escribe cuántos asistieron"); return; }
      await cGuardar("asist", f + "|" + t, r ? r.id : null, nd); close(); toast("Asistencia guardada"); };
    const del = bg.querySelector("#asDel"); if (del) del.onclick = async () => { await cBorrar(r.id); close(); };
  });
}
const VMC_BASE = () => ({ evento: "", eventoTema: "", lectura: "", c1: "", oracion1: "", intro: "", t1: { titulo: "", min: "10", p: "" }, t2: { titulo: "Busquemos perlas escondidas", min: "10", p: "" }, lect: { cita: "", p: "", a: "" }, consejero: "", maestros: [{ titulo: "", min: "", ref: "", p: "", pa: "", a: "", aa: "" }, { titulo: "", min: "", ref: "", p: "", pa: "", a: "", aa: "" }, { titulo: "", min: "", ref: "", p: "", pa: "", a: "", aa: "" }], c2: "", vida: [{ titulo: "", min: "15", p: "" }], estudio: { p: "", lector: "", ref: "" }, c3: "", oracion2: "" });
const EVENTOS_VMC = ["Asamblea regional", "Asamblea de circuito", "Visita del superintendente de circuito", "Conmemoración", "Otro (sin reunión)"];
const sinReunion = d => d && d.evento && d.evento !== "Visita del superintendente de circuito";
function semanasMes(ym) { const out = []; let l = lunesDe(ym + "-01"); if (l.slice(0, 7) < ym) l = sumDias(l, 7); while (l.slice(0, 7) === ym) { out.push(l); l = sumDias(l, 7); } return out; }
const tituloSemana = l => { const fin = sumDias(l, 6); const a = fd(l), b = fd(fin); return a.m === b.m ? `${a.d}-${b.d} de ${b.m}` : `${a.d} de ${a.m} - ${b.d} de ${b.m}`; };
const asignVmc = d => d && d.t1 ? [d.oracion1, d.intro, d.t1.p, d.t2.p, d.lect.p, d.lect.a, d.consejero, ...d.maestros.flatMap(m => [m.p, m.pa, m.a, m.aa]), ...d.vida.map(v => v.p), d.estudio.p, d.estudio.lector, d.oracion2].filter(Boolean) : [];
// Última vez que cada hermano tuvo una asignación en Vida y Ministerio (para repartir parejo)
function ultimasVmc(antesDe) { const u = {}; R("vmc").filter(r => r.k < antesDe).sort((a, b) => a.k < b.k ? -1 : 1).forEach(r => asignVmc(r.d).forEach(id => u[id] = r.k)); return u; }
function hace(k, l) { if (!k) return "nunca"; const s = Math.round(dias(k, l) / 7); return s <= 0 ? "esta semana" : s === 1 ? "hace 1 sem" : `hace ${s} sem`; }
function selSug(id, v, sug, soloH, ult, l) {
  const act = CG.personas;
  const op = p => `<option value="${p.id}" ${v === p.id ? "selected" : ""}>${esc(p.nombre)}${ult && ult[p.id] ? " · " + hace(ult[p.id], l) : ""}</option>`;
  const s = act.filter(p => (!soloH || p.sexo === "H") && sug && sug(p));
  const resto = act.filter(p => !s.includes(p));
  const Hs = resto.filter(p => p.sexo === "H"), Ms = soloH ? [] : resto.filter(p => p.sexo === "M");
  const fuera = v && !act.find(p => p.id === v) ? `<option value="${esc(v)}" selected>${esc(nom(v))}</option>` : "";
  const fueraM = soloH && v && P(v) && P(v).sexo === "M" ? `<option value="${v}" selected>${esc(P(v).nombre)}</option>` : "";
  return `<select id="${id}" class="csel">${`<option value="">— Sin asignar —</option>`}${fuera}${fueraM}${s.length ? `<optgroup label="Sugeridos">${s.map(op).join("")}</optgroup>` : ""}${Hs.length ? `<optgroup label="Hermanos">${Hs.map(op).join("")}</optgroup>` : ""}${Ms.length ? `<optgroup label="Hermanas">${Ms.map(op).join("")}</optgroup>` : ""}</select>`;
}
async function traerJW(l) {
  const r = await fetch(`/api/jw?fecha=${l}`); const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "JW no respondió");
  return j;
}
function aplicarJW(d, j) {
  const tes = j.partes.filter(p => p.sec === "tesoros"), mae = j.partes.filter(p => p.sec === "maestros"), vid = j.partes.filter(p => p.sec === "vida");
  d.lectura = j.lectura || d.lectura; d.c1 = j.c1 || d.c1; d.c2 = j.c2 || d.c2; d.c3 = j.c3 || d.c3;
  if (tes[0]) { d.t1.titulo = tes[0].titulo; d.t1.min = tes[0].min || "10"; }
  if (tes[1]) { d.t2.titulo = tes[1].titulo; d.t2.min = tes[1].min || "10"; }
  if (tes[2]) d.lect.cita = tes[2].ref;
  d.maestros = mae.map((p, i) => ({ ...(d.maestros[i] || { p: "", pa: "", a: "", aa: "" }), titulo: p.titulo, min: p.min, ref: p.ref }));
  const est = vid.find(p => /Estudio b[ií]blico/i.test(p.titulo)); const otras = vid.filter(p => p !== est);
  d.vida = otras.map((p, i) => { const vid = /Cuerpo Gobernante|video/i.test(p.titulo); const o = { ...(d.vida[i] || { p: "" }), titulo: p.titulo, min: p.min || "15", video: vid || !!(d.vida[i] || {}).video }; if (o.video) o.p = ""; return o; });
  if (est) d.estudio.ref = est.ref;
  d.jw = j.fuente; return d;
}
function vVmc() {
  const ms = mesSelector(vVmc);
  let h = tabs(SEC.reu.tabs) + ms.html + `<div class="list">`;
  for (const l of semanasMes(CG.mes)) {
    const r = R("vmc").find(x => x.k === l); const d = r ? r.d : null;
    const n = asignVmc(d).length;
    const est = !d ? ["Vacío", "t-idle"] : sinReunion(d) ? ["Sin reunión", "t-warn"] : n >= 15 ? ["Completo", "t-ok"] : n ? [`${n} asignados`, "t-info"] : ["Falta asignar", "t-bad"];
    h += `<button class="card trow" data-sem="${l}"><span class="dpill" style="background:${sinReunion(d) ? "var(--warn-soft);color:var(--warn)" : "var(--accent-soft);color:var(--accent)"}">${fd(l).d}–${fd(sumDias(l, 6)).d}</span><div style="flex:1;min-width:0;text-align:left"><b>Semana ${tituloSemana(l)}</b><div class="note">${d ? (sinReunion(d) ? esc(d.evento + (d.eventoTema ? " · " + d.eventoTema : "")) + " · no hay reunión" : esc(d.lectura || "Sin lectura") + (d.t1.titulo ? " · " + esc(d.t1.titulo) : "")) : "Sin programa"}</div></div><span class="pill ${est[1]}">${est[0]}</span></button>`;
  }
  h += `</div><div class="row" style="margin-top:12px">${cAdmin() ? `<button class="btn line" id="jwMes">⬇ Traer el mes de JW</button>` : ""}<button class="btn line" id="pdfVmc">📤 Compartir el mes</button><button class="btn line" id="rotVmc">📊 Rotación de asignaciones</button>${cAdmin() ? `<button class="btn line" id="s89Mes">📄 Papeletas S-89 del mes</button>` : ""}</div>`;
  $("#cview").innerHTML = h; ms.bind(); bindTabs();
  document.querySelectorAll("[data-sem]").forEach(b => b.onclick = () => fichaVmc(b.dataset.sem));
  $("#rotVmc").onclick = () => abrirRot("vmc");
  $("#pdfVmc").onclick = () => elegirFormato(`Vida y Ministerio · ${mesNombre(CG.mes)}`, f => pdfVmc(semanasMes(CG.mes).map(l => { const r = R("vmc").find(x => x.k === l); return [l, r && r.d]; }), `Vida y Ministerio ${mesNombre(CG.mes)}`, null, f));
  if ($("#s89Mes")) $("#s89Mes").onclick = () => elegirFormato("Papeletas S-89 del mes", f => exportarS89(semanasMes(CG.mes).flatMap(l => { const r = R("vmc").find(x => x.k === l); return papeletas(r && r.d, l); }), `Papeletas S-89 ${mesNombre(CG.mes)}`, f));
  if ($("#jwMes")) $("#jwMes").onclick = async () => {
    const b = $("#jwMes"); b.disabled = true; let ok = 0, falla = [];
    for (const l of semanasMes(CG.mes)) {
      const r = R("vmc").find(x => x.k === l); if (r && sinReunion(r.d)) continue;
      b.textContent = `Trayendo ${corto(l)}…`;
      try { const j = await traerJW(l); const d = aplicarJW(r ? JSON.parse(JSON.stringify(r.d)) : VMC_BASE(), j);
        await rpc("cong_reg_guardar", { p_modulo: "vmc", p_clave: l, p_id: r ? r.id : null, p_d: d, p_aviso: ok ? null : `Vida y Ministerio: se trajo de JW el programa de ${mesNombre(CG.mes)}` }); ok++; } catch (e) { falla.push(corto(l)); }
    }
    await cCargar(); vVmc(); toast(falla.length ? `Listo ${ok}. No publicadas aún: ${falla.join(", ")}` : `Listo: ${ok} semanas cargadas desde JW`);
  };
}
function fichaVmc(l) {
  const r = R("vmc").find(x => x.k === l); let d = r ? JSON.parse(JSON.stringify(r.d)) : VMC_BASE();
  d = { ...VMC_BASE(), ...d }; d.maestros = d.maestros.map(m => ({ ref: "", ...m })); d.estudio = { ref: "", ...d.estudio };
  const ed = cAdmin(); const ult = ultimasVmc(l);
  const S = (id, v, sug, soloH) => selSug(id, v, sug, soloH, ult, l);
  const nomb = p => p.privilegio === "anciano" || p.privilegio === "siervo";
  const anc = p => p.privilegio === "anciano";
  const H = p => p.sexo === "H";
  const pub = p => p.privilegio !== "no_bautizado";
  const parte = (n, titulo, min, extra) => `<div class="vptit"><span class="vn">${n}.</span> ${titulo}${min ? ` <small>(${min} mins)</small>` : ""}${extra || ""}</div>`;
  const cuerpo = () => {
    const nM = 4 + d.maestros.length;
    const maestro = (m, i) => { const disc = /^Discurso/i.test(m.titulo);
      return `<div class="card vpart"><div class="vptit"><span class="vn" style="color:#A0701B">${4 + i}.</span> <input class="tin" id="mT${i}" value="${esc(m.titulo)}" placeholder="Título de la parte"> <input class="tin min" id="mM${i}" value="${esc(m.min)}" placeholder="min" inputmode="numeric"> <input class="tin ref" id="mR${i}" value="${esc(m.ref)}" placeholder="(lmd 2/4)"></div>
      <div class="vsala"><span>S. Princ.</span>${S("mP" + i, m.p, disc ? H : pub, disc)}${disc ? "" : `<span>Ayudante</span>${S("mPA" + i, m.pa, pub)}`}</div>
      <div class="vsala"><span>S. Aux.</span>${S("mA" + i, m.a, disc ? H : pub, disc)}${disc ? "" : `<span>Ayudante</span>${S("mAA" + i, m.aa, pub)}`}</div></div>`; };
    return `
    <div class="vhead"><span>🎵 Canción</span><input class="tin min" id="vC1" value="${esc(d.c1)}" inputmode="numeric"><span>y oración</span>${S("vO1", d.oracion1, nomb, true)}</div>
    <div class="vhead"><span>Presidente · Palabras de introd. (1 min)</span>${S("vI", d.intro, anc, true)}</div>
    <div class="vsec" style="background:#067876">TESOROS DE LA BIBLIA</div>
    <div class="card vpart"><div class="vptit"><span class="vn" style="color:#067876">1.</span> <input class="tin" id="vT1" value="${esc(d.t1.titulo)}" placeholder="Título del discurso"> <small>(10 mins)</small></div>${S("vT1p", d.t1.p, nomb, true)}</div>
    <div class="card vpart">${parte('<span style="color:#067876">2</span>', "Busquemos perlas escondidas", "10")}${S("vT2p", d.t2.p, nomb, true)}</div>
    <div class="card vpart"><div class="vptit"><span class="vn" style="color:#067876">3.</span> Lectura de la Biblia <small>(4 mins)</small>: <input class="tin" id="vLc" value="${esc(d.lect.cita)}" placeholder="Lam 1:8-18 (th 10)"></div>
      <div class="vsala"><span>S. Princ.</span>${S("vLp", d.lect.p, p => H(p) && !nomb(p), true)}</div><div class="vsala"><span>S. Aux.</span>${S("vLa", d.lect.a, p => H(p) && !nomb(p), true)}</div><div class="vsala vcons"><span>Consejero sala aux.</span>${S("vCo", d.consejero, anc, true)}</div></div>
    <div class="vsec" style="background:#A0701B">SEAMOS MEJORES MAESTROS</div>
    <div id="vMae">${d.maestros.map(maestro).join("")}</div>
    ${ed ? `<div class="row"><button class="btn line" id="vMas">+ Parte</button><button class="btn line" id="vMenos">− Parte</button></div>` : ""}
    <div class="vsec" style="background:#8A0B14">NUESTRA VIDA CRISTIANA</div>
    <div class="vhead"><span>🎵 Canción</span><input class="tin min" id="vC2" value="${esc(d.c2)}" inputmode="numeric"></div>
    <div id="vVida">${d.vida.map((v, i) => `<div class="card vpart"><div class="vptit"><span class="vn" style="color:#8A0B14">${nM + i}.</span> <input class="tin" id="vV${i}" value="${esc(v.titulo)}" placeholder="Título"> <input class="tin min" id="vVm${i}" value="${esc(v.min || "15")}" inputmode="numeric"></div><label class="ic chk vvid"><input type="checkbox" id="vVv${i}" ${v.video ? "checked" : ""}> Sin asignado (video o informe del Cuerpo Gobernante)</label><div id="vVw${i}" ${v.video ? "hidden" : ""}>${S("vVp" + i, v.p, nomb, true)}</div><div id="vVx${i}" ${v.video ? "" : "hidden"}><input class="tin" id="vVt${i}" value="${esc(v.texto || "")}" placeholder="Texto del recuadro (ej.: Informe del Cuerpo Gobernante)" style="width:100%"><small class="note">Si lo dejas vacío sale VIDEO.</small></div></div>`).join("")}</div>
    ${ed ? `<div class="row"><button class="btn line" id="vVMas">+ Parte</button><button class="btn line" id="vVMenos">− Parte</button></div>` : ""}
    <div class="card vpart" id="vEstN" ${d.evento === "Visita del superintendente de circuito" ? "hidden" : ""}>${parte(`<span style="color:#8A0B14">${nM + d.vida.length}</span>`, "Estudio bíblico de la congregación", "30", d.estudio.ref ? ` <small>${esc(d.estudio.ref)}</small>` : "")}<div class="vsala"><span>Conductor</span>${S("vEc", d.estudio.p, anc, true)}</div><div class="vsala"><span>Lector</span>${S("vEl", d.estudio.lector, H, true)}</div></div>
    <div class="card vpart vsup" id="vEstV" ${d.evento === "Visita del superintendente de circuito" ? "" : "hidden"}>${parte(`<span style="color:#8A0B14">${nM + d.vida.length}</span>`, "Discurso de servicio", "30", " <small>(en lugar del estudio bíblico)</small>")}
      <div class="vsala"><span>Lo da</span><input class="tin" id="vSup" value="${esc(d.estudio.sup || "")}" placeholder="Nombre del superintendente de circuito"></div>
      <div class="vsala"><span>Tema</span><input class="tin" id="vSupT" value="${esc(d.estudio.supT || "")}" placeholder="Título del discurso (opcional)"></div></div>
    <div class="vhead" style="color:#8A0B14"><span>Palabras de conclusión · 🎵 Canción</span><input class="tin min" id="vC3" value="${esc(d.c3)}" inputmode="numeric"><span>y oración</span>${S("vO2", d.oracion2, nomb, true)}</div>`;
  };
  hoja(`<div class="shead"><h2>Semana ${tituloSemana(l)}</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
    <div class="picks" id="vTipo"><button class="pk ${sinReunion(d) ? "" : "on"}" data-ev="">Hay reunión</button><button class="pk ${sinReunion(d) ? "on" : ""}" data-ev="1">No hay reunión (asamblea, evento)</button></div>
    <div id="vEv" ${sinReunion(d) ? "" : "hidden"}>
      ${campo("¿Qué hay esa semana?", `<select id="vE" class="csel">${EVENTOS_VMC.filter(x => !x.startsWith("Visita")).map(x => `<option ${d.evento === x ? "selected" : ""}>${x}</option>`).join("")}</select>`)}
      ${campo("Tema (opcional)", inp("vEt", d.eventoTema, "Felices para siempre"))}
      <div class="aviso">${I.alert}<span>Esa semana no se arma programa ni hay asignaciones. En el PDF sale la franja con el evento.</span></div></div>
    ${campo("Lectura semanal de la Biblia", inp("vL", d.lectura, "LAMENTACIONES 3-5"))}
    <div id="vNormal" ${sinReunion(d) ? "hidden" : ""}>
      ${ed ? `<div class="row"><button class="btn line" id="vJW">⬇ Traer programa de JW</button><button class="btn line" id="vSug">✨ Sugerir los vacíos</button><button class="btn line" id="vS89">📄 Papeletas S-89</button></div>` : ""}
      <label class="ic chk" style="margin:4px 0 8px"><input type="checkbox" id="vVisita" ${d.evento === "Visita del superintendente de circuito" ? "checked" : ""}> Visita del superintendente esta semana</label>
      <div id="vCuerpo">${cuerpo()}</div>
    </div>
    <div id="vAviso"></div>
    <button class="btn line" id="vPdf" style="width:100%;margin-bottom:8px">📤 Compartir esta semana (imagen o PDF)</button>
    ${ed ? `<div id="vAuto" class="autos">💾 Se guarda solo mientras haces cambios</div><button class="btn pri" id="vOk">Guardar y cerrar</button>` : `<p class="note">Solo los administradores pueden editar.</p>`}`,
    (bg, close) => {
      const q = s => bg.querySelector(s);
      if (!ed) bg.querySelectorAll("input,select").forEach(x => x.disabled = true);
      let sinR = sinReunion(d);
      const vv = q("#vVisita"); if (vv) vv.addEventListener("change", () => { const n = q("#vEstN"), v = q("#vEstV"); if (n) n.hidden = vv.checked; if (v) v.hidden = !vv.checked; });
      bg.querySelectorAll("[data-ev]").forEach(b => b.onclick = () => { sinR = !!b.dataset.ev; bg.querySelectorAll("[data-ev]").forEach(x => x.classList.toggle("on", x === b)); q("#vEv").hidden = !sinR; q("#vNormal").hidden = sinR; programar(); });
      // ---- Guardado automático: guarda en silencio ~1 s después de cada cambio; el aviso a los hermanos sale una sola vez al cerrar ----
      const orig = r ? JSON.parse(JSON.stringify(r.d)) : null; let rid = r ? r.id : null, ultimo = null, timer = null, huboAuto = false;
      const estado = (t, c) => { const e = q("#vAuto"); if (e) { e.textContent = t; e.className = "autos " + (c || ""); } };
      const autoGuardar = async () => {
        clearTimeout(timer); timer = null; if (!ed) return;
        const nd = leer(), js = JSON.stringify(nd); if (js === ultimo) return;
        if (!rid && !sinR && !nd.lectura && !nd.t1.titulo && !asignVmc(nd).length) return;
        estado("Guardando…", "ing");
        try {
          rid = await rpc("cong_reg_guardar", { p_modulo: "vmc", p_clave: l, p_id: rid, p_d: nd, p_aviso: null }); ultimo = js; huboAuto = true;
          const ex = CG.reg.find(x => x.id === rid); if (ex) ex.d = nd; else CG.reg.push({ id: rid, m: "vmc", k: l, d: nd });
          estado("✓ Guardado automáticamente · " + new Date().toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" }), "ok");
        } catch (e) { estado("⚠ No se pudo guardar solo (" + e.message + "). Toca Guardar y cerrar.", "bad"); }
      };
      function programar() { if (!ed) return; estado("Cambios sin guardar…", ""); clearTimeout(timer); timer = setTimeout(autoGuardar, 1000); }
      if (ed) { bg.addEventListener("input", programar); bg.addEventListener("change", programar);
        bg._alCerrar = () => { const nd = leer(); (async () => { await autoGuardar(); if (huboAuto && rid) { try { await rpc("cong_reg_guardar", { p_modulo: "vmc", p_clave: l, p_id: rid, p_d: nd, p_aviso: avisoDe(nd) }); } catch (e) {} await cCargar(); render(); } })(); }; }
      const leer = () => {
        if (sinR) return { ...d, evento: val(bg, "vE"), eventoTema: val(bg, "vEt"), lectura: val(bg, "vL") };
        const nd = { ...d, evento: q("#vVisita").checked ? "Visita del superintendente de circuito" : "", eventoTema: "", lectura: val(bg, "vL"), c1: val(bg, "vC1"), oracion1: val(bg, "vO1"), intro: val(bg, "vI"), t1: { titulo: val(bg, "vT1"), min: "10", p: val(bg, "vT1p") }, t2: { titulo: "Busquemos perlas escondidas", min: "10", p: val(bg, "vT2p") }, lect: { cita: val(bg, "vLc"), p: val(bg, "vLp"), a: val(bg, "vLa") }, consejero: val(bg, "vCo"), maestros: [], c2: val(bg, "vC2"), vida: [], estudio: { p: val(bg, "vEc"), lector: val(bg, "vEl"), ref: d.estudio.ref || "", sup: val(bg, "vSup"), supT: mayus(val(bg, "vSupT")) }, c3: val(bg, "vC3"), oracion2: val(bg, "vO2") };
        bg.querySelectorAll("#vMae .vpart").forEach((_, i) => nd.maestros.push({ titulo: mayus(val(bg, "mT" + i)), min: val(bg, "mM" + i), ref: val(bg, "mR" + i), p: val(bg, "mP" + i), pa: val(bg, "mPA" + i), a: val(bg, "mA" + i), aa: val(bg, "mAA" + i) }));
        let i = 0; while (q("#vV" + i)) { const vid = q("#vVv" + i).checked; nd.vida.push({ titulo: mayus(val(bg, "vV" + i)), min: val(bg, "vVm" + i) || "15", video: vid, texto: vid ? mayus(val(bg, "vVt" + i)) : "", p: vid ? "" : val(bg, "vVp" + i) }); i++; }
        return nd;
      };
      const repintar = () => { d = leer(); q("#vCuerpo").innerHTML = cuerpo(); enlazar(); programar(); };
      const dupl = () => { const ids = asignVmc(leer()).filter((x, i, a) => true); const c = {}; ids.forEach(x => c[x] = (c[x] || 0) + 1); const rep = Object.keys(c).filter(k => c[k] > 1); q("#vAviso").innerHTML = rep.length && !sinR ? `<div class="aviso warn">${I.alert}<span>Con más de una asignación esta semana: <b>${rep.map(nomCorto).map(esc).join(", ")}</b>.</span></div>` : ""; };
      const enlazar = () => {
        bg.querySelectorAll("#vCuerpo select").forEach(s => s.addEventListener("change", dupl)); dupl();
        bg.querySelectorAll('[id^="vVv"]').forEach(c => c.onchange = () => { const k = c.id.slice(3); const w = q("#vVw" + k); if (w) w.hidden = c.checked; const xx = q("#vVx" + k); if (xx) xx.hidden = !c.checked; if (c.checked) { const sel = q("#vVp" + k); if (sel) sel.value = ""; } dupl(); });
        if (q("#vMas")) q("#vMas").onclick = () => { d = leer(); d.maestros.push({ titulo: "", min: "", ref: "", p: "", pa: "", a: "", aa: "" }); repintar(); };
        if (q("#vMenos")) q("#vMenos").onclick = () => { d = leer(); if (d.maestros.length > 1) d.maestros.pop(); repintar(); };
        if (q("#vVMas")) q("#vVMas").onclick = () => { d = leer(); d.vida.push({ titulo: "", min: "15", p: "" }); repintar(); };
        if (q("#vVMenos")) q("#vVMenos").onclick = () => { d = leer(); if (d.vida.length > 1) d.vida.pop(); repintar(); };
        if (!ed) bg.querySelectorAll("#vCuerpo input,#vCuerpo select").forEach(x => x.disabled = true);
      };
      enlazar();
      if (q("#vJW")) q("#vJW").onclick = async () => { const b = q("#vJW"); b.disabled = true; b.textContent = "Trayendo…";
        try { d = aplicarJW(leer(), await traerJW(l)); q("#vL").value = d.lectura; q("#vCuerpo").innerHTML = cuerpo(); enlazar(); programar(); toast("Programa traído de JW. Revisa y asigna."); }
        catch (e) { toast(e.message); } b.disabled = false; b.textContent = "⬇ Traer programa de JW"; };
      q("#vPdf").onclick = () => { const dd = ed ? leer() : d; elegirFormato(`Semana ${tituloSemana(l)}`, f => pdfVmc([[l, dd]], `Vida y Ministerio semana ${tituloSemana(l)}`, null, f)); };
      if (q("#vS89")) q("#vS89").onclick = () => { const dd = leer(); elegirFormato("Papeletas S-89", f => exportarS89(papeletas(dd, l), `Papeletas S-89 semana ${tituloSemana(l)}`, f)); };
      if (q("#vSug")) q("#vSug").onclick = () => {
        d = leer(); const usados = new Set(asignVmc(d));
        const elegir = (filtro, sexo) => { const c = CG.personas.filter(p => filtro(p) && !usados.has(p.id) && (!sexo || p.sexo === sexo)).sort((a, b) => (ult[a.id] || "") < (ult[b.id] || "") ? -1 : (ult[a.id] || "") > (ult[b.id] || "") ? 1 : a.nombre.localeCompare(b.nombre)); const x = c[0]; if (x) usados.add(x.id); return x ? x.id : ""; };
        const llena = (o, k, f, sx) => { if (!o[k]) o[k] = elegir(f, sx); };
        llena(d, "intro", anc); llena(d, "oracion1", p => nomb(p)); llena(d.t1, "p", nomb); llena(d.t2, "p", nomb);
        llena(d.lect, "p", p => H(p) && !nomb(p)); llena(d.lect, "a", p => H(p) && !nomb(p)); llena(d, "consejero", anc);
        d.maestros.forEach(m => { const disc = /^Discurso/i.test(m.titulo); llena(m, "p", disc ? H : pub); llena(m, "a", disc ? H : pub);
          if (!disc) { const sx = id => (P(id) || {}).sexo; llena(m, "pa", pub, sx(m.p)); llena(m, "aa", pub, sx(m.a)); } });
        d.vida.forEach(v => { if (!v.video) llena(v, "p", nomb); }); llena(d.estudio, "p", anc); llena(d.estudio, "lector", H); llena(d, "oracion2", nomb);
        q("#vCuerpo").innerHTML = cuerpo(); enlazar(); programar(); toast("Sugerí a quienes llevan más tiempo sin parte. Revisa antes de guardar.");
      };
      function avisoDe(nd) {
        let aviso = orig ? null : `Vida y Ministerio: programa de la semana ${tituloSemana(l)} cargado`;
        if (orig && sinR) aviso = `Vida y Ministerio ${tituloSemana(l)}: no hay reunión (${nd.evento})`;
        else if (orig) { const cambios = []; const cmp = (a, b, t) => { if ((a || "") !== (b || "")) cambios.push(`${t}: ${nomCorto(b) || "sin asignar"}`); };
          const o = { ...VMC_BASE(), ...orig };
          cmp(o.intro, nd.intro, "presidente"); cmp(o.oracion1, nd.oracion1, "oración inicial"); cmp(o.t1.p, nd.t1.p, "discurso de Tesoros"); cmp(o.t2.p, nd.t2.p, "perlas escondidas"); cmp(o.lect.p, nd.lect.p, "lectura de la Biblia"); cmp(o.lect.a, nd.lect.a, "lectura sala aux."); cmp(o.consejero, nd.consejero, "consejero aux.");
          nd.maestros.forEach((x, i) => { const y = o.maestros[i] || {}; cmp(y.p, x.p, `parte ${4 + i}`); cmp(y.pa, x.pa, `ayudante parte ${4 + i}`); cmp(y.a, x.a, `parte ${4 + i} sala aux.`); cmp(y.aa, x.aa, `ayudante ${4 + i} sala aux.`); });
          nd.vida.forEach((x, i) => cmp((o.vida[i] || {}).p, x.p, `parte ${4 + nd.maestros.length + i}`));
          cmp(o.estudio.p, nd.estudio.p, "estudio bíblico"); cmp(o.estudio.lector, nd.estudio.lector, "lector"); cmp(o.oracion2, nd.oracion2, "oración final");
          aviso = cambios.length ? `Vida y Ministerio ${tituloSemana(l)} · cambió ${cambios.join("; ")}` : `Vida y Ministerio ${tituloSemana(l)}: programa actualizado`; }
        return aviso;
      }
      const ok = q("#vOk"); if (ok) ok.onclick = async () => {
        clearTimeout(timer); timer = null; const nd = leer();
        await cGuardar("vmc", l, rid, nd, avisoDe(nd)); huboAuto = false; ultimo = JSON.stringify(nd); close(); toast("Semana guardada");
      };
    });
}
/* ================= Papeletas S-89 (asignación de estudiantes) ================= */
function papeletas(d, l) {
  if (!d || !d.t1 || sinReunion(d)) return [];
  const f = sumDias(l, 3), out = [];
  const add = (p, a, n, sala) => { if (p) out.push({ p, a, f, n, sala }); };
  add(d.lect.p, "", 3, 0); add(d.lect.a, "", 3, 1);
  (d.maestros || []).forEach((m, i) => { add(m.p, m.pa, 4 + i, 0); add(m.a, m.aa, 4 + i, 1); });
  return out;
}
const fechaLarga = f => { const [y, m, dd] = f.split("-").map(Number); return `${DIAS[((new Date(y, m - 1, dd).getDay() + 6) % 7) + 1].toLowerCase()} ${dd} de ${MES[m - 1]} de ${y}`; };
async function exportarS89(lst, nombre, formato = "pdf") {
  if (!lst.length) { toast("No hay estudiantes asignados todavía"); return; }
  document.body.classList.add("loading");
  try {
    const L = await cargarPdfLib(); const pdf = await L.PDFDocument.create(); pdf.setTitle(nombre); pdf.setAuthor("CRABS · Congregación Tierra Baja");
    const N = await pdf.embedFont(L.StandardFonts.Helvetica), B = await pdf.embedFont(L.StandardFonts.HelveticaBold);
    const K = L.rgb(0, 0, 0), G = L.rgb(.6, .6, .6), W = 612, H = 792, w = W / 2, h = H / 2; let pg;
    const centro = (t, f, s, x, cw, y) => pg.drawText(t, { x: x + (cw - f.widthOfTextAtSize(t, s)) / 2, y, size: s, font: f, color: K });
    const envolver = (partes, x, y, cw, s, lh) => { let cx = x; for (const [txt, f] of partes) for (const pal of txt.split(" ")) { const t = pal + " "; const tw = f.widthOfTextAtSize(t, s); if (cx + tw > x + cw && cx > x) { cx = x; y -= lh; } pg.drawText(t, { x: cx, y, size: s, font: f, color: K }); cx += tw; } return y; };
    const papeleta = (s, x, top, cw) => {
      let y = top - 14;
      centro("ASIGNACIÓN PARA LA REUNIÓN", B, 11.5, x, cw, y); y -= 15; centro("VIDA Y MINISTERIO CRISTIANOS", B, 11.5, x, cw, y); y -= 34;
      const campo = (lab, v) => { pg.drawText(lab, { x, y, size: 10.5, font: B, color: K }); const lx = x + B.widthOfTextAtSize(lab, 10.5) + 5; pg.drawLine({ start: { x: lx, y: y - 3 }, end: { x: x + cw, y: y - 3 }, thickness: .6, color: K });
        let t = v || "", sz = 11; while (t && N.widthOfTextAtSize(t, sz) > x + cw - lx - 4 && sz > 7) sz -= .5; if (t) pg.drawText(t, { x: lx + 3, y, size: sz, font: N, color: K }); y -= 27; };
      campo("Nombre:", (P(s.p) || {}).nombre); campo("Ayudante:", s.a ? (P(s.a) || {}).nombre : ""); campo("Fecha:", fechaLarga(s.f)); campo("Intervención núm.:", String(s.n));
      y -= 4; pg.drawText("Se presentará en:", { x, y, size: 10.5, font: B, color: K }); y -= 20;
      ["Sala principal", "Sala auxiliar 1", "Sala auxiliar 2"].forEach((t, i) => { const bs = 9; pg.drawRectangle({ x: x + 6, y: y - 1, width: bs, height: bs, borderColor: K, borderWidth: .8 });
        if (s.sala === i) pg.drawSvgPath(`M ${bs * .18} ${bs * .52} L ${bs * .42} ${bs * .78} L ${bs * .86} ${bs * .16}`, { x: x + 6, y: y - 1 + bs, borderColor: K, borderWidth: bs * .16 });
        pg.drawText(t, { x: x + 22, y, size: 10.5, font: N, color: K }); y -= 17; });
      y -= 10;
      envolver([["Nota al estudiante:", B], [" En la Guía de actividades encontrará la información que necesita para su intervención. Repase también las indicaciones para las intervenciones que se describen en las Instrucciones para la reunión Vida y Ministerio Cristianos (S-38).", N]], x, y, cw, 8.6, 11);
      pg.drawText("S-89-S   11/23", { x, y: top - h + 46, size: 7, font: N, color: K });
    };
    lst.forEach((s, i) => {
      if (i % 4 === 0) { pg = pdf.addPage([W, H]); const dash = { thickness: .5, color: G, dashArray: [4, 4] };
        pg.drawLine({ start: { x: w, y: 10 }, end: { x: w, y: H - 10 }, ...dash }); pg.drawLine({ start: { x: 10, y: h }, end: { x: W - 10, y: h }, ...dash }); }
      const c = i % 4; papeleta(s, (c % 2) * w + 26, (c < 2 ? H : h) - 24, w - 52);
    });
    const bytes = await pdf.save(); const nom = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "") + ".pdf";
    const blob = formato === "img" ? await pdfAImagenes(bytes, nom.replace(/\.pdf$/, "")) : new Blob([bytes], { type: "application/pdf" });
    await entregar(blob, nom, `${lst.length} papeletas listas`, `${saludoHora()}, hermanos 👋🏽\nLes comparto las hojas de asignación (S-89) para la reunión Vida y Ministerio. Cada uno busque la suya y prepárese con tiempo. ¡Gracias!`);
  } catch (e) { toast(e.message); } finally { document.body.classList.remove("loading"); }
}
/* ================= PDF de Vida y Ministerio (mismo diseño del Excel) ================= */
async function pdfVmc(semanas, titulo, mensaje, formato = "pdf") {
  document.body.classList.add("loading");
  try {
    const L = await cargarPdfLib(); const pdf = await L.PDFDocument.create(); pdf.setTitle(titulo); pdf.setAuthor("CRABS · Congregación Tierra Baja");
    const FN = await pdf.embedFont(L.StandardFonts.Helvetica), FB = await pdf.embedFont(L.StandardFonts.HelveticaBold), FBI = await pdf.embedFont(L.StandardFonts.HelveticaBoldOblique);
    const hex = h => L.rgb(parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255);
    const NEGRO = "000000", VERDE = "2E6E4E", TEAL = "067876", ORO = "A0701B", ROJO = "8A0B14", GRIS = "8C8C8C";
    const una = semanas.length === 1, PW = una ? 841.89 : 595.28, PH = una ? 595.28 : 841.89, M = una ? 30 : 24; let RH = 16.5, FS = 1; const AN = [36, 31, 12, 21, 15, 35], esc_ = (PW - 2 * M) / AN.reduce((a, b) => a + b);
    const X = [M]; AN.forEach(w => X.push(X[X.length - 1] + w * esc_)); const COL = c => "ABCDEF".indexOf(c);
    const seguro = t => String(t ?? "").replace(/[●◦]/g, "•").replace(/[^\x20-\x7E -ÿ•–—‘’“”…€]/g, "");
    const MX = t => String(t || "").toUpperCase(), N = id => MX(nom(id));
    let pg, y, paginas = [];
    const nueva = () => { pg = pdf.addPage([PW, PH]); paginas.push(pg); y = PH - M; };
    const fnt = o => o.italic ? FBI : o.bold === false ? FN : FB;
    // texto de varias partes dentro de las columnas c1..c2, encogido si no cabe
    const rich = (c1, c2, partes, o = {}) => {
      const x0 = X[COL(c1)] + 3, x1 = X[COL(c2) + 1] - 3, ancho = x1 - x0; let k = 1;
      const medir = k => partes.reduce((s, [t, f = {}]) => s + fnt(f).widthOfTextAtSize(seguro(t), (f.size || 10.5) * .86 * FS * k), 0);
      while (medir(k) > ancho && k > .5) k -= .04;
      const tot = medir(k); let x = o.align === "right" ? x1 - tot : o.align === "center" ? x0 + (ancho - tot) / 2 : x0;
      partes.forEach(([t, f = {}]) => { const sz = (f.size || 10.5) * .86 * FS * k, tt = seguro(t); pg.drawText(tt, { x, y: y - RH / 2 - sz * .35, size: sz, font: fnt(f), color: hex(f.color || NEGRO) }); x += fnt(f).widthOfTextAtSize(tt, sz); });
    };
    const put = (c1, c2, t, o = {}) => { if (o.fill) pg.drawRectangle({ x: X[COL(c1)], y: y - RH, width: X[COL(c2) + 1] - X[COL(c1)], height: RH, color: hex(o.fill) }); if (o.box) pg.drawRectangle({ x: X[COL(c1)], y: y - RH, width: X[COL(c2) + 1] - X[COL(c1)], height: RH, borderColor: hex(NEGRO), borderWidth: .5 }); rich(c1, c2, [[t, o]], o); };
    const nombre = (c1, c2, id, o = {}) => put(c1, c2, N(id), { align: "center", box: true, fill: o.fill, color: o.color });
    const barra = (t, fill) => { put("A", "F", t, { align: "center", color: "FFFFFF", fill, size: 11 }); y -= RH; };
    const sala = (l1, p, l2, a, chico) => { put("B", "B", l1, { bold: false, align: "right", size: chico ? 9 : 10.5 }); nombre("C", "D", p); put("E", "E", l2, { bold: false, align: "right", size: chico ? 9 : 10.5 }); nombre("F", "F", a); y -= RH; };
    const linea = () => pg.drawLine({ start: { x: X[0], y: y }, end: { x: X[6], y: y }, thickness: .5, color: hex(NEGRO) });
    const filas = d => !d || sinReunion(d) ? 2 : 13 + d.maestros.reduce((s, m) => s + (m.pa || m.aa ? 3 : 2), 0) + d.vida.length;
    if (una) { const d1 = semanas[0][1] ? { ...VMC_BASE(), ...semanas[0][1] } : null; RH = Math.min(34, (PH - 2 * M - 16) / filas(d1)); FS = Math.min(1.75, RH / 16.5); }
    nueva();
    for (const [l, d0] of semanas) {
      const d = d0 ? { ...VMC_BASE(), ...d0 } : null;
      if (y - filas(d) * RH < M + 20 && y < PH - M - 1) nueva();
      const y0 = y;
      put("A", "C", `SEMANA ${MX(tituloSemana(l))}`, { size: 11 }); put("D", "E", "Lectura semanal de la Biblia:", {}); put("F", "F", MX(d ? d.lectura : ""), { align: "center" }); y -= RH;
      if (!d) barra("PROGRAMA PENDIENTE", "9E9E9E");
      else if (sinReunion(d)) barra(MX(d.evento) + (d.eventoTema ? ` (${MX(d.eventoTema)})` : ""), TEAL);
      else {
        rich("A", "A", [["• ", { color: GRIS }], [`Canción ${d.c1} y oración:`, {}]], { align: "right" }); nombre("B", "B", d.oracion1);
        rich("C", "E", [["• ", { color: GRIS }], ["Palabras de introd. ", {}], ["(1 min)", { size: 9 }], [":", {}]], { align: "right" }); nombre("F", "F", d.intro); y -= RH;
        barra("TESOROS DE LA BIBLIA", TEAL);
        rich("A", "E", [["1. ", { color: TEAL }], [d.t1.titulo, {}], [` (${d.t1.min || 10} mins)`, { size: 9 }]]); nombre("F", "F", d.t1.p); y -= RH;
        rich("A", "E", [["2. ", { color: TEAL }], [d.t2.titulo || "Busquemos perlas escondidas", {}], [" (10 mins)", { size: 9 }]]); nombre("F", "F", d.t2.p); y -= RH;
        const cita = (d.lect.cita || "").match(/^(.*?)\s*(\(th[^)]*\))?\s*$/) || ["", d.lect.cita, ""];
        rich("A", "C", [["3. ", { color: TEAL }], ["Lectura de la Biblia", {}], [" (4 mins)", { size: 9 }], [":" + (cita[1] || ""), {}], ...(cita[2] ? [[" " + cita[2], { size: 9 }]] : [])]);
        put("D", "E", "Consejero S. Aux.:", { align: "right", size: 9, color: "067876" }); nombre("F", "F", d.consejero, { fill: "CFEAE7", color: "05605E" }); y -= RH;
        sala("S. Princ.:", d.lect.p, "S. Aux.:", d.lect.a);
        barra("SEAMOS MEJORES MAESTROS", ORO);
        d.maestros.forEach((m, i) => {
          rich("A", "F", [[`${4 + i}. `, { color: ORO }], [m.titulo, {}], [` (${m.min} mins)`, { size: 9 }], ...(m.ref ? [[": ", { size: 9 }], [m.ref, { size: 9, italic: true }]] : [])]); y -= RH;
          sala("S. Princ.:", m.p, "S. Aux.:", m.a);
          if (m.pa || m.aa) sala("Ayudante:", m.pa, "Ayudante:", m.aa, true);
          linea();
        });
        barra("NUESTRA VIDA CRISTIANA", ROJO);
        rich("A", "F", [["• ", { color: ROJO }], [`Canción ${d.c2}`, {}]]); y -= RH;
        const n0 = 4 + d.maestros.length;
        d.vida.forEach((v, i) => { const anchoBox = v.video && v.texto; rich("A", anchoBox ? "D" : "E", [[`${n0 + i}. `, { color: ROJO }], [v.titulo, {}], [` (${v.min || 15} mins)`, { size: 9 }]]); if (v.video) put(anchoBox ? "E" : "F", "F", MX(v.texto) || "VIDEO", { align: "center", box: true, fill: "EFEFEF", color: "444444" }); else nombre("F", "F", v.p); y -= RH; });
        if (d.evento === "Visita del superintendente de circuito") { rich("A", "D", [[`${n0 + d.vida.length}. `, { color: ROJO }], ["Discurso de servicio", {}], [" (30 mins)", { size: 9 }], ...(d.estudio.supT ? [[`: «${d.estudio.supT}»`, { size: 9, italic: true }]] : [])]); put("E", "F", MX(d.estudio.sup) || "SUPERINTENDENTE DE CIRCUITO", { align: "center", box: true, fill: "E3F4F2", color: "05605E" }); y -= RH; }
        else { rich("A", "B", [[`${n0 + d.vida.length}. `, { color: ROJO }], ["Estudio bíblico de la congregación", {}], [" (30 mins)", { size: 9 }]]);
        nombre("C", "D", d.estudio.p); put("E", "E", "Lector:", { bold: false, align: "right", size: 9 }); nombre("F", "F", d.estudio.lector); y -= RH; }
        rich("A", "B", [["• ", { color: ROJO }], ["Palabras de conclusión", { color: ROJO }], [" (3 mins)", { color: ROJO, size: 9 }]]);
        rich("C", "E", [["• ", { color: ROJO }], [`Canción ${d.c3} y oración`, { color: ROJO }]], { align: "right" }); nombre("F", "F", d.oracion2); y -= RH;
      }
      pg.drawRectangle({ x: X[0], y, width: X[6] - X[0], height: y0 - y, borderColor: hex(NEGRO), borderWidth: 1.6 });
      y -= RH;
    }
    paginas.forEach((p, i) => { p.drawText("CRABS · Congregación Tierra Baja", { x: M, y: 12, size: 7, font: FN, color: hex("777777") }); const t = `Página ${i + 1} de ${paginas.length}`; p.drawText(t, { x: PW - M - FN.widthOfTextAtSize(t, 7), y: 12, size: 7, font: FN, color: hex("777777") }); });
    const bytes = await pdf.save(); const nom_ = titulo.normalize("NFD").replace(/[̀-ͯ]/g, "") + ".pdf";
    const blob = formato === "img" ? await pdfAImagenes(bytes, nom_.replace(/\.pdf$/, "")) : new Blob([bytes], { type: "application/pdf" });
    await entregar(blob, nom_, formato === "img" ? "Imagen lista" : "PDF listo", mensaje || `${saludoHora()}, hermanos 👋🏽\nLes comparto el programa de Vida y Ministerio ${semanas.length === 1 ? `de la semana ${tituloSemana(semanas[0][0])}` : `de ${mesNombre(CG.mes)}`}.\nPor favor revisen sus asignaciones y, si alguno tiene algún inconveniente, avísenme con tiempo. ¡Muchas gracias!`);
  } catch (e) { toast(e.message); } finally { document.body.classList.remove("loading"); }
}
async function xlsVmc(X) {
  const wb = new X.Workbook(); const ws = wb.addWorksheet("Vida y Ministerio", { views: [{ showGridLines: false }] });
  ws.columns = [{ width: 36 }, { width: 31 }, { width: 12 }, { width: 21 }, { width: 15 }, { width: 35 }];
  const NEGRO = "000000", VERDE = "2E6E4E", TEAL = "067876", ORO = "A0701B", ROJO = "8A0B14", GRIS = "8C8C8C";
  const F = (o = {}) => ({ name: "Arial", size: o.size || 10.5, bold: o.bold !== false, italic: !!o.italic, color: { argb: "FF" + (o.color || NEGRO) } });
  const fino = { style: "thin", color: { argb: "FF000000" } }, grueso = { style: "medium", color: { argb: "FF000000" } };
  const caja = { top: fino, left: fino, bottom: fino, right: fino };
  const MX = s => String(s || "").toUpperCase();
  const N = id => MX(nom(id));
  let r = 1;
  const put = (ref, v, o = {}) => { const c = ws.getCell(ref); c.value = v; c.font = F(o); c.alignment = { vertical: "middle", horizontal: o.align || "left", wrapText: false, shrinkToFit: !!o.shrink, indent: o.indent || 0 }; if (o.fill) c.fill = relleno(o.fill); if (o.box) c.border = caja; return c; };
  const rich = (ref, partes, o = {}) => { const c = ws.getCell(ref); c.value = { richText: partes.map(([t, f]) => ({ text: t, font: F(f) })) }; c.alignment = { vertical: "middle", horizontal: o.align || "left", shrinkToFit: true }; return c; };
  const merge = (a, b) => ws.mergeCells(`${a}${r}:${b}${r}`);
  const nombre = (col, id, o = {}) => put(col + r, N(id), { align: "center", box: true, fill: o.fill, color: o.color, shrink: true });
  const barra = (t, fill) => { merge("A", "F"); put("A" + r, t, { align: "center", color: "FFFFFF", fill, size: 11 }); r++; };
  const sala = (lab1, p, lab2, a, chico) => { put("B" + r, lab1, { bold: false, align: "right", size: chico ? 9 : 10.5 }); merge("C", "D"); nombre("C", p); put("E" + r, lab2, { bold: false, align: "right", size: chico ? 9 : 10.5 }); nombre("F", a); r++; };
  const linea = row => ["A", "B", "C", "D", "E", "F"].forEach(c => { const x = ws.getCell(c + row); x.border = { ...(x.border || {}), bottom: fino }; });
  for (const l of semanasMes(CG.mes)) {
    const rr = R("vmc").find(x => x.k === l); const d = rr ? { ...VMC_BASE(), ...rr.d } : null; const r0 = r;
    merge("A", "C"); put("A" + r, `SEMANA ${MX(tituloSemana(l))}`, { size: 11 }); merge("D", "E"); put("D" + r, "Lectura semanal de la Biblia:", { size: 10.5 }); put("F" + r, MX(d ? d.lectura : ""), { align: "center", shrink: true }); r++;
    if (!d) { barra("PROGRAMA PENDIENTE", "9E9E9E"); }
    else if (sinReunion(d)) { barra(MX(d.evento) + (d.eventoTema ? ` (${MX(d.eventoTema)})` : ""), TEAL); }
    else {
      rich("A" + r, [["● ", { color: GRIS }], [`Canción ${d.c1} y oración:`, {}]], { align: "right" }); nombre("B", d.oracion1);
      merge("C", "E"); rich("C" + r, [["● ", { color: GRIS }], ["Palabras de introd. ", {}], ["(1 min)", { size: 9 }], [":", {}]], { align: "right" }); nombre("F", d.intro); r++;
      barra("TESOROS DE LA BIBLIA", TEAL);
      merge("A", "E"); rich("A" + r, [["1. ", { color: TEAL }], [d.t1.titulo, {}], [` (${d.t1.min || 10} mins)`, { size: 9 }]]); nombre("F", d.t1.p); r++;
      merge("A", "E"); rich("A" + r, [["2. ", { color: TEAL }], [d.t2.titulo || "Busquemos perlas escondidas", {}], [" (10 mins)", { size: 9 }]]); nombre("F", d.t2.p); r++;
      const cita = (d.lect.cita || "").match(/^(.*?)\s*(\(th[^)]*\))?\s*$/) || ["", d.lect.cita, ""];
      merge("A", "D"); rich("A" + r, [["3. ", { color: TEAL }], ["Lectura de la Biblia", {}], [" (4 mins)", { size: 9 }], [":" + (cita[1] || ""), {}], ...(cita[2] ? [[" " + cita[2], { size: 9 }]] : [])]);
      put("E" + r, "Consejero S. Aux.:", { align: "right", size: 9, color: "067876" }); nombre("F", d.consejero, { fill: "CFEAE7", color: "05605E" }); r++;
      sala("S. Princ.:", d.lect.p, "S. Aux.:", d.lect.a);
      barra("SEAMOS MEJORES MAESTROS", ORO);
      d.maestros.forEach((m, i) => {
        merge("A", "F"); rich("A" + r, [[`${4 + i}. `, { color: ORO }], [m.titulo, {}], [` (${m.min} mins)`, { size: 9 }], ...(m.ref ? [[": ", { size: 9 }], [m.ref, { size: 9, italic: true }]] : [])]); r++;
        sala("S. Princ.:", m.p, "S. Aux.:", m.a);
        if (m.pa || m.aa) sala("Ayudante:", m.pa, "Ayudante:", m.aa, true);
        linea(r - 1);
      });
      barra("NUESTRA VIDA CRISTIANA", ROJO);
      merge("A", "F"); rich("A" + r, [["● ", { color: ROJO }], [`Canción ${d.c2}`, {}]]); r++;
      const n0 = 4 + d.maestros.length;
      d.vida.forEach((v, i) => { const anchoBox = v.video && v.texto; merge("A", anchoBox ? "D" : "E"); rich("A" + r, [[`${n0 + i}. `, { color: ROJO }], [v.titulo, {}], [` (${v.min || 15} mins)`, { size: 9 }]]); if (v.video) { if (anchoBox) merge("E", "F"); } if (v.video) put((anchoBox ? "E" : "F") + r, MX(v.texto) || "VIDEO", { align: "center", box: true, fill: "EFEFEF", color: "444444", shrink: true }); else nombre("F", v.p); r++; });
      if (d.evento === "Visita del superintendente de circuito") { merge("A", "D"); rich("A" + r, [[`${n0 + d.vida.length}. `, { color: ROJO }], ["Discurso de servicio", {}], [" (30 mins)", { size: 9 }], ...(d.estudio.supT ? [[`: «${d.estudio.supT}»`, { size: 9, italic: true }]] : [])]); merge("E", "F"); put("E" + r, MX(d.estudio.sup) || "SUPERINTENDENTE DE CIRCUITO", { align: "center", box: true, fill: "E3F4F2", color: "05605E", shrink: true }); r++; }
      else { merge("A", "B"); rich("A" + r, [[`${n0 + d.vida.length}. `, { color: ROJO }], ["Estudio bíblico de la congregación", {}], [" (30 mins)", { size: 9 }]]);
      merge("C", "D"); nombre("C", d.estudio.p); put("E" + r, "Lector:", { bold: false, align: "right", size: 9 }); nombre("F", d.estudio.lector); r++; }
      merge("A", "B"); rich("A" + r, [["● ", { color: ROJO }], ["Palabras de conclusión", { color: ROJO }], [" (3 mins)", { color: ROJO, size: 9 }]]);
      merge("C", "E"); rich("C" + r, [["● ", { color: ROJO }], [`Canción ${d.c3} y oración`, { color: ROJO }]], { align: "right" }); nombre("F", d.oracion2); r++;
    }
    // marco grueso de la semana
    for (let k = r0; k < r; k++) { const a = ws.getCell("A" + k), f = ws.getCell("F" + k); a.border = { ...(a.border || {}), left: grueso }; f.border = { ...(f.border || {}), right: grueso }; ws.getRow(k).height = 17; }
    ["A", "B", "C", "D", "E", "F"].forEach(c => { const t = ws.getCell(c + r0); t.border = { ...(t.border || {}), top: grueso }; const b = ws.getCell(c + (r - 1)); b.border = { ...(b.border || {}), bottom: grueso }; });
    r++;
  }
  ws.pageSetup = { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true, margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 } };
  ws.headerFooter = { oddFooter: "&L&8CRABS · Congregación Tierra Baja&R&8Página &P de &N" };
  await descargar(wb, `Vida y Ministerio ${mesNombre(CG.mes)}.xlsx`);
}
/* Acomodadores, micrófonos y plataforma */
const REU = { entre: "Entre semana", tb16: "Fin de semana 4:00 PM", tb18: "Fin de semana 6:15 PM" };
function vAcomod() {
  const ms = mesSelector(vAcomod);
  let h = tabs(SEC.reu.tabs) + ms.html;
  for (const tipo of ["entre", "tb16", "tb18"]) {
    const l = R("acomod").filter(r => r.d.reunion === tipo && r.k.startsWith(CG.mes)).sort((a, b) => a.k < b.k ? -1 : 1);
    h += `<div class="label">${REU[tipo]}</div><div class="card" style="padding:4px 0;overflow-x:auto"><table class="ctable"><thead><tr><th>Fecha</th>${tipo !== "entre" ? "<th>Presidente</th><th>Lector</th>" : ""}<th>Acomodador</th><th>Micrófonos</th><th>Plataforma</th></tr></thead><tbody>
      ${l.length ? l.map(r => `<tr data-aid="${r.id}"><td><b>${corto(r.k)}</b></td>${tipo !== "entre" ? `<td>${esc(nomCorto(r.d.presidente))}</td><td>${esc(nomCorto(r.d.lector))}</td>` : ""}<td>${esc(nomCorto(r.d.acomodador))}</td><td>${(r.d.microfonos || []).filter(Boolean).map(nomCorto).map(esc).join("<br>")}</td><td>${esc(nomCorto(r.d.plataforma))}</td></tr>`).join("") : `<tr><td colspan="6" class="note" style="text-align:center;padding:14px">Sin asignaciones este mes</td></tr>`}</tbody></table></div>`;
  }
  h += `<div class="row" style="margin-top:12px">${cAdmin() ? `<button class="btn pri" id="nuevoA">+ Asignación</button>` : ""}${btnExcel("xlsAc", "Excel del mes")}<button class="btn line" id="rotAc">📊 Rotación</button></div>`;
  $("#cview").innerHTML = h; ms.bind(); bindTabs();
  $("#rotAc").onclick = () => abrirRot("acomod", "acom");
  document.querySelectorAll("[data-aid]").forEach(t => t.onclick = () => fichaAcomod(R("acomod").find(r => r.id === t.dataset.aid)));
  if ($("#nuevoA")) $("#nuevoA").onclick = () => fichaAcomod(null);
  $("#xlsAc").onclick = () => conExcel(xlsAcomod);
}
function fichaAcomod(r) {
  if (!cAdmin()) { toast("Solo los administradores pueden editar"); return; }
  const d = r ? r.d : { reunion: "entre", presidente: "", lector: "", acomodador: "", microfonos: ["", "", ""], plataforma: "" };
  const fecha = r ? r.k : HOY;
  hoja(`<div class="shead"><h2>${r ? "Editar asignación" : "Nueva asignación"}</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
    <div class="grid2">${campo("Reunión", `<select id="aR" class="csel">${Object.entries(REU).map(([k, l]) => `<option value="${k}" ${d.reunion === k ? "selected" : ""}>${l}</option>`).join("")}</select>`)}${campo("Fecha", `<input id="aF" type="date" value="${fecha}">`)}</div>
    <div id="aFin" class="grid2">${campo("Presidente", selPersona("aP", d.presidente, esNombrado))}${campo("Lector", selPersona("aL", d.lector, esHermano))}</div>
    ${campo("Acomodador", selPersona("aA", d.acomodador, esHermano))}
    <div class="grid2">${[0, 1, 2].map(i => campo("Micrófono " + (i + 1), selPersona("aM" + i, (d.microfonos || [])[i] || "", esHermano))).join("")}</div>
    ${campo("Plataforma", selPersona("aPl", d.plataforma, esHermano))}
    <button class="btn pri" id="aOk">Guardar</button>${r ? `<button class="btn bad" id="aDel">Borrar</button>` : ""}`,
    (bg, close) => {
      const fin = () => bg.querySelector("#aFin").hidden = val(bg, "aR") === "entre"; bg.querySelector("#aR").onchange = fin; fin();
      bg.querySelector("#aOk").onclick = async () => {
        const nd = { reunion: val(bg, "aR"), presidente: val(bg, "aP"), lector: val(bg, "aL"), acomodador: val(bg, "aA"), microfonos: [0, 1, 2].map(i => val(bg, "aM" + i)), plataforma: val(bg, "aPl") };
        if (nd.reunion === "entre") { nd.presidente = ""; nd.lector = ""; }
        const f = val(bg, "aF"); if (!f) { toast("Escoge la fecha"); return; }
        await cGuardar("acomod", f, r ? r.id : null, nd, `${REU[nd.reunion]} ${corto(f)}: ${r ? "cambió la asignación de acomodadores y audio" : "asignación de acomodadores y audio cargada"}`); close(); toast("Guardado");
      };
      const del = bg.querySelector("#aDel"); if (del) del.onclick = async () => { await cBorrar(r.id); close(); };
    });
}
// Nombre corto como lo escriben a mano: primer nombre, y la inicial del apellido si hay otro con el mismo nombre
function nomPila(id) {
  const p = P(id); if (!p) return id ? String(id) : "";
  const pn = n => norm(n.split(" ")[0]);
  const mismo = CG.personas.filter(x => pn(x.nombre) === pn(p.nombre));
  const a = p.nombre.split(" "); const ap = a[a.length - 1];
  return mismo.length > 1 ? `${a[0]} ${ap[0].toUpperCase()}` : a[0];
}
async function xlsAcomod(X) {
  const wb = new X.Workbook(); const ws = wb.addWorksheet("Acomodadores", { views: [{ showGridLines: false }] });
  ws.columns = [{ width: 15 }, { width: 15 }, { width: 13 }, { width: 18 }, { width: 18 }, { width: 13 }];
  const borde1 = { style: "thin", color: { argb: "FF8E9EA3" } }; const caja = { top: borde1, left: borde1, bottom: borde1, right: borde1 };
  const put = (ref, v, o = {}) => { const c = ws.getCell(ref); c.value = v; c.font = { name: "Calibri", size: o.size || 11, bold: !!o.bold, color: { argb: "FF111111" } }; c.alignment = { vertical: "top", horizontal: "left", wrapText: true }; if (o.fill) c.fill = relleno(o.fill); if (o.box !== false) c.border = caja; return c; };
  let r = 1;
  const titulo = (t, amarillo) => { ws.mergeCells(`A${r}:${amarillo ? "E" : "F"}${r}`); put("A" + r, t, { bold: true, size: 14, fill: amarillo ? "FFFF00" : undefined, box: false }); ws.getRow(r).height = 24; r++; };
  const bloques = [["entre", "Reunión de entre semana acomodadores y micrófonos", false, ["Fechas", "Acomodador", "Microfonos", "Plataforma"]],
    ["tb16", "Reunión fin de semana primer horario 4 pm", true, ["Fechas", "Presidente", "Lector", "Acomodador", "Microfono", "Plataforma"]],
    ["tb18", "Reunión fin de semana segundo horario 6:15 pm", true, ["Fechas", "Presidente", "Lector", "Acomodador", "Microfonos", "Plataforma"]]];
  const fechaCorta = f => { const F = fd(f); return `${F.d} ${F.m.slice(0, 3)}`; };
  for (const [tipo, t, am, cols] of bloques) {
    if (tipo !== "entre") r++;
    titulo(t, am); if (tipo === "entre") r++;
    const ent = tipo === "entre";
    // En entre semana la tabla ocupa 4 columnas más anchas: Fechas, Acomodador, Micrófonos, Plataforma
    const colsEnt = [["A"], ["B"], ["C", "D"], ["E"]];
    const escribe = (vals, fill, bold) => { if (ent) vals.forEach((v, k) => { const [c1, c2] = colsEnt[k]; if (c2) ws.mergeCells(`${c1}${r}:${c2}${r}`); put(c1 + r, v, { fill, bold }); if (c2) ws.getCell(c2 + r).border = caja; }); else vals.forEach((v, k) => put(String.fromCharCode(65 + k) + r, v, { fill, bold })); ws.getRow(r).height = 22; r++; };
    escribe(cols, "A5D7DE");
    const l = R("acomod").filter(x => x.d.reunion === tipo && x.k.startsWith(CG.mes)).sort((a, b) => a.k < b.k ? -1 : 1);
    l.forEach((x, i) => {
      const mic = (x.d.microfonos || []).filter(Boolean).map(nomPila).join("-");
      const vals = ent ? [fechaCorta(x.k), nomPila(x.d.acomodador), mic, nomPila(x.d.plataforma)] : [fechaCorta(x.k), nomPila(x.d.presidente), nomPila(x.d.lector), nomPila(x.d.acomodador), mic, nomPila(x.d.plataforma)];
      escribe(vals, i % 2 ? "A5D7DE" : "D6EBF0");
      if (mic.length > 16) ws.getRow(r - 1).height = 36;
    });
    if (!l.length) escribe(ent ? ["", "", "", ""] : ["", "", "", "", "", ""], "D6EBF0");
  }
  ws.pageSetup = { paperSize: 1, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 1, margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } };
  await descargar(wb, `Acomodadores ${mesNombre(CG.mes)}.xlsx`);
}

/* ================= INFORMES ================= */
let gInf = null;
function miPersona() { return CG.personas.find(p => p.id === CG.me.persona) || CG.personas.find(p => norm(p.nombre) === norm(CG.me.nombre || "")); }
const veTodos = () => !!(CG.me && (CG.me.todos || CG.me.super));
const miGrupoKey = () => { const y = miPersona(); return y ? y.horario + "|" + y.grupo : ""; };
// Totales del mes como los pide la sucursal (solo cuentan quienes participaron)
function totalesSucursal(personas, mes) {
  const inf = id => (R("informe").find(r => r.k === mes + "|" + id) || {}).d;
  const si = personas.filter(p => { const d = inf(p.id); return d && d.participo; });
  const reg = si.filter(p => p.precursor === "regular");
  const esp = si.filter(p => ["especial", "misionero"].includes(p.precursor));
  const aux = si.filter(p => !reg.includes(p) && !esp.includes(p) && (p.precursor === "auxiliar" || inf(p.id).aux));
  const pubs = si.filter(p => !reg.includes(p) && !esp.includes(p) && !aux.includes(p));
  const fila = (n, l, horas) => ({ n, cant: l.length, cursos: l.reduce((s, p) => s + (+inf(p.id).cursos || 0), 0), horas: horas ? l.reduce((s, p) => s + (+inf(p.id).horas || 0), 0) : null });
  const act = actividad(personas, mes); const activos = act.activos;
  return { meses: act.ventana.length, filas: [fila("Publicadores", pubs), fila("Precursores auxiliares", aux, true), fila("Precursores regulares", reg, true), ...(esp.length ? [fila("Precursores especiales y misioneros", esp, true)] : [])], activos: activos.length, inactivos: personas.length - activos.length, total: personas.length };
}
const inf2 = (m, id) => (R("informe").find(r => r.k === m + "|" + id) || {}).d;
// Ventana de 6 meses ya cerrados (no cuenta el mes en curso, que todavía se está informando), recortada al primer mes con informes en la app
function ventanaActividad(mes) {
  const fin = mes < HOY.slice(0, 7) ? mes : mesMas(HOY.slice(0, 7), -1);
  const primero = R("informe").map(r => r.k.slice(0, 7)).sort()[0] || fin;
  return [0, 1, 2, 3, 4, 5].map(i => mesMas(fin, -i)).filter(m => m >= primero).reverse();
}
function actividad(personas, mes) {
  const v = ventanaActividad(mes); const res = { ventana: v, activos: [], irregulares: [], inactivos: [] };
  personas.forEach(p => { const falt = v.filter(m => { const d = inf2(m, p.id); return !(d && d.participo); });
    if (falt.length === v.length && v.length) res.inactivos.push({ p, falt }); else if (falt.length) { res.irregulares.push({ p, falt }); res.activos.push(p); } else res.activos.push(p); });
  return res;
}
function vInf() {
  if (!cAdmin()) { $("#cview").innerHTML = vacio("Los informes solo los ven los administradores."); return; }
  if (!veTodos()) gInf = miGrupoKey() || "ninguno";
  else if (!gInf) { const yo = miPersona(); gInf = yo && yo.encargado ? yo.horario + "|" + yo.grupo : "todos"; }
  const ms = mesSelector(vInf);
  const regs = R("informe").filter(r => r.k.startsWith(CG.mes + "|"));
  const inf = id => regs.find(r => r.d.persona === id);
  const lista = CG.personas.filter(p => gInf === "todos" || (p.horario + "|" + p.grupo) === gInf);
  const hechos = lista.filter(p => inf(p.id)).length;
  const part = lista.filter(p => inf(p.id) && inf(p.id).d.participo).length;
  const cursos = lista.reduce((s, p) => s + (inf(p.id) ? +inf(p.id).d.cursos || 0 : 0), 0);
  const horas = lista.reduce((s, p) => s + (inf(p.id) ? +inf(p.id).d.horas || 0 : 0), 0);
  const chipsG = veTodos() ? `<div class="roles ctabs"><button class="chipo ${gInf === "todos" ? "" : "off"}" data-gi="todos">Todos</button>${["tb16", "tb18"].flatMap(hh => [1, 2, 3].map(g => `<button class="chipo ${gInf === hh + "|" + g ? "" : "off"}" data-gi="${hh}|${g}">G${g} · ${HOR[hh]}</button>`)).join("")}</div>` : `<p class="note" style="margin:0 4px 10px">${gInf === "ninguno" ? "Tu usuario no está vinculado a tu ficha de publicador. Pídele al super administrador que lo vincule." : `Ves solo tu grupo: <b>Grupo ${gInf.split("|")[1]} · ${HOR[gInf.split("|")[0]]}</b>.`}</p>`;
  const aS = anioServicio(CG.mes);
  let h = ms.html + chipsG + `<div class="row" style="margin:4px 0 12px">${btnExcel("xlsInf", "Excel del mes")}<button class="btn line" id="s21G">📄 Tarjetas S-21 ${gInf === "todos" ? "de todos" : "del grupo"} (${aS})</button></div>  <div class="kpis">${[[`${hechos}/${lista.length}`, "Entregados"], [part, "Participaron"], [cursos, "Cursos"], [horas, "Horas prec."]].map(([n, l]) => `<div class="kpi"><span class="n">${n}</span><span class="l">${l}</span></div>`).join("")}</div>
  <div class="bar" style="margin:10px 2px"><i style="width:${lista.length ? Math.round(hechos / lista.length * 100) : 0}%;background:var(--ok)"></i></div>
  ${bloquePendientes(lista, inf)}${bloquePastoreo(lista)}${bloqueSucursal(lista)}
  <p class="note" style="margin:12px 4px 10px">Toca <b>Sí</b> o <b>No</b> para marcar si participó. Las horas solo aplican a precursores (y a quien fue auxiliar ese mes).</p><div class="ileg"><span><i class="i-si"></i>Participó</span><span><i class="i-no"></i>No participó</span><span><i class="i-pend"></i>Pendiente</span></div><div class="list">`;
  h += lista.map(p => { const r = inf(p.id); const d = r ? r.d : {}; const prec = ["regular", "especial", "misionero"].includes(p.precursor) || d.aux;
    const est = !r ? "pend" : d.participo === true ? "si" : d.participo === false ? "no" : "pend";
    return `<div class="card irow i-${est}" data-ip="${p.id}"><div class="ihead"><b>${esc(p.nombre)}${d.por === "publicador" ? ` <span class="pill t-info" title="Lo envió él desde su celular · ${esc(d.enviado || "")}">📱 Enviado por él</span>` : ""}</b><span class="pchips">${p.precursor !== "no" ? `<span class="pill t-ok">${{ auxiliar: "PA", regular: "PR", especial: "PE", misionero: "MC" }[p.precursor]}</span>` : ""}<button class="chipo mini off" data-s21="${p.id}">S-21</button>${r ? "" : `<span class="pill t-warn">Falta</span>`}</span></div>
      <div class="icontrols"><div class="seg2"><button class="${d.participo === true ? "on" : ""}" data-v="si">Sí</button><button class="${d.participo === false ? "on no" : ""}" data-v="no">No</button></div>
      <label class="ic">Cursos <input type="number" min="0" inputmode="numeric" value="${d.cursos ?? ""}" data-f="cursos"></label>
      ${prec ? `<label class="ic">Horas <input type="number" min="0" inputmode="numeric" value="${d.horas ?? ""}" data-f="horas"></label>` : ""}${p.precursor === "no" || p.precursor === "auxiliar" ? `<label class="ic chk"><input type="checkbox" data-f="aux" ${d.aux ? "checked" : ""}> Auxiliar</label>` : ""}</div>
      <input class="tin inota" placeholder="Notas (sale en la tarjeta S-21)" value="${esc(d.nota || "")}" data-f="nota"></div>`; }).join("");
  h += "</div>";
  $("#cview").innerHTML = h; ms.bind();
  $("#s21G").onclick = () => { const [hh, g] = gInf.split("|"); exportarS21(lista, aS, gInf === "todos" ? `Tarjetas S-21 Tierra Baja ${aS}` : `Tarjetas S-21 Grupo ${g} ${HOR[hh]} ${aS}`.replace(":", "."));};
  document.querySelectorAll("[data-s21]").forEach(b => b.onclick = e => { e.stopPropagation(); const pp = P(b.dataset.s21); exportarS21([pp], aS, `S-21 ${pp.nombre} ${aS}`); });
  document.querySelectorAll("[data-gi]").forEach(b => b.onclick = () => { gInf = b.dataset.gi; vInf(); });
  document.querySelectorAll("[data-ver]").forEach(b => b.onclick = () => fichaPersona(b.dataset.ver));
  document.querySelectorAll("[data-ip]").forEach(card => {
    const pid = card.dataset.ip;
    const guardar = async cambio => { const r = inf(pid); const nd = Object.assign({ persona: pid, mes: CG.mes, participo: null, cursos: 0, horas: null, aux: false }, r ? r.d : {}, cambio);
      try { await rpc("cong_reg_guardar", { p_modulo: "informe", p_clave: CG.mes + "|" + pid, p_id: r ? r.id : null, p_d: nd, p_aviso: null }); await cCargar(); vInf(); } catch (e) { toast(e.message); } };
    card.querySelectorAll("[data-v]").forEach(b => b.onclick = () => guardar({ participo: b.dataset.v === "si" }));
    card.querySelectorAll("[data-f]").forEach(i => i.onchange = () => guardar({ [i.dataset.f]: i.type === "checkbox" ? i.checked : i.dataset.f === "nota" ? i.value.trim() : (i.value === "" ? null : Math.max(0, +i.value)) }));
  });
  $("#xlsInf").onclick = () => conExcel(xlsInformes);
}
function bloquePendientes(lista, inf) {
  const pend = lista.filter(p => !inf(p.id));
  if (!pend.length) return `<div class="aviso" style="margin-top:10px;background:var(--ok-soft)">✅<span>Todos entregaron el informe de ${mesNombre(CG.mes).split(" ")[0]}.</span></div>`;
  const mesT = mesNombre(CG.mes).split(" ")[0];
  const limite = mesMas(CG.mes, 1) === HOY.slice(0, 7) && +HOY.slice(8) <= 10;
  const msg = p => `Hola, ${p.nombre.split(" ")[0]} 👋🏽 ¿Cómo estás? Te escribo para recordarte con cariño el informe de predicación de ${mesT}.${limite ? " Si puedes, mándamelo antes del 10." : ""} Me lo puedes enviar por aquí${p.acceso ? " o registrarlo tú mismo en la app" : ""}. ¡Muchas gracias!`;
  const grupo = `Buenas, hermanos 👋🏽 Un recordatorio con cariño: si aún no han enviado su informe de predicación de ${mesT}, por favor háganmelo llegar${limite ? " antes del 10" : ""}. A quienes ya lo enviaron, ¡mil gracias!`;
  return `<details class="plg"><summary>⏳ Faltan por entregar <span class="pill t-warn">${pend.length}</span></summary><div class="card spad" style="margin-top:8px">
    <a class="btn ok" style="width:100%" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(grupo)}">${I.wa} Recordatorio general al grupo</a>
    <p class="note" style="margin:8px 2px">El mensaje al grupo no menciona nombres. A cada uno le puedes escribir en privado:</p>
    ${pend.map(p => `<div class="pend"><span><b>${esc(p.nombre)}</b><small>Grupo ${p.grupo} · ${HOR[p.horario]}</small></span>${p.tel ? `<a class="btn line sm" target="_blank" rel="noopener" href="${linkWa(p.tel, msg(p))}">${I.wa} Recordar</a>` : `<small class="note">Sin teléfono</small>`}</div>`).join("")}</div></details>`;
}
function bloquePastoreo(lista) {
  const a = actividad(lista, CG.mes); if (!a.ventana.length) return "";
  const mc = m => MES[+m.slice(5) - 1].slice(0, 3);
  const fila = (x, inact) => `<div class="pend"><span><b>${esc(x.p.nombre)}</b><small>Grupo ${x.p.grupo} · ${HOR[x.p.horario]}${inact ? "" : ` · sin informe: ${x.falt.map(mc).join(", ")}`}</small></span><button class="btn line sm" data-ver="${x.p.id}">Ver</button></div>`;
  const n = a.irregulares.length + a.inactivos.length, completo = a.ventana.length >= 6;
  return `<details class="plg"><summary>🫶 Pastoreo: irregulares e inactivos ${n ? `<span class="pill ${completo ? "t-bad" : "t-warn"}">${n}</span>` : `<span class="pill t-ok">0</span>`}</summary><div class="card spad" style="margin-top:8px">
    <p class="note" style="margin:0 0 6px">Revisa ${a.ventana.length === 1 ? "el mes" : "los meses"} de ${a.ventana.map(mc).join(", ")}. <b>Irregular</b>: le faltó informar algún mes. <b>Inactivo</b>: no informó en ninguno de los últimos 6 meses.${completo ? "" : ` <b>Por ahora la app solo tiene ${a.ventana.length} ${a.ventana.length === 1 ? "mes cerrado" : "meses cerrados"} con informes</b>, así que es una lista preliminar: la cuenta oficial sale cuando haya 6.`}</p>
    <div class="label" style="margin:10px 0 0">${completo ? "Inactivos" : "Sin informe en todo el período"} (${a.inactivos.length})</div>${a.inactivos.map(x => fila(x, true)).join("") || `<p class="note">Ninguno 🙌</p>`}
    <div class="label" style="margin:14px 0 0">Irregulares (${a.irregulares.length})</div>${a.irregulares.map(x => fila(x, false)).join("") || `<p class="note">Ninguno 🙌</p>`}
  </div></details>`;
}
function bloqueSucursal(lista) {
  const t = totalesSucursal(lista, CG.mes);
  return `<details class="plg"><summary>🏢 Totales para la sucursal</summary><div class="card spad" style="margin-top:8px">
    <table class="suc"><tr><th></th><th>Cant.</th><th>Horas</th><th>Cursos</th></tr>${t.filas.map(f => `<tr><td>${f.n}</td><td>${f.cant}</td><td>${f.horas ?? "—"}</td><td>${f.cursos}</td></tr>`).join("")}</table>
    <div class="suca"><span><b>${t.meses ? t.activos : "—"}</b> publicadores activos</span><span><b>${t.meses ? t.inactivos : "—"}</b> inactivos</span></div>
    ${(() => { const a = resumenAsist(CG.mes); return a.entre.n || a.fin.n ? `<table class="suc" style="margin-top:12px"><tr><th>Asistencia</th><th>Reuniones</th><th>Total</th><th>Promedio</th></tr><tr><td>Entre semana</td><td>${a.entre.n}</td><td>${a.entre.tot}</td><td>${a.entre.prom}</td></tr><tr><td>Fin de semana</td><td>${a.fin.n}</td><td>${a.fin.tot}</td><td>${a.fin.prom}</td></tr></table>` : ""; })()}
    <p class="note" style="margin:8px 2px 0">Solo cuentan quienes participaron este mes. Activos = participaron al menos una vez en los últimos 6 meses cerrados (${t.meses ? `hoy hay ${t.meses} ${t.meses === 1 ? "mes cerrado" : "meses cerrados"} con informes en la app` : "se calcula cuando haya al menos un mes cerrado con informes"}). ${gInf === "todos" ? "Es el total de la congregación." : "Es solo de este grupo."}</p></div></details>`;
}
async function xlsInformes(X) {
  const wb = new X.Workbook(); const regs = R("informe").filter(r => r.k.startsWith(CG.mes + "|"));
  const inf = id => (regs.find(r => r.d.persona === id) || {}).d;
  const res = wb.addWorksheet("Resumen", { views: [{ showGridLines: false }] });
  res.columns = [{ width: 26 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }];
  res.mergeCells("A1:F1"); celda(res, "A1", `INFORMES DE PREDICACIÓN · ${mesNombre(CG.mes).toUpperCase()}`, { bold: true, size: 13, align: "center", border: false });
  ["Grupo", "Publicadores", "Entregados", "Participaron", "Cursos", "Horas prec."].forEach((t, i) => celda(res, String.fromCharCode(65 + i) + "3", t, { bold: true, fill: "DDE3F5", align: "center" }));
  let rr = 4; const tot = [0, 0, 0, 0, 0];
  for (const hor of ["tb16", "tb18"]) for (const g of [1, 2, 3]) {
    const l = CG.personas.filter(p => p.horario === hor && p.grupo === g);
    const v = [l.length, l.filter(p => inf(p.id)).length, l.filter(p => (inf(p.id) || {}).participo).length, l.reduce((s, p) => s + (+(inf(p.id) || {}).cursos || 0), 0), l.reduce((s, p) => s + (+(inf(p.id) || {}).horas || 0), 0)];
    celda(res, "A" + rr, `Grupo ${g} · ${HOR[hor]}`); v.forEach((x, i) => { celda(res, String.fromCharCode(66 + i) + rr, x, { align: "center" }); tot[i] += x; }); rr++;
    const ws = wb.addWorksheet(`G${g} ${HOR[hor].replace(":", ".")}`, { views: [{ showGridLines: false }] });
    ws.columns = [{ width: 28 }, { width: 14 }, { width: 12 }, { width: 10 }, { width: 10 }];
    ws.mergeCells("A1:E1"); celda(ws, "A1", `GRUPO ${g} · ${HOR[hor]} · ${mesNombre(CG.mes).toUpperCase()}`, { bold: true, size: 12, align: "center", border: false });
    ["Publicador", "Condición", "Participó", "Cursos", "Horas"].forEach((t, i) => celda(ws, String.fromCharCode(65 + i) + "3", t, { bold: true, fill: "EEEEEE", align: "center" }));
    let r3 = 4; l.forEach(p => { const d = inf(p.id) || {}; celda(ws, "A" + r3, p.nombre, { bold: p.encargado === "encargado" }); celda(ws, "B" + r3, p.precursor !== "no" ? PREC[p.precursor] : (d.aux ? "Precursor auxiliar" : ""), { size: 9 }); celda(ws, "C" + r3, d.participo === true ? "Sí" : d.participo === false ? "No" : "Falta", { align: "center", fill: d.participo === undefined || d.participo === null ? "FDECEB" : undefined }); celda(ws, "D" + r3, d.cursos ?? "", { align: "center" }); celda(ws, "E" + r3, d.horas ?? "", { align: "center" }); r3++; });
    hojaImprimible(ws, false);
  }
  celda(res, "A" + rr, "TOTAL", { bold: true, fill: "FFE24D" }); tot.forEach((x, i) => celda(res, String.fromCharCode(66 + i) + rr, x, { bold: true, align: "center", fill: "FFE24D" }));
  const ts = totalesSucursal(CG.personas, CG.mes); rr += 3;
  res.mergeCells(`A${rr}:D${rr}`); celda(res, "A" + rr, "INFORME A LA SUCURSAL", { bold: true, fill: "DDE3F5" }); rr++;
  ["", "Cantidad", "Horas", "Cursos"].forEach((t, i) => celda(res, String.fromCharCode(65 + i) + rr, t, { bold: true, fill: "EEEEEE", align: "center" })); rr++;
  ts.filas.forEach(f => { celda(res, "A" + rr, f.n); celda(res, "B" + rr, f.cant, { align: "center" }); celda(res, "C" + rr, f.horas ?? "—", { align: "center" }); celda(res, "D" + rr, f.cursos, { align: "center" }); rr++; });
  celda(res, "A" + rr, "Publicadores activos", { bold: true }); celda(res, "B" + rr, ts.activos, { bold: true, align: "center" }); rr++;
  celda(res, "A" + rr, "Sin participar en 6 meses"); celda(res, "B" + rr, ts.inactivos, { align: "center" });
  hojaImprimible(res, false);
  await descargar(wb, `Informes ${mesNombre(CG.mes)}.xlsx`);
}

/* ================= RECORDATORIOS: aseo, hospitalidad y eventos ================= */
const ORDEN_ASEO = [["tb16", 1], ["tb16", 2], ["tb16", 3], ["tb18", 1], ["tb18", 2], ["tb18", 3]];
function configAseo() { const r = R("aseo").find(x => x.k === "config"); return r ? r : null; }
function grupoSemana(lunes) { const c = configAseo(); const inicio = c ? c.d.inicio : lunesDe(HOY); const n = Math.round(dias(inicio, lunes) / 7); const i = ((n % 6) + 6) % 6; return ORDEN_ASEO[(i + (c ? +c.d.offset || 0 : 0)) % 6]; }
function vRec() {
  if (CG.tab === "eventos") return vEventos();
  const c = configAseo(); const l0 = lunesDe(HOY);
  let h = tabs(SEC.rec.tabs) + `<p class="note" style="margin:6px 4px 12px">Cada semana un grupo hace el <b>aseo del Salón</b> y la <b>hospitalidad</b>. Rotan los 6 grupos: 1, 2 y 3 de las 4:00 PM y luego 1, 2 y 3 de las 6:15 PM.</p><div class="list">`;
  for (let i = 0; i < 10; i++) { const l = sumDias(l0, 7 * i); const [hor, g] = grupoSemana(l); const enc = CG.personas.find(p => p.horario === hor && p.grupo === g && p.encargado === "encargado");
    h += `<div class="card srow ${i === 0 ? "esta" : ""}"><span class="dpill" style="background:${i === 0 ? "var(--accent)" : "var(--accent-soft)"};color:${i === 0 ? "var(--accent-ink)" : "var(--accent)"}">${fd(l).d} ${fd(l).m.slice(0, 3)}</span><div style="flex:1;min-width:0"><b>Grupo ${g} · ${HOR[hor]}</b><div class="note">${i === 0 ? "Esta semana · " : ""}Encargado: ${esc(enc ? enc.nombre : "—")}</div></div>${cAdmin() && i < 2 ? `<button class="chipo mini" data-wa="${l}">${I.wa} Avisar</button>` : ""}</div>`; }
  h += `</div><div class="row" style="margin-top:12px">${cAdmin() ? `<button class="btn line" id="ajAseo">Ajustar rotación</button>` : ""}${btnExcel("xlsAseo", "Excel de turnos")}</div>`;
  $("#cview").innerHTML = h; bindTabs();
  document.querySelectorAll("[data-wa]").forEach(b => b.onclick = () => { const l = b.dataset.wa; const [hor, g] = grupoSemana(l); const enc = CG.personas.find(p => p.horario === hor && p.grupo === g && p.encargado === "encargado");
    const m = `Buen día, hermano ${enc ? enc.nombre.split(" ")[0] : ""}. Le recuerdo que la semana del ${fd(l).d} de ${fd(l).m} al grupo ${g} (${HOR[hor]}) le corresponde el aseo del Salón del Reino y la hospitalidad. ¡Muchas gracias!`;
    window.open(linkWa(enc && enc.tel ? enc.tel : "", m), "_blank"); });
  if ($("#ajAseo")) $("#ajAseo").onclick = () => {
    const cur = grupoSemana(l0);
    hoja(`<div class="shead"><h2>Rotación de aseo</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
      ${campo("¿Qué grupo tiene el aseo esta semana?", `<select id="rG" class="csel">${ORDEN_ASEO.map(([hh, g], i) => `<option value="${i}" ${cur[0] === hh && cur[1] === g ? "selected" : ""}>Grupo ${g} · ${HOR[hh]}</option>`).join("")}</select>`)}
      <button class="btn pri" id="rOk">Guardar</button>`, (bg, close) => {
      bg.querySelector("#rOk").onclick = async () => { const idx = +val(bg, "rG"); await cGuardar("aseo", "config", c ? c.id : null, { inicio: l0, offset: idx }, `Rotación de aseo: esta semana le toca al grupo ${ORDEN_ASEO[idx][1]} (${HOR[ORDEN_ASEO[idx][0]]})`); close(); vRec(); };
    });
  };
  $("#xlsAseo").onclick = () => conExcel(async X => {
    const wb = new X.Workbook(); const ws = wb.addWorksheet("Aseo y hospitalidad", { views: [{ showGridLines: false }] });
    ws.columns = [{ width: 22 }, { width: 22 }, { width: 28 }];
    ws.mergeCells("A1:C1"); celda(ws, "A1", "ASEO DEL SALÓN Y HOSPITALIDAD", { bold: true, size: 13, align: "center", border: false });
    ["Semana", "Grupo", "Encargado"].forEach((t, i) => celda(ws, String.fromCharCode(65 + i) + "3", t, { bold: true, fill: "DDE3F5", align: "center" }));
    for (let i = 0; i < 12; i++) { const l = sumDias(l0, 7 * i); const [hor, g] = grupoSemana(l); const enc = CG.personas.find(p => p.horario === hor && p.grupo === g && p.encargado === "encargado");
      celda(ws, "A" + (4 + i), `${fd(l).d} ${fd(l).m.slice(0, 3)} – ${fd(sumDias(l, 6)).d} ${fd(sumDias(l, 6)).m.slice(0, 3)}`); celda(ws, "B" + (4 + i), `Grupo ${g} · ${HOR[hor]}`, { fill: ["FFE24D", "8BD17C", "F4A261"][g - 1] }); celda(ws, "C" + (4 + i), enc ? enc.nombre : ""); }
    hojaImprimible(ws, false); await descargar(wb, "Aseo y hospitalidad.xlsx");
  });
}
function vEventos() {
  const ev = R("evento").sort((a, b) => a.k < b.k ? -1 : 1);
  const fut = ev.filter(e => (e.d.hasta || e.k) >= HOY), pas = ev.filter(e => (e.d.hasta || e.k) < HOY);
  const fila = e => `<button class="card srow" data-eid="${e.id}"><span class="dpill" style="background:var(--warn-soft);color:var(--warn)">${corto(e.k)}</span><div style="flex:1;min-width:0;text-align:left"><b>${esc(e.d.titulo)}</b><div class="note">${e.d.hasta && e.d.hasta !== e.k ? "Hasta " + corto(e.d.hasta) + " · " : ""}${esc(e.d.notas || "")} ${(e.k >= HOY) ? "· en " + dias(HOY, e.k) + " días" : ""}</div></div></button>`;
  let h = tabs(SEC.rec.tabs) + `<div class="label">Próximos</div><div class="list">${fut.length ? fut.map(fila).join("") : vacio("Sin eventos próximos. Agrega asambleas, visita del superintendente o la Conmemoración.")}</div>`;
  if (pas.length) h += `<div class="label">Anteriores</div><div class="list">${pas.slice(-5).reverse().map(fila).join("")}</div>`;
  if (cAdmin()) h += `<button class="btn pri" style="width:100%;margin-top:12px" id="nuevoE">+ Evento</button>`;
  $("#cview").innerHTML = h; bindTabs();
  document.querySelectorAll("[data-eid]").forEach(b => b.onclick = () => fichaEvento(ev.find(e => e.id === b.dataset.eid)));
  if ($("#nuevoE")) $("#nuevoE").onclick = () => fichaEvento(null);
}
function fichaEvento(e) {
  if (!cAdmin()) return;
  const d = e ? e.d : { titulo: "Visita del superintendente de circuito", hasta: "", notas: "" };
  hoja(`<div class="shead"><h2>${e ? "Editar evento" : "Nuevo evento"}</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
    ${campo("Evento", `<input id="eT" list="eLista" value="${esc(d.titulo)}"><datalist id="eLista"><option>Visita del superintendente de circuito</option><option>Asamblea regional</option><option>Asamblea de circuito</option><option>Conmemoración</option><option>Campaña especial</option></datalist>`)}
    <div class="grid2">${campo("Desde", `<input id="eD" type="date" value="${e ? e.k : HOY}">`)}${campo("Hasta", `<input id="eH" type="date" value="${esc(d.hasta || "")}">`)}</div>
    ${campo("Notas", inp("eN", d.notas, "Lugar, horario, qué cambia"))}
    <button class="btn pri" id="eOk">Guardar</button>${e ? `<button class="btn bad" id="eDel">Borrar</button>` : ""}`,
    (bg, close) => {
      bg.querySelector("#eOk").onclick = async () => { const nd = { titulo: val(bg, "eT"), hasta: val(bg, "eH"), notas: val(bg, "eN") }; const f = val(bg, "eD"); if (!nd.titulo || !f) { toast("Escribe el evento y la fecha"); return; }
        await cGuardar("evento", f, e ? e.id : null, nd, `${e ? "Evento actualizado" : "Nuevo evento"}: ${nd.titulo} · ${corto(f)}`); close(); vEventos(); };
      const del = bg.querySelector("#eDel"); if (del) del.onclick = async () => { await cBorrar(e.id, `Se borró el evento ${d.titulo}`); close(); vEventos(); };
    });
}

/* ================= NOTIFICACIONES ================= */
let fAvi = "todo";
function vAvi() {
  const mods = [...new Set(CG.avisos.map(a => MOD_NOMBRE[a.mod] || "Otros"))];
  const l = CG.avisos.filter(a => fAvi === "todo" || (MOD_NOMBRE[a.mod] || "Otros") === fAvi);
  const ico = { conf: I.check, planb: I.alert, porc: I.clock, hecho: I.check, asig: I.cal };
  const ton = { conf: "t-ok", planb: "t-bad", porc: "t-warn", hecho: "t-idle", asig: "t-info" };
  let h = `<div class="roles ctabs"><button class="chipo ${fAvi === "todo" ? "" : "off"}" data-fa="todo">Todo</button>${mods.map(m => `<button class="chipo ${fAvi === m ? "" : "off"}" data-fa="${esc(m)}">${esc(m)}</button>`).join("")}</div><div class="log">`;
  h += l.length ? l.map(a => `<div class="card"><span class="tile ${ton[a.k] || "t-info"}">${ico[a.k] || I.cal}</span><div style="min-width:0"><time>${esc(a.t)} · ${esc(a.autor || "")} · ${esc(MOD_NOMBRE[a.mod] || "")}</time><div style="white-space:pre-wrap;font-weight:600;font-size:14px">${esc(String(a.m).replace(/\*/g, ""))}</div></div></div>`).join("") : vacio("Todavía no hay notificaciones.");
  h += `</div>`;
  $("#cview").innerHTML = h;
  document.querySelectorAll("[data-fa]").forEach(b => b.onclick = () => { fAvi = b.dataset.fa; vAvi(); });
}
async function contarAvisos() {
  try { CG.avisos = await rpc("cong_avisos", {}); const ult = LS.get("crabs_avisos_vistos") || ""; return CG.avisos.filter(a => a.t > ult).length; } catch (e) { return 0; }
}

/* ================= TARJETA S-21 (Registro de publicador de la congregación) ================= */
let _pdflib = null;
function cargarPdfLib() {
  if (window.PDFLib) return Promise.resolve(window.PDFLib);
  if (_pdflib) return _pdflib;
  _pdflib = new Promise((ok, no) => { const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"; s.onload = () => ok(window.PDFLib); s.onerror = () => { _pdflib = null; no(new Error("No se pudo cargar el generador de PDF. Revisa tu conexión.")); }; document.head.appendChild(s); });
  return _pdflib;
}
const anioServicio = ym => { const [y, m] = ym.split("-").map(Number); return m >= 9 ? y + 1 : y; };
const mesesServicio = a => [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8].map(m => `${m >= 9 ? a - 1 : a}-${String(m).padStart(2, "0")}`);
const MESES_S21 = ["Septiembre", "Octubre", "Noviembre", "Diciembre", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto"];
function fechaS21(f) { f = String(f || "").trim(); const m = f.match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${m[1]}/${m[2]}/${m[3]}` : f; }
async function paginaS21(pdf, F, p, anio, infs) {
  const { rgb } = window.PDFLib;
  const pg = pdf.addPage([595.2, 841.9]); const H = 841.9, K = rgb(0, 0, 0);
  const y = t => H - t;
  const txt = (s, x, t, o = {}) => { s = String(s ?? ""); if (!s) return; const f = o.f || F.reg; let size = o.size || 10; if (o.max) while (size > 5 && f.widthOfTextAtSize(s, size) > o.max) size -= 0.25; const w = f.widthOfTextAtSize(s, size); const xx = o.align === "center" ? x - w / 2 : o.align === "right" ? x - w : x; pg.drawText(s, { x: xx, y: y(t), size, font: f, color: K }); };
  const caja = (x, t, chk, s = 8.6) => { pg.drawRectangle({ x, y: y(t) - s, width: s, height: s, borderColor: K, borderWidth: 0.7 }); if (chk) pg.drawSvgPath(`M ${s*0.18} ${s*0.52} L ${s*0.42} ${s*0.78} L ${s*0.86} ${s*0.16}`, { x, y: y(t), borderColor: K, borderWidth: s * 0.16 }); };
  const linea = (x1, t1, x2, t2, w = 0.6) => pg.drawLine({ start: { x: x1, y: y(t1) }, end: { x: x2, y: y(t2) }, thickness: w, color: K });
  // Encabezado
  const tit = "REGISTRO DE PUBLICADOR DE LA CONGREGACIÓN"; const ts = 350 / F.bold.widthOfTextAtSize(tit, 1);
  txt(tit, 297.6, 53.6, { f: F.bold, size: ts, align: "center" });
  txt("Nombre:", 17, 77.6, { f: F.bold, size: 10.2 }); txt(String(p.nombre || "").toUpperCase(), 17 + F.bold.widthOfTextAtSize("Nombre: ", 10.2), 76.4, { size: 11.5 });
  txt("Fecha de nacimiento:", 17, 93.6, { f: F.bold, size: 10.2 }); txt(fechaS21(p.nacimiento), 17 + F.bold.widthOfTextAtSize("Fecha de nacimiento: ", 10.2), 92.4, { size: 11.5 });
  txt("Fecha de bautismo:", 17, 109.6, { f: F.bold, size: 10.2 }); txt(fechaS21(p.bautismo), 17 + F.bold.widthOfTextAtSize("Fecha de bautismo: ", 10.2), 108.4, { size: 11.5 });
  const bautizado = p.privilegio !== "no_bautizado";
  caja(385, 85.5, p.sexo === "H"); txt("Hombre", 397, 93.6, { f: F.bold, size: 10.2 });
  caja(486, 85.5, p.sexo === "M"); txt("Mujer", 498.5, 93.6, { f: F.bold, size: 10.2 });
  caja(385, 101.5, bautizado && !p.ungido); txt("Otras ovejas", 397, 109.6, { f: F.bold, size: 10.2 });
  caja(486, 101.5, bautizado && !!p.ungido); txt("Ungido", 498.5, 109.6, { f: F.bold, size: 10.2 });
  [[17.5, "Anciano", p.privilegio === "anciano"], [81, "Siervo ministerial", p.privilegio === "siervo"], [202, "Precursor regular", p.precursor === "regular"], [327, "Precursor especial", p.precursor === "especial"], [453, "Misionero que sirve", p.precursor === "misionero"]]
    .forEach(([x, l, c]) => { caja(x, 117.5, c); txt(l, x + 12.4, 125.6, { f: F.bold, size: 10.2 }); });
  txt("en el campo", 465.4, 138.4, { f: F.bold, size: 10.2 });
  // Tabla
  const X = [17, 101, 172, 242.5, 313, 412, 577], T0 = 144.5, T1 = 199.5, RH = (438 - 199.5) / 12;
  linea(X[0], T0, X[6], T0, 1.1); linea(X[0], 438, X[6], 438, 1.1); linea(X[0], T1, X[6], T1, 0.6);
  X.forEach((x, i) => linea(x, T0, x, 438, i === 0 || i === 6 ? 1.1 : 0.6));
  for (let i = 1; i < 12; i++) linea(X[0], T1 + RH * i, X[6], T1 + RH * i, 0.6);
  const c = i => (X[i] + X[i + 1]) / 2;
  txt("Año de servicio", c(0), 167, { f: F.bold, size: 9.6, align: "center" }); txt(String(anio), c(0), 185.5, { size: 11.5, align: "center" });
  ["Participación", "en el", "ministerio"].forEach((s, k) => txt(s, c(1), 160.5 + k * 11.6, { f: F.bold, size: 9.6, align: "center" }));
  ["Cursos", "bíblicos"].forEach((s, k) => txt(s, c(2), 169.5 + k * 11.6, { f: F.bold, size: 9.6, align: "center" }));
  ["Precursor", "auxiliar"].forEach((s, k) => txt(s, c(3), 169.5 + k * 11.6, { f: F.bold, size: 9.6, align: "center" }));
  txt("Horas", c(4), 157.5, { f: F.bold, size: 9.6, align: "center" });
  ["(Si es precursor o", "misionero que", "sirve en el campo)"].forEach((s, k) => txt(s, c(4), 169.5 + k * 12.2, { size: 9.6, align: "center" }));
  txt("Notas", c(5), 175.5, { f: F.bold, size: 9.6, align: "center" });
  let total = 0; const conHoras = ["regular", "especial", "misionero"].includes(p.precursor);
  mesesServicio(anio).forEach((ym, i) => {
    const t = T1 + RH * i, base = t + 13.6; const d = infs[ym] || {};
    txt(MESES_S21[i], 21, base, { size: 10.2 });
    caja(c(1) - 4.9, t + 5.4, d.participo === true, 9.8);
    if (d.cursos) txt(String(d.cursos), c(2), base, { size: 11.5, align: "center" });
    caja(c(3) - 4.9, t + 5.4, !!d.aux, 9.8);
    if (d.horas != null && d.horas !== "" && (conHoras || d.aux)) { txt(String(d.horas), c(4), base, { size: 11.5, align: "center" }); total += +d.horas || 0; }
    if (d.nota) txt(d.nota, X[5] + 4, base - 0.5, { size: 8.5, max: X[6] - X[5] - 8 });
  });
  // Total
  linea(X[4], 438, X[4], 457.5, 1.1); linea(X[4], 457.5, X[6], 457.5, 1.1); linea(X[6], 438, X[6], 457.5, 1.1); linea(X[5], 438, X[5], 457.5, 1.1);
  txt("Total", X[4] - 6, 452, { f: F.bold, size: 9.6, align: "right" });
  if (total) txt(String(total), c(4), 452.4, { size: 11.5, align: "center" });
  txt("S-21-S    11/23", 17, 799, { size: 6.8 });
}
async function exportarS21(personas, anio, nombreArchivo) {
  if (!personas.length) { toast("No hay publicadores para exportar"); return; }
  document.body.classList.add("loading");
  try {
    await cCargar(); const L = await cargarPdfLib();
    const pdf = await L.PDFDocument.create(); pdf.setTitle(nombreArchivo); pdf.setAuthor("CRABS · Congregación Tierra Baja");
    const F = { reg: await pdf.embedFont(L.StandardFonts.Helvetica), bold: await pdf.embedFont(L.StandardFonts.HelveticaBold), zapf: await pdf.embedFont(L.StandardFonts.ZapfDingbats) };
    const meses = mesesServicio(anio);
    for (const p of personas) {
      const infs = {}; R("informe").filter(r => r.d.persona === p.id && meses.includes(r.d.mes || r.k.split("|")[0])).forEach(r => infs[r.d.mes || r.k.split("|")[0]] = r.d);
      await paginaS21(pdf, F, p, anio, infs);
    }
    const bytes = await pdf.save(); const nombre = nombreArchivo.normalize("NFD").replace(/[̀-ͯ]/g, "") + ".pdf";
    const blob = new Blob([bytes], { type: "application/pdf" });
    await entregar(blob, nombre, personas.length > 1 ? `${personas.length} tarjetas listas` : "Tarjeta lista");
  } catch (e) { toast(e.message); }
  finally { document.body.classList.remove("loading"); }
}

/* ================= Buscador en las listas de hermanos ================= */
// Cualquier lista larga (más de 10 opciones) se abre como una hoja con buscador en vez del selector del teléfono.
function abrirBuscador(sel) {
  if (sel.disabled) return;
  const items = []; let grupo = "";
  [...sel.children].forEach(n => { if (n.tagName === "OPTGROUP") [...n.children].forEach(o => items.push({ v: o.value, t: o.textContent, g: n.label })); else items.push({ v: n.value, t: n.textContent, g: "" }); });
  const lab = (sel.closest(".cf,.vsala,.vhead,.card") || {}).querySelector?.(".flab,span")?.textContent || "Escoger";
  const bg = document.createElement("div"); bg.className = "bus-bg";
  bg.innerHTML = `<div class="bus" role="dialog"><div class="bus-h"><input type="search" id="busQ" placeholder="Buscar hermano…" autocomplete="off" autocorrect="off" autocapitalize="off"><button class="x" aria-label="Cerrar">✕</button></div><div class="bus-l" id="busL"></div></div>`;
  document.body.appendChild(bg);
  const L = bg.querySelector("#busL"), Q = bg.querySelector("#busQ");
  const cerrar = () => bg.remove();
  const pinta = () => {
    const q = norm(Q.value.trim()); let html = "", g0 = null;
    const lista = items.filter(it => !q || norm(it.t).includes(q) || it.v === "");
    lista.forEach(it => { if (it.g !== g0) { g0 = it.g; if (it.g) html += `<div class="bus-g">${esc(it.g)}</div>`; }
      const [n, extra] = it.t.split(" · ");
      html += `<button class="bus-i ${it.v === sel.value ? "on" : ""}" data-v="${esc(it.v)}"><span>${esc(n)}</span>${extra ? `<small>${esc(extra)}</small>` : ""}${it.v === sel.value ? "<b>✓</b>" : ""}</button>`; });
    L.innerHTML = html || `<div class="note" style="padding:16px">No hay nadie con ese nombre</div>`;
    L.querySelectorAll("[data-v]").forEach(b => b.onclick = () => { sel.value = b.dataset.v; sel.dispatchEvent(new Event("change", { bubbles: true })); cerrar(); });
  };
  Q.oninput = pinta; pinta();
  bg.querySelector(".x").onclick = cerrar; bg.onclick = e => { if (e.target === bg) cerrar(); };
  setTimeout(() => Q.focus(), 60);
}
(() => {
  const larga = t => { const s = t && t.closest && t.closest("select.csel"); return s && s.options.length > 10 ? s : null; };
  let x0 = 0, y0 = 0;
  document.addEventListener("touchstart", e => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; }, { passive: true, capture: true });
  document.addEventListener("touchend", e => { const s = larga(e.target); if (!s) return; const t = e.changedTouches[0]; if (Math.abs(t.clientX - x0) > 10 || Math.abs(t.clientY - y0) > 10) return; e.preventDefault(); s.blur(); abrirBuscador(s); }, { capture: true });
  document.addEventListener("mousedown", e => { const s = larga(e.target); if (!s) return; e.preventDefault(); abrirBuscador(s); }, true);
  document.addEventListener("keydown", e => { const s = larga(e.target); if (s && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); abrirBuscador(s); } }, true);
})();

/* ================= MAPA DE TERRITORIOS (Leaflet + satélite) ================= */
const TB_CENTRO = [10.5125, -75.4690];
let _lf = null;
function cargarLeaflet() {
  if (window.L && window.L.map) return Promise.resolve(window.L);
  if (_lf) return _lf;
  _lf = new Promise((ok, no) => {
    const c = document.createElement("link"); c.rel = "stylesheet"; c.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.appendChild(c);
    const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"; s.onload = () => ok(window.L); s.onerror = () => { _lf = null; no(new Error("No se pudo cargar el mapa. Revisa tu conexión.")); }; document.head.appendChild(s);
  });
  return _lf;
}
function capas(L, map) {
  const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 20, maxNativeZoom: 19, attribution: "Esri" });
  const calles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 20, maxNativeZoom: 19, attribution: "© OpenStreetMap" });
  sat.addTo(map); L.control.layers({ "Satélite": sat, "Calles": calles }, {}, { position: "topright" }).addTo(map);
}
const centroDe = a => { if (!a || !a.length) return null; const s = a.reduce((x, p) => [x[0] + p[0], x[1] + p[1]], [0, 0]); return [s[0] / a.length, s[1] / a.length]; };
const coordsDeTexto = t => { const m = String(t || "").match(/(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/) || String(t || "").match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || String(t || "").match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/); return m ? [+m[1], +m[2]] : null; };
const colorTerr = u => { if (!u) return "#E5484D"; const m = dias(u, HOY) / 30.44; return m < 2 ? "#30A46C" : m < 4 ? "#F5A524" : "#E5484D"; };
async function mapaTerritorio(box, d, editable, onCambio) {
  const L = await cargarLeaflet();
  box.innerHTML = ""; const map = L.map(box, { zoomControl: true, attributionControl: true, maxZoom: 20 });
  capas(L, map);
  let manz = (d.manzanas && d.manzanas.length ? d.manzanas : (d.area && d.area.length ? [d.area] : [])).map(a => a.map(p => [+p[0], +p[1]])); let act = -1;
  let area = []; let refs = (d.refs || []).map(r => ({ ...r }));
  let calles = (d.calles || []).map(c => c.map(p => [+p[0], +p[1]])); let calleAct = -1;
  const capa = L.layerGroup().addTo(map); let modo = null;
  const sync = () => { area = act >= 0 && manz[act] ? manz[act] : []; };
  const todas = () => manz.filter(a => a.length >= 3);
  const avisa = () => onCambio && onCambio(manz, refs, calles, modo, act);
  const icono = (cls, html) => L.divIcon({ className: cls, html: html || "", iconSize: null });
  const pinta = () => {
    capa.clearLayers();
    sync();
    manz.forEach((a, k) => { const sel = modo === "area" && k === act;
      if (a.length >= 3) { const pg = L.polygon(a, { color: sel ? "#3138e0" : "#22C55E", weight: sel ? 3.5 : 3, fillColor: sel ? "#3138e0" : "#22C55E", fillOpacity: .18, interactive: modo === "area" }).addTo(capa);
        if (modo === "area") pg.on("click", e => { L.DomEvent.stop(e); act = k; pinta(); avisa(); });
        if (!modo) pg.bindTooltip(String(k + 1), { permanent: true, direction: "center", className: "tlab" }); }
      else if (a.length) L.polyline(a, { color: "#3138e0", weight: 3, dashArray: "6 6", interactive: false }).addTo(capa); });
    calles.forEach((c, k) => { if (c.length >= 2) { L.polyline(c, { color: "#111", weight: 11, opacity: .35, interactive: false }).addTo(capa); L.polyline(c, { color: "#FFD200", weight: 7, opacity: .95, interactive: false }).addTo(capa); }
      if (modo === "calle") c.forEach(pt => L.circleMarker(pt, { radius: k === calleAct ? 5 : 3, color: "#111", weight: 1.5, fillColor: "#FFD200", fillOpacity: 1, interactive: false }).addTo(capa)); });
    if (modo === "area") {
      area.forEach((pt, k) => { const m = L.marker(pt, { draggable: true, icon: icono("tvx", `<i>${k + 1}</i>`) }).addTo(capa);
        m.on("dragend", e => { const ll = e.target.getLatLng(); manz[act][k] = [+ll.lat.toFixed(6), +ll.lng.toFixed(6)]; pinta(); avisa(); }); });
      if (area.length >= 2) area.forEach((pt, k) => { if (k === area.length - 1 && area.length < 3) return; const q = area[(k + 1) % area.length];
        const mid = L.marker([(pt[0] + q[0]) / 2, (pt[1] + q[1]) / 2], { icon: icono("tmid", "<i>+</i>") }).addTo(capa);
        mid.on("click", e => { L.DomEvent.stop(e); manz[act].splice(k + 1, 0, [+((pt[0] + q[0]) / 2).toFixed(6), +((pt[1] + q[1]) / 2).toFixed(6)]); pinta(); avisa(); }); });
    }
    refs.forEach((r, i) => { const m = L.marker([r.lat, r.lng], { icon: icono("tref", `<span>📍 ${esc(r.t)}</span>`) }).addTo(capa);
      if (editable) m.on("click", e => { if (modo === "ref") { L.DomEvent.stop(e); if (confirm(`¿Quitar "${r.t}"?`)) { refs.splice(i, 1); pinta(); avisa(); } } }); });
  };
  const todosPts = () => manz.flat().concat(calles.flat());
  const c = centroDe(todosPts()) || (refs[0] ? [refs[0].lat, refs[0].lng] : TB_CENTRO);
  if (todosPts().length >= 3) map.fitBounds(L.latLngBounds(todosPts()), { padding: [24, 24] }); else map.setView(c, todosPts().length || refs.length ? 18 : 16);
  pinta(); setTimeout(() => map.invalidateSize(), 250);
  map.on("click", e => {
    const pt = [+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6)];
    if (modo === "area") { if (act < 0 || !manz[act]) { manz.push([]); act = manz.length - 1; } manz[act].push(pt); pinta(); avisa(); }
    else if (modo === "calle") { if (calleAct < 0 || !calles[calleAct]) { calles.push([]); calleAct = calles.length - 1; } calles[calleAct].push(pt); pinta(); avisa(); }
    else if (modo === "ref") { const t = (window.prompt("¿Qué hay aquí? (ej. Familia Lopera)") || "").trim(); if (t) { refs.push({ lat: pt[0], lng: pt[1], t }); pinta(); avisa(); } }
  });
  return {
    map, modo: m => { modo = m; if (m === "calle") calleAct = -1; if (m === "area") act = -1; box.classList.toggle("dibujando", !!m); pinta(); avisa(); },
    nuevaCalle: () => { calleAct = -1; pinta(); avisa(); },
    nuevaManzana: () => { manz = manz.filter(a => a.length); act = -1; pinta(); avisa(); },
    borrarManzana: () => { if (act >= 0) { manz.splice(act, 1); act = -1; } pinta(); avisa(); },
    deshacer: () => { if (modo === "calle") { const cc = calles[calleAct]; if (cc && cc.length) cc.pop(); else if (calles.length) { calles.pop(); calleAct = calles.length - 1; } calles = calles.filter((x, k) => x.length || k === calleAct); } else if (act >= 0 && manz[act]) { manz[act].pop(); if (!manz[act].length) { manz.splice(act, 1); act = -1; } } pinta(); avisa(); },
    limpiar: () => { if (modo === "calle") { calles = []; calleAct = -1; } else { manz = []; act = -1; } pinta(); avisa(); },
    ir: (ll, z) => map.setView(ll, z || 18),
    datos: () => { const ms = todas(); const pts = ms.flat(); return { manzanas: ms, area: ms[0] || [], refs, calles: calles.filter(x => x.length >= 2), centro: centroDe(pts) || (refs[0] ? [refs[0].lat, refs[0].lng] : null) }; }
  };
}
const tieneMapa = t => (t.d.manzanas || []).length || (t.d.area || []).length >= 3;
async function miniMapas(ts) {
  const cajas = [...document.querySelectorAll("[data-mini]")]; if (!cajas.length) return;
  let L; try { L = await cargarLeaflet(); } catch (e) { return; }
  const con = ts.filter(tieneMapa); const colorDe = id => PALETA_T[Math.max(0, con.findIndex(x => x.id === id)) % PALETA_T.length];
  cajas.forEach(box => { const t = ts.find(x => x.id === box.dataset.mini); if (!t || box._m) return;
    const m = L.map(box, { zoomControl: false, attributionControl: false, dragging: false, touchZoom: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, tap: false });
    box._m = m;
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 20, maxNativeZoom: 19 }).addTo(m);
    const col = colorDe(t.id);
    const pg = L.polygon((t.d.manzanas && t.d.manzanas.length ? t.d.manzanas : [t.d.area]).map(a => [a]), { color: col, weight: 2.5, fillColor: col, fillOpacity: .35, interactive: false }).addTo(m);
    (t.d.calles || []).forEach(c => L.polyline(c, { color: "#FFD200", weight: 3, interactive: false }).addTo(m));
    m.fitBounds(pg.getBounds(), { padding: [8, 8] }); setTimeout(() => { m.invalidateSize(); m.fitBounds(pg.getBounds(), { padding: [8, 8] }); }, 200);
  });
}
const PALETA_T = ["#2563EB", "#16A34A", "#9333EA", "#F59E0B", "#0891B2", "#DB2777", "#65A30D", "#7C3AED", "#0D9488", "#EA580C", "#4F46E5", "#CA8A04"];
let modoColorT = "terr";
async function mapaGeneral(box, ts, ultima) {
  const L = await cargarLeaflet();
  box.innerHTML = ""; const map = L.map(box, { zoomControl: true }); capas(L, map);
  const g = L.featureGroup().addTo(map);
  const con = ts.filter(t => (t.d.manzanas || []).length || (t.d.area || []).length >= 3);
  const leyenda = [];
  con.forEach((t, k) => {
    const est = colorTerr(ultima(t.id)); const col = modoColorT === "terr" ? PALETA_T[k % PALETA_T.length] : est;
    const pol = L.polygon((t.d.manzanas && t.d.manzanas.length ? t.d.manzanas : [t.d.area]).map(a => [a]), { color: col, weight: 3, fillColor: col, fillOpacity: .35 }).addTo(g);
    pol.bindTooltip(`<i class="dot" style="background:${est}"></i>${t.d.numero ? t.d.numero + " · " : ""}${esc(t.d.nombre)}`, { permanent: true, direction: "center", className: "tlab" });
    pol.on("click", () => fichaTerr(t));
    (t.d.calles || []).forEach(c => L.polyline(c, { color: "#FFD200", weight: 4, opacity: .9, interactive: false }).addTo(g));
    leyenda.push({ t, col, est });
  });
  if (g.getLayers().length) map.fitBounds(g.getBounds(), { padding: [16, 16] }); else map.setView(TB_CENTRO, 15);
  setTimeout(() => map.invalidateSize(), 250);
  return leyenda;
}


/* ================= ESTADÍSTICAS DE PREDICACIÓN ================= */
function barras(items, opt = {}) {
  const max = Math.max(1, ...items.map(x => x.v), ...(items.map(x => x.v2 || 0)));
  return `<div class="sbars">${items.map(x => `<div class="sbar"><span class="sl">${x.l}</span><div class="st"><i style="width:${Math.max(x.v ? 4 : 0, x.v / max * 100)}%;background:${x.c || "var(--accent)"}"></i>${x.v2 != null ? `<i class="b2" style="width:${x.v2 / max * 100}%"></i>` : ""}</div><b>${x.txt != null ? x.txt : x.v}</b></div>`).join("")}</div>`;
}
function columnas(items, leyenda) {
  const max = Math.max(1, ...items.flatMap(x => [x.a, x.b || 0]));
  return `<div class="scols">${items.map(x => `<div class="scol"><div class="sc"><i class="ca" style="height:${x.a / max * 100}%" title="${x.a}"><em>${x.a || ""}</em></i>${x.b != null ? `<i class="cb" style="height:${x.b / max * 100}%"><em>${x.b || ""}</em></i>` : ""}</div><span>${x.l}</span></div>`).join("")}</div>${leyenda || ""}`;
}
function vStats() {
  const ms = mesSelector(vStats);
  const ym = CG.mes; const meses = [-5, -4, -3, -2, -1, 0].map(n => mesMas(ym, n));
  const vis = R("terr_visita"); const ts = R("territorio");
  const delMes = m => salidasDelMes(m);
  const hechasMes = m => delMes(m).filter(x => visitaDe(x.f, x.r.id)).length;
  const prog = delMes(ym), hechas = prog.filter(x => visitaDe(x.f, x.r.id)), pasadas = prog.filter(x => x.f < HOY);
  const terrMes = new Set(vis.filter(v => v.k.startsWith(ym) && v.d.territorio && R("territorio").find(t => t.id === v.d.territorio)).map(v => v.d.territorio));
  const hace4 = mesMas(ym, -3) + "-01";
  const cubiertos = ts.filter(t => vis.some(v => v.d.territorio === t.id && v.k >= hace4 && v.k <= ym + "-31"));
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  let h = tabs(SEC.pred.tabs) + ms.html;
  h += `<div class="kpis">${[[`${hechas.length}/${pasadas.length || prog.length}`, "Salidas realizadas"], [`${pct(hechas.length, pasadas.length)}%`, "Cumplimiento"], [`${terrMes.size}`, "Territorios este mes"], [`${pct(cubiertos.length, ts.length)}%`, "Cubierto en 4 meses"]].map(([n, l]) => `<div class="kpi"><span class="n">${n}</span><span class="l">${l}</span></div>`).join("")}</div>`;
  if (!vis.length) h += `<div class="card note" style="margin-top:10px">Las gráficas se llenan solas a medida que los capitanes toquen <b>Marcar</b> en cada salida realizada (en <b>Horario</b> → Próximas salidas). Por ahora muestro lo programado.</div>`;
  // 1. Salidas programadas vs realizadas, últimos 6 meses
  h += `<div class="label">Salidas por mes</div><div class="card spad">${columnas(meses.map(m => ({ l: MES[+m.slice(5) - 1].slice(0, 3), a: delMes(m).length, b: hechasMes(m) })), `<div class="sleg"><span><i class="ca"></i>Programadas</span><span><i class="cb"></i>Realizadas</span></div>`)}</div>`;
  // 2. Por día de la semana (mes)
  h += `<div class="label">Salidas por día · ${MES[+ym.slice(5) - 1]}</div><div class="card spad">${barras([1, 2, 3, 4, 5, 6, 7].map(dd => { const p = prog.filter(x => isoDia(x.f) === dd); return { l: DIAS[dd].slice(0, 3), v: p.length, v2: p.filter(x => visitaDe(x.f, x.r.id)).length, c: "#" + COLOR_DIA[dd], txt: `${p.filter(x => visitaDe(x.f, x.r.id)).length}/${p.length}` }; }))}<div class="note" style="margin-top:6px">Barra de color: programadas · franja oscura: realizadas</div></div>`;
  // 3. Top capitanes (año de servicio) por salidas realizadas
  const aS = anioServicio(ym), ini = `${aS - 1}-09-01`, fin = `${aS}-08-31`;
  const visA = vis.filter(v => v.k >= ini && v.k <= fin);
  const capCount = {}; prog.forEach(x => { const c = x.r.d.capitan; if (c) capCount[c] = capCount[c] || { p: 0, h: 0 }; if (c) capCount[c].p++; });
  visA.forEach(v => { const c = v.d.capitan; if (!c) return; capCount[c] = capCount[c] || { p: 0, h: 0 }; capCount[c].h++; });
  const topCap = Object.entries(capCount).sort((a, b) => b[1].h - a[1].h || b[1].p - a[1].p).slice(0, 8);
  h += `<div class="label">Capitanes · año de servicio ${aS}</div><div class="card spad">${topCap.length ? barras(topCap.map(([id, x], i) => ({ l: `${i < 3 ? ["🥇", "🥈", "🥉"][i] + " " : ""}${esc(nomCorto(id))}`, v: x.h, txt: `${x.h} hecha${x.h === 1 ? "" : "s"} · ${x.p} este mes` }))) : `<div class="note">Sin capitanes asignados.</div>`}</div>`;
  // 4. Territorios: más trabajados y los que llevan más tiempo sin trabajar
  const ult = id => vis.filter(v => v.d.territorio === id).map(v => v.k).sort().pop();
  const cuenta = id => visA.filter(v => v.d.territorio === id).length;
  const mas = ts.map(t => ({ t, n: cuenta(t.id) })).filter(x => x.n).sort((a, b) => b.n - a.n).slice(0, 6);
  const olvid = ts.map(t => ({ t, u: ult(t.id) })).sort((a, b) => (a.u || "") < (b.u || "") ? -1 : 1).slice(0, 6);
  h += `<div class="label">Territorios más trabajados · ${aS}</div><div class="card spad">${mas.length ? barras(mas.map(x => ({ l: esc((x.t.d.numero ? x.t.d.numero + " · " : "") + x.t.d.nombre), v: x.n, c: "#30A46C", txt: `${x.n} ${x.n === 1 ? "vez" : "veces"}` }))) : `<div class="note">Todavía no hay salidas marcadas en territorios.</div>`}</div>`;
  h += `<div class="label">Necesitan atención (más tiempo sin trabajar)</div><div class="card spad">${olvid.map(x => { const m = x.u ? Math.floor(dias(x.u, HOY) / 30.44) : null; return `<div class="vrow"><span>${esc((x.t.d.numero ? x.t.d.numero + " · " : "") + x.t.d.nombre)}</span><span class="pill ${!x.u || m >= 4 ? "t-bad" : m >= 2 ? "t-warn" : "t-ok"}">${x.u ? (m ? `hace ${m} ${m === 1 ? "mes" : "meses"}` : "este mes") : "nunca"}</span></div>`; }).join("")}</div>`;
  // 5. Modalidades del mes
  const mod = {}; prog.forEach(x => { const t = x.r.d.territorio; const k = R("territorio").find(r => r.id === t) ? "Casa en casa (territorio)" : (t || "Sin definir"); mod[k] = (mod[k] || 0) + 1; });
  h += `<div class="label">Tipo de predicación · ${MES[+ym.slice(5) - 1]}</div><div class="card spad">${barras(Object.entries(mod).sort((a, b) => b[1] - a[1]).map(([k, v], i) => ({ l: esc(k), v, c: PALETA_T[i % PALETA_T.length] })))}</div>`;
  // 6. Informes (solo admins): participación últimos 6 meses
  if (cAdmin()) {
    const inf = R("informe"); const tot = CG.personas.length;
    const partMes = m => inf.filter(r => r.k.startsWith(m + "|") && r.d.participo).length;
    if (inf.length) h += `<div class="label">Participación en el ministerio (informes)</div><div class="card spad">${columnas(meses.map(m => ({ l: MES[+m.slice(5) - 1].slice(0, 3), a: tot, b: partMes(m) })), `<div class="sleg"><span><i class="ca"></i>Publicadores</span><span><i class="cb"></i>Participaron</span></div>`)}</div>`;
  }
  $("#cview").innerHTML = h; ms.bind(); bindTabs();
}


/* ================= PERMISOS POR PERFIL (solo super administrador) ================= */
const SECS_PERM = [["disc", "Discursos públicos"], ["reu", "Reuniones"], ["pred", "Predicación"], ["rec", "Recordatorios"], ["inf", "Informes"], ["pub", "Publicadores"]];
async function pintaRespaldos() {
  const box = $("#respBox"); if (!box) return;
  let l = []; try { l = await rpc("cong_respaldos", {}); } catch (e) { box.innerHTML = `<p class="note">${esc(e.message)}</p>`; return; }
  const fh = t => new Date(t).toLocaleString("es-CO", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
  box.innerHTML = `<p class="note" style="margin:0 0 10px">Cada domingo de madrugada se guarda una copia de toda la información (sin los PIN). Se conservan las últimas 12.</p>
    ${l.map(x => `<div class="pend"><span><b>${fh(x.creado)}</b><small>${x.tipo === "auto" ? "Automático" : x.tipo === "manual" ? "Hecho a mano" : "Inicial"} · ${x.kb} KB</small></span><button class="btn line sm" data-rb="${x.id}">⬇ Bajar</button></div>`).join("") || `<p class="note">Aún no hay respaldos.</p>`}
    <button class="btn line" style="width:100%;margin-top:10px" id="respYa">Hacer un respaldo ahora</button>`;
  box.querySelectorAll("[data-rb]").forEach(b => b.onclick = async () => { try { const d = await rpc("cong_respaldo_bajar", { p_id: +b.dataset.rb });
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 1)], { type: "application/json" })); a.download = `Respaldo CRABS ${String(d.fecha || "").slice(0, 10)}.json`; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 2000); } catch (e) { toast(e.message); } });
  $("#respYa").onclick = async () => { try { await rpc("cong_respaldo_ahora", {}); toast("Respaldo hecho"); pintaRespaldos(); } catch (e) { toast(e.message); } };
}
function vPermisos() {
  const P0 = PERM || PERM_BASE;
  const fila = ([id, n]) => `<div class="prm"><span>${n}</span>${["admin", "consulta"].map(r => { const bloq = r === "consulta" && id === "inf"; const on = !bloq && (P0[r] || PERM_BASE[r]).includes(id);
    return `<label class="tg ${bloq ? "off" : ""}" title="${bloq ? "Los informes son confidenciales: solo administradores" : ""}"><input type="checkbox" data-pr="${r}" data-ps="${id}" ${on ? "checked" : ""} ${bloq ? "disabled" : ""}><i></i></label>`; }).join("")}</div>`;
  return `<div class="label" style="margin-top:22px">Qué ve cada perfil</div><div class="card spad">
    <div class="prm hd"><span>Sección</span><b>Admin</b><b>Consulta</b></div>${SECS_PERM.map(fila).join("")}
    <div class="prm hd" style="margin-top:16px"><span>Mi espacio del publicador</span><b></b><b>Publicador</b></div>
    ${[["asig", "Mis asignaciones"], ["semana", "Discurso y lectura de la semana"], ["pred", "Predicación de los próximos 7 días"], ["rec", "Aseo y eventos"], ["inf", "Mi informe"]].map(([k, n]) => `<div class="prm"><span>${n}</span><span></span><label class="tg"><input type="checkbox" data-pr="publicador" data-ps="${k}" ${((PERM && PERM.publicador) || ["asig", "semana", "pred", "rec", "inf"]).includes(k) ? "checked" : ""}><i></i></label></div>`).join("")}
    <p class="note" style="margin:10px 2px">Tú, como super administrador, siempre ves todo. Consulta nunca puede editar ni ver informes, teléfonos o notas, aunque le actives la sección.</p>
    <button class="btn pri" id="prmOk" style="width:100%">Guardar permisos</button></div>`;
}
function bindPermisos() {
  const b = document.querySelector("#prmOk"); if (!b) return;
  b.onclick = async () => {
    const d = { admin: [], consulta: [], publicador: [] };
    document.querySelectorAll("[data-pr]").forEach(c => { if (c.checked) d[c.dataset.pr].push(c.dataset.ps); });
    if (!d.admin.length) { toast("Deja al menos una sección para los administradores"); return; }
    try { document.body.classList.add("loading"); await rpc("cong_permisos_guardar", { p_d: d }); PERM = d; toast("Permisos guardados. Cada uno los verá al volver a abrir la app."); }
    catch (e) { toast(e.message); } finally { document.body.classList.remove("loading"); }
  };
}

/* ================= MI ESPACIO (perfil Publicador) ================= */
let MIE = { mesInf: null };
const permPub = k => { const l = (PERM && PERM.publicador) || ["asig", "semana", "pred", "rec", "inf"]; return l.includes(k); };
async function abrirMiEspacio() {
  $("#login").hidden = true; $("#hub").hidden = true; $("#app").hidden = true; $("#fab").hidden = true; $("#cong").hidden = false;
  $("#cBack").hidden = true; $("#cBell").hidden = true;
  $("#ctit").textContent = "Mi espacio"; $("#csub").textContent = "Cargando…";
  $("#cview").innerHTML = `<div class="note" style="padding:30px;text-align:center">Cargando tu información…</div>`;
  try { const d = await rpc("pub_data", {}); CG.me = { ...d.me, rol: "publicador" }; CG.personas = d.personas || []; CG.reg = d.reg || []; }
  catch (e) { $("#cview").innerHTML = `<div class="card note" style="padding:20px">${esc(e.message)}</div><button class="btn line" style="width:100%;margin-top:12px" onclick="salir()">Salir</button>`; return; }
  vMiEspacio();
}
function misAsignaciones(desde, hasta) {
  const yo = CG.me.persona, out = [];
  const add = (f, que, det, ico) => { if (f >= desde && f <= hasta) out.push({ f, que, det, ico }); };
  const P2 = id => nomCorto(id);
  R("vmc").forEach(r => { const d = r.d; if (!d || !d.t1 || sinReunion(d)) return; const f = sumDias(r.k, 3); const V = "Vida y Ministerio";
    const s = (id, txt, det) => { if (id === yo) add(f, txt, det || V, "📖"); };
    s(d.oracion1, "Oración inicial"); s(d.intro, "Presidente de la reunión");
    s(d.t1.p, `Discurso: «${d.t1.titulo}»`, "Tesoros de la Biblia · 10 min"); s(d.t2.p, "Busquemos perlas escondidas", "Tesoros de la Biblia · 10 min");
    s(d.lect.p, `Lectura de la Biblia · ${d.lect.cita || ""}`, "Sala principal"); s(d.lect.a, `Lectura de la Biblia · ${d.lect.cita || ""}`, "Sala auxiliar"); s(d.consejero, "Consejero de la sala auxiliar");
    (d.maestros || []).forEach((m, i) => { const t = `${4 + i}. ${m.titulo}${m.ref ? " " + m.ref : ""}`;
      s(m.p, t, `Sala principal${m.pa ? " · ayudante: " + P2(m.pa) : ""}`); s(m.pa, `Ayudante en: ${t}`, `Sala principal · con ${P2(m.p)}`);
      s(m.a, t, `Sala auxiliar${m.aa ? " · ayudante: " + P2(m.aa) : ""}`); s(m.aa, `Ayudante en: ${t}`, `Sala auxiliar · con ${P2(m.a)}`); });
    (d.vida || []).forEach((v, i) => { if (!v.video) s(v.p, `${4 + (d.maestros || []).length + i}. ${v.titulo}`, `Nuestra vida cristiana · ${v.min || 15} min`); });
    s(d.estudio.p, "Conductor del estudio bíblico de la congregación"); s(d.estudio.lector, "Lector del estudio bíblico"); s(d.oracion2, "Oración final");
  });
  R("acomod").forEach(r => { const d = r.d; const reu = d.reunion === "entre" ? "Reunión de entre semana" : `Reunión del sábado · ${HOR[d.reunion] || ""}`;
    if (d.presidente === yo) add(r.k, "Presidente de la reunión pública", reu, "🎤"); if (d.lector === yo) add(r.k, "Lector de La Atalaya", reu, "📘");
    if (d.acomodador === yo) add(r.k, "Acomodador", reu, "🙋"); if ((d.microfonos || []).includes(yo)) add(r.k, "Micrófonos", reu, "🎙️"); if (d.plataforma === yo) add(r.k, "Plataforma (audio y video)", reu, "🎛️"); });
  const meses = [...new Set([desde.slice(0, 7), hasta.slice(0, 7)])];
  meses.forEach(m => salidasDelMes(m).forEach(x => { if (x.r.d.capitan === yo) add(x.f, "Capitán de predicación", `${x.r.d.hora || ""} · ${x.r.d.lugar || ""}${x.r.d.territorio ? " · " + nomTerr(x.r.d.territorio) : ""}`, "🗺️"); }));
  return out.sort((a, b) => a.f < b.f ? -1 : 1);
}
function vMiEspacio() {
  const yo = CG.me; const hoy = HOY; const hasta = (() => { const m = mesMas(hoy.slice(0, 7), 1); return diasMes(m).pop(); })();
  $("#csub").textContent = `${yo.nombre} · Grupo ${yo.grupo} · ${HOR[yo.horario] || ""}`;
  let h = `<div class="mie-hola"><b>${saludo()}, ${esc(yo.nombre.split(" ")[0])}</b><span>Aquí está todo lo tuyo.</span></div>`;
  if (permPub("asig")) {
    const a = misAsignaciones(hoy, hasta);
    h += `<div class="label">Mis asignaciones</div>`;
    const filaA = x => { const F = fd(x.f); const dd = dias(hoy, x.f); return `<div class="card srow mie-a"><span class="dpill" style="background:var(--accent-soft);color:var(--accent)"><small>${DIAS[isoDia(x.f)].slice(0, 3)}</small>${F.d} ${F.m.slice(0, 3)}</span><div style="flex:1;min-width:0"><b>${x.ico} ${esc(x.que)}</b><div class="note">${esc(x.det)}</div></div>${dd <= 7 ? `<span class="pill t-warn">${dd === 0 ? "Hoy" : dd === 1 ? "Mañana" : `En ${dd} días`}</span>` : ""}</div>`; };
    h += a.length ? `<div class="list">${a.slice(0, 3).map(filaA).join("")}</div>${a.length > 3 ? `<details class="mas"><summary>Ver las otras ${a.length - 3} asignaciones</summary><div class="list" style="margin-top:8px">${a.slice(3).map(filaA).join("")}</div></details>` : ""}`
      : `<div class="card note" style="padding:16px">No tienes asignaciones de aquí a fin del próximo mes. 🙌</div>`;
  }
  if (permPub("semana")) {
    const sab = (typeof sabados === "function" ? sabados() : []).find(p => p.f >= hoy);
    const vm = R("vmc").find(r => r.k === lunesDe(hoy));
    const o = sab && sab.o ? H(sab.o) : null;
    h += `<div class="label">Esta semana</div><div class="card spad mie-sem">`;
    if (sab) h += sab.e === "evento" ? `<div><b>Sábado ${fd(sab.f).d}:</b> no hay reunión (asamblea o evento).</div>` : `<div class="note">Discurso público · sábado ${fd(sab.f).d} de ${fd(sab.f).m} · ${esc(GRUPO.hora || "")}</div><div class="mie-d">${sab.d ? `«${esc(tit(sab.d))}»` : "Discurso por confirmar"}</div><div class="note">${o ? `Hermano ${esc(o.nombre)}${C(o.cong) ? " · " + esc(cname(o.cong)) : ""}` : "Orador por confirmar"}</div>`;
    if (vm && vm.d) h += `<div class="note" style="margin-top:10px">📖 Lectura de la semana: <b>${esc(vm.d.lectura || "")}</b>${sinReunion(vm.d) ? ` · ${esc(vm.d.evento)}: no hay reunión entre semana` : ""}</div>`;
    h += `</div>`;
  }
  if (permPub("pred")) {
    const sal = [hoy.slice(0, 7), mesMas(hoy.slice(0, 7), 1)].flatMap(m => salidasDelMes(m)).filter(x => x.f >= hoy && x.f <= sumDias(hoy, 6));
    const dias7 = [0, 1, 2, 3, 4, 5, 6].map(n => sumDias(hoy, n));
    if (!MIE.dia || !dias7.includes(MIE.dia)) MIE.dia = (sal[0] || {}).f || hoy;
    h += `<div class="label">Predicación de la semana</div><div class="card spad"><div class="wk">${dias7.map(f => { const n = sal.filter(x => x.f === f).length; const dd = isoDia(f);
      return `<button class="wkd ${f === MIE.dia ? "on" : ""}" data-wd="${f}" style="--c:#${COLOR_DIA[dd]}"><small>${f === hoy ? "Hoy" : DIAS[dd].slice(0, 3)}</small><b>${fd(f).d}</b><i>${n ? "•".repeat(Math.min(n, 3)) : "–"}</i></button>`; }).join("")}</div><div id="wkDet"></div></div>`;
  }
  if (permPub("rec")) {
    let prox = null; for (let i = 0; i < 12 && !prox; i++) { const l = sumDias(lunesDe(hoy), 7 * i); const [hh, g] = grupoSemana(l); if (hh === yo.horario && +g === +yo.grupo) prox = l; }
    const ev = R("evento").filter(e => (e.d.hasta || e.k) >= hoy).sort((a, b) => a.k < b.k ? -1 : 1).slice(0, 3);
    h += `<div class="label">Recordatorios</div><div class="list">`;
    if (prox) h += `<div class="card srow"><span class="dpill" style="background:var(--warn-soft);color:var(--warn)">🧹</span><div style="flex:1"><b>Aseo y hospitalidad de tu grupo</b><div class="note">${lunesDe(hoy) === prox ? "¡Es esta semana!" : `Semana del ${fd(prox).d} de ${fd(prox).m}`}</div></div></div>`;
    ev.forEach(e => { h += `<div class="card srow"><span class="dpill" style="background:var(--accent-soft);color:var(--accent)">${fd(e.k).d} ${fd(e.k).m.slice(0, 3)}</span><div style="flex:1"><b>${esc(e.d.titulo || e.d.tipo || "Evento")}</b>${e.d.hasta && e.d.hasta !== e.k ? `<div class="note">Hasta el ${fd(e.d.hasta).d} de ${fd(e.d.hasta).m}</div>` : ""}</div></div>`; });
    if (!prox && !ev.length) h += `<div class="card note" style="padding:16px">Sin recordatorios por ahora.</div>`;
    h += `</div>`;
  }
  if (permPub("inf")) h += `<div class="label">Mi informe</div><div id="mieInf"></div>`;
  h += `<button class="btn line" style="width:100%;margin-top:18px" id="mieSalir">Salir</button>`;
  $("#cview").innerHTML = h; scrollTo(0, 0);
  $("#mieSalir").onclick = () => { $("#cBack").hidden = false; $("#cBell").hidden = false; $("#cong").hidden = true; salir(); };
  if (permPub("inf")) pintaMiInforme();
  if (permPub("pred")) pintaDiaPred();
}
function pintaDiaPred() {
  const box = $("#wkDet"); if (!box) return;
  document.querySelectorAll("[data-wd]").forEach(b => { b.classList.toggle("on", b.dataset.wd === MIE.dia); b.onclick = () => { MIE.dia = b.dataset.wd; pintaDiaPred(); }; });
  const f = MIE.dia; const sal = salidasDelMes(f.slice(0, 7)).filter(x => x.f === f);
  box.innerHTML = `<div class="wkt">${DIAS[isoDia(f)]} ${fd(f).d} de ${fd(f).m}</div>` + (sal.length ? sal.map(x => { const d = x.r.d; const t = R("territorio").find(r => r.id === d.territorio); const c = t && (t.d.centro || centroDe(t.d.area));
    return `<div class="wki"><div style="flex:1;min-width:0"><b>${esc(d.turno || "")} · ${esc(d.hora || "")}</b><div class="note">📍 ${esc(d.lugar || "")}</div><div class="note">🗺️ ${esc(nomTerr(d.territorio) || "Sin territorio")}${d.capitan ? ` · Capitán: ${esc(nomCorto(d.capitan))}` : ""}</div></div>${c ? `<a class="btn line" style="flex:0 0 auto;padding:8px 10px" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${c.join(",")}">🧭</a>` : ""}</div>`; }).join("") : `<div class="note" style="padding:6px 2px">No hay salida programada este día.</div>`);
}
function mesesInforme() { const m = HOY.slice(0, 7); return [mesMas(m, -2), mesMas(m, -1), m]; }
const infDe = mes => R("informe").find(x => x.k === mes + "|" + CG.me.persona);
const cerrado = mes => HOY > sumDias(mesMas(mes, 1) + "-01", 9);
function pintaMiInforme() {
  const yo = CG.me, box = $("#mieInf"); if (!box) return;
  const ms = mesesInforme(); if (!MIE.mesInf || !ms.includes(MIE.mesInf)) MIE.mesInf = !infDe(ms[1]) ? ms[1] : ms[2];
  const mes = MIE.mesInf; const r = R("informe").find(x => x.k === mes + "|" + yo.persona); const d = r ? r.d : {};
  const prec = ["regular", "especial", "misionero"].includes(yo.precursor);
  let st = { participo: d.participo ?? null, cursos: d.cursos || 0, aux: !!d.aux, horas: d.horas ?? "", nota: d.nota || "" };
  const pinta = () => {
    const conH = prec || st.aux;
    box.innerHTML = `<div class="card spad mie-inf">
      <div class="note" style="margin-bottom:6px">¿De qué mes es el informe?</div>
      <div class="picks">${ms.map(m => `<button class="pk ${m === mes ? "on" : ""}" data-mm="${m}">${MES[+m.slice(5) - 1]}${infDe(m) ? " ✅" : ""}</button>`).join("")}</div>
      ${r ? `<div class="aviso ok" style="margin:6px 0 10px">✅ <span>Enviado${d.enviado ? " el " + esc(d.enviado) : ""}${d.por !== "publicador" ? " (lo registró tu encargado)" : ""}. ${cerrado(mes) ? "Ya está cerrado; si hay que corregirlo, habla con tu encargado." : `Puedes corregirlo hasta el 10 de ${MES[+mesMas(mes, 1).slice(5) - 1]}.`}</span></div>` : cerrado(mes) ? `<div class="aviso warn" style="margin:6px 0 10px">⏰ <span>Este informe va tarde. Envíalo y tu encargado lo verá.</span></div>` : ""}
      <div class="mie-q">¿Participaste en alguna forma de predicación en ${MES[+mes.slice(5) - 1]}?</div>
      <div class="seg2 big"><button class="${st.participo === true ? "on" : ""}" data-p="1">Sí</button><button class="${st.participo === false ? "on no" : ""}" data-p="0">No</button></div>
      <div class="mie-row"><span>Cursos bíblicos que diriges</span><div class="stp"><button data-c="-1">−</button><b>${st.cursos}</b><button data-c="1">+</button></div></div>
      ${prec ? "" : `<label class="ic chk mie-row"><input type="checkbox" id="mAux" ${st.aux ? "checked" : ""}> Fui precursor auxiliar en ${MES[+mes.slice(5) - 1]}</label>`}
      ${conH ? `<div class="mie-row"><span>Horas</span><input id="mH" type="number" inputmode="numeric" min="0" max="300" value="${esc(st.horas)}" placeholder="0"></div>` : ""}
      <input class="tin inota" id="mN" placeholder="Notas (opcional)" value="${esc(st.nota)}" maxlength="140">
      ${r && cerrado(mes) ? "" : `<button class="btn pri" id="mOk" style="width:100%;margin-top:12px">${r ? "Actualizar informe" : `Enviar informe de ${MES[+mes.slice(5) - 1]}`}</button>`}</div>`;
    box.querySelectorAll("[data-mm]").forEach(b => b.onclick = () => { MIE.mesInf = b.dataset.mm; pintaMiInforme(); });
    box.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { leer(); st.participo = b.dataset.p === "1"; pinta(); });
    box.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { leer(); st.cursos = Math.max(0, Math.min(99, st.cursos + +b.dataset.c)); pinta(); });
    const ax = box.querySelector("#mAux"); if (ax) ax.onchange = () => { leer(); st.aux = ax.checked; pinta(); };
    const ok = box.querySelector("#mOk"); if (ok) ok.onclick = enviar;
    if (r && cerrado(mes)) box.querySelectorAll("input,.seg2 button,.stp button").forEach(x => x.disabled = true);
  };
  const leer = () => { const hh = box.querySelector("#mH"); if (hh) st.horas = hh.value; const nn = box.querySelector("#mN"); if (nn) st.nota = nn.value; };
  const enviar = async () => {
    leer(); if (st.participo === null) { toast("Dinos si participaste en la predicación"); return; }
    if ((prec || st.aux) && st.participo && st.horas === "") { toast("Escribe tus horas"); return; }
    const b = box.querySelector("#mOk"); b.disabled = true; b.textContent = "Enviando…";
    try { await rpc("pub_informe_guardar", { p_mes: mes, p_d: { participo: st.participo, cursos: st.cursos, aux: st.aux, horas: st.horas === "" ? null : +st.horas, nota: st.nota.trim() } });
      const d2 = await rpc("pub_data", {}); CG.reg = d2.reg || []; toast(`¡Gracias! Tu informe de ${MES[+mes.slice(5) - 1]} quedó enviado.`); pintaMiInforme(); }
    catch (e) { toast(e.message); b.disabled = false; b.textContent = r ? "Actualizar informe" : "Enviar informe"; }
  };
  pinta();
}
