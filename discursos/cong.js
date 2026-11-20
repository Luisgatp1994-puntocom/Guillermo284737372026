/* CRABS · Congregación Tierra Baja — secciones de toda la congregación
   Publicadores y grupos · Predicación (salidas y territorios) · Reuniones (Vida y Ministerio, acomodadores)
   Informes · Recordatorios (aseo, hospitalidad, eventos) · Notificaciones · Usuarios
   Usa helpers de app.js: $, esc, toast, hoja, I, rpc, fd, MES, HOY, dias, copiar, linkWa, normContacto, LS */

I.xls = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8.5 12.5l4 5M12.5 12.5l-4 5"/></svg>';
const CG = { imgs:{}, imgIds:{}, imgsOk:false, me:null, personas:[], reg:[], avisos:[], sec:null, tab:null, mes:null };
const HOR = { tb16:"4:00 PM", tb18:"6:15 PM" };
const PRIV = { anciano:"Anciano", siervo:"Siervo ministerial", publicador:"Publicador", no_bautizado:"No bautizado" };
const PREC = { no:"", regular:"Precursor regular", auxiliar:"Precursor auxiliar", especial:"Precursor especial" };
const DIAS = ["","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const COLOR_DIA = { 1:"E6C9F2", 2:"F08A6E", 3:"9CCB79", 4:"5AA4E0", 5:"E0524F", 6:"EFE6DD", 7:"FFE24D" };
const MODALIDADES = ["Predicación pública","Cartas y teléfono"];
const MOD_NOMBRE = { disc:"Discursos", pub:"Publicadores", pred_salida:"Predicación", territorio:"Territorios", terr_visita:"Territorios", vmc:"Vida y Ministerio", acomod:"Acomodadores", aseo:"Aseo", informe:"Informes", evento:"Eventos", recordatorio:"Recordatorios" };

const cAdmin = () => CG.me && CG.me.rol === "admin";
const cSuper = () => CG.me && CG.me.super;
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
  const d = await rpc("cong_data", { p_modulos: mods || ["pred_salida","territorio","terr_visita","vmc","acomod","aseo","informe","evento","recordatorio"] });
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
const inp = (id, v, ph, extra) => `<input id="${id}" value="${esc(v || "")}" placeholder="${esc(ph || "")}" ${extra || ""}>`;
function mesSelector(onCambio) {
  return { html: `<div class="mesnav"><button class="x" data-mes="-1" aria-label="Mes anterior">‹</button><b>${mesNombre(CG.mes)}</b><button class="x" data-mes="1" aria-label="Mes siguiente">›</button></div>`,
    bind: () => document.querySelectorAll("[data-mes]").forEach(b => b.onclick = () => { CG.mes = mesMas(CG.mes, +b.dataset.mes); onCambio(); }) };
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
async function descargar(wb, nombre) {
  nombre = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const file = new File([blob], nombre, { type: blob.type });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: nombre }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  toast("Excel listo");
}
async function conExcel(fn) {
  document.body.classList.add("loading");
  try { const X = await cargarExcel(); await fn(X); } catch (e) { toast(e.message || "No se pudo exportar"); }
  finally { document.body.classList.remove("loading"); }
}

/* ---------- Navegación ---------- */
const SEC = {
  pub: { titulo: "Publicadores", sub: "Grupos de servicio", tabs: [["lista", "Por grupo"], ["usuarios", "Usuarios y PIN"]] },
  pred: { titulo: "Predicación", sub: "Salidas y territorios", tabs: [["horario", "Horario del mes"], ["terr", "Territorios"]] },
  reu: { titulo: "Reuniones", sub: "Vida y Ministerio · Acomodadores", tabs: [["vmc", "Vida y Ministerio"], ["acomod", "Acomodadores"]] },
  inf: { titulo: "Informes", sub: "Informe mensual por grupo", tabs: [] },
  rec: { titulo: "Recordatorios", sub: "Aseo, hospitalidad y eventos", tabs: [["aseo", "Aseo y hospitalidad"], ["eventos", "Eventos"]] },
  avi: { titulo: "Notificaciones", sub: "Cambios de toda la congregación", tabs: [] }
};
async function abrirCong(sec) {
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
  const ed = cSuper();
  const opt = (o, v) => Object.entries(o).map(([k, l]) => `<option value="${k}" ${v === k ? "selected" : ""}>${l || "No"}</option>`).join("");
  const dis = ed ? "" : "disabled";
  hoja(`<div class="shead"><h2>${id ? esc(p.nombre) : "Nuevo publicador"}</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
    ${campo("Nombre", inp("pfN", p.nombre, "Nombre y apellido", dis))}
    <div class="grid2">${campo("Sexo", `<select id="pfS" class="csel" ${dis}>${opt({ H: "Hermano", M: "Hermana" }, p.sexo)}</select>`)}${campo("Horario del sábado", `<select id="pfH" class="csel" ${dis}>${opt(HOR, p.horario)}</select>`)}</div>
    <div class="grid2">${campo("Grupo de servicio", `<select id="pfG" class="csel" ${dis}>${[1, 2, 3].map(g => `<option ${p.grupo === g ? "selected" : ""}>${g}</option>`).join("")}</select>`)}${campo("En el grupo", `<select id="pfE" class="csel" ${dis}>${opt({ "": "Integrante", encargado: "Encargado", auxiliar: "Auxiliar" }, p.encargado)}</select>`)}</div>
    <div class="grid2">${campo("Privilegio", `<select id="pfP" class="csel" ${dis}>${opt(PRIV, p.privilegio)}</select>`)}${campo("Precursor", `<select id="pfR" class="csel" ${dis}>${opt(PREC, p.precursor)}</select>`)}</div>
    ${cAdmin() ? campo("WhatsApp (celular o @usuario)", inp("pfT", p.tel, "300 000 0000", dis)) + campo("Notas", inp("pfO", p.notas, "", dis)) : ""}
    ${ed ? `<button class="btn pri" id="pfOk">Guardar</button>${id ? `<button class="btn bad" id="pfDel">Quitar de la lista</button>` : ""}` : `<p class="note">Solo el super administrador puede editar.</p>`}`,
    (bg, close) => {
      if (!ed) return;
      const datos = () => ({ nombre: val(bg, "pfN"), sexo: val(bg, "pfS"), horario: val(bg, "pfH"), grupo: +val(bg, "pfG"), encargado: val(bg, "pfE"), privilegio: val(bg, "pfP"), precursor: val(bg, "pfR"), tel: normContacto(val(bg, "pfT")), notas: val(bg, "pfO") });
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
  let h = tabs(SEC.pub.tabs) + `<p class="note" style="margin:6px 4px 12px">Cada anciano o siervo entra con su propio PIN. <b>Admin</b> modifica programas e informes; <b>Consulta</b> solo ve. El horario define qué programa de Discursos ve.</p><div class="list">`;
  h += us.map(u => `<button class="card prow2" data-uid="${u.id}" ${u.super ? "disabled" : ""}><span class="av ${u.rol === "admin" ? "t-acc" : "t-idle"}">${esc(ini(u.etiqueta))}</span><span style="flex:1;min-width:0;text-align:left"><b>${esc(u.etiqueta)}</b><small class="note" style="display:block">${u.super ? "Super administrador" : u.rol === "admin" ? "Admin" : "Consulta"} · Discursos ${HOR[u.grupo]}</small></span></button>`).join("");
  h += `</div><button class="btn pri" style="width:100%;margin-top:12px" id="nuevoU">+ Crear PIN para un hermano</button>`;
  $("#cview").innerHTML = h; bindTabs();
  document.querySelectorAll("[data-uid]").forEach(b => b.onclick = () => fichaUsuario(us.find(u => u.id === +b.dataset.uid)));
  $("#nuevoU").onclick = () => fichaUsuario(null);
}
function fichaUsuario(u) {
  hoja(`<div class="shead"><h2>${u ? esc(u.etiqueta) : "Nuevo usuario"}</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
    ${campo("Hermano", u ? inp("uN", u.etiqueta) : selPersona("uP", "", p => p.sexo === "H", "Escoge un hermano"))}
    <div class="grid2">${campo("Rol", `<select id="uR" class="csel"><option value="admin" ${u && u.rol === "admin" ? "selected" : ""}>Admin</option><option value="consulta" ${u && u.rol === "consulta" ? "selected" : ""}>Consulta</option></select>`)}${campo("Discursos de", `<select id="uH" class="csel">${Object.entries(HOR).map(([k, l]) => `<option value="${k}" ${u && u.grupo === k ? "selected" : ""}>${l}</option>`).join("")}</select>`)}</div>
    ${campo(u ? "Nuevo PIN (déjalo vacío para no cambiarlo)" : "PIN", inp("uX", "", "Admin: 6 a 8 números · Consulta: 4 a 8", 'inputmode="numeric" maxlength="8" autocomplete="off"'))}
    <button class="btn pri" id="uOk">Guardar</button>${u ? `<button class="btn bad" id="uDel">Quitar acceso</button>` : ""}`,
    (bg, close) => {
      bg.querySelector("#uOk").onclick = async () => {
        const nombre = u ? val(bg, "uN") : nom(val(bg, "uP")); if (!nombre) { toast("Escoge el hermano"); return; }
        try { await rpc("cong_usuario_guardar", { p_nombre: nombre, p_rol: val(bg, "uR"), p_horario: val(bg, "uH"), p_nuevo: val(bg, "uX"), p_id: u ? u.id : null }); close(); toast("Usuario guardado"); vUsuarios(); } catch (e) { toast(e.message); }
      };
      const d = bg.querySelector("#uDel"); if (d) d.onclick = async () => { try { await rpc("cong_usuario_borrar", { p_id: u.id }); close(); toast("Acceso quitado"); vUsuarios(); } catch (e) { toast(e.message); } };
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
function vPred() {
  if (CG.tab === "terr") return vTerr();
  const ms = mesSelector(vPred);
  const fijas = R("pred_salida").filter(r => r.d.tipo === "fija").sort((a, b) => a.d.dia - b.d.dia || (a.d.turno === "Mañana" ? -1 : 1));
  const delMes = salidasDelMes(CG.mes);
  const hechas = delMes.filter(s => visitaDe(s.f, s.r.id)).length;
  let h = tabs(SEC.pred.tabs) + ms.html + `<div class="kpis k3">${[[delMes.length, "Salidas del mes"], [hechas, "Realizadas"], [delMes.filter(s => s.f < HOY && !visitaDe(s.f, s.r.id)).length, "Sin marcar"]].map(([n, l]) => `<div class="kpi"><span class="n">${n}</span><span class="l">${l}</span></div>`).join("")}</div>`;
  h += `<div class="label">Salidas fijas de cada semana</div><div class="list">${fijas.length ? fijas.map(r => filaSalida(r, null)).join("") : vacio("Aún no hay salidas fijas. Agrega las de lunes a viernes.")}</div>`;
  const fechas = R("pred_salida").filter(r => r.d.tipo === "fecha" && r.d.fecha.startsWith(CG.mes)).sort((a, b) => a.d.fecha < b.d.fecha ? -1 : 1);
  h += `<div class="label">Salidas por fecha · ${mesNombre(CG.mes)}</div><div class="list">${fechas.length ? fechas.map(r => filaSalida(r, r.d.fecha)).join("") : vacio("Sábados, domingos y visitas del superintendente van aquí.")}</div>`;
  const prox = delMes.filter(s => s.f >= HOY).slice(0, 6);
  if (prox.length) h += `<div class="label">Próximas salidas</div><div class="list">${prox.map(s => { const v = visitaDe(s.f, s.r.id); return `<div class="card srow"><div class="dbox t-acc" style="background:#${COLOR_DIA[isoDia(s.f)]};color:#111"><div class="d">${fd(s.f).d}</div><div class="w">${DIAS[isoDia(s.f)].slice(0, 3)}</div></div><div style="min-width:0;flex:1"><b>${esc([s.r.d.turno,s.r.d.hora].filter(Boolean).join(" · "))}</b><div class="note">${esc(nomCorto(s.r.d.capitan) || "Sin capitán")} · ${esc(s.r.d.lugar || "")} · ${esc(nomTerr(s.r.d.territorio))}</div></div>${cAdmin() ? `<button class="chipo mini ${v ? "" : "off"}" data-hecha="${s.f}|${s.r.id}">${v ? "✓ Realizada" : "Marcar"}</button>` : v ? `<span class="pill t-ok">✓</span>` : ""}</div>`; }).join("")}</div>`;
  h += `<div class="row" style="margin-top:12px">${cAdmin() ? `<button class="btn pri" id="nuevaS">+ Salida</button>` : ""}${btnExcel("xlsPred", "Excel del mes")}</div>`;
  $("#cview").innerHTML = h; ms.bind(); bindTabs();
  document.querySelectorAll("[data-sid]").forEach(b => b.onclick = () => fichaSalida(R("pred_salida").find(r => r.id === b.dataset.sid)));
  document.querySelectorAll("[data-hecha]").forEach(b => b.onclick = () => marcarHecha(...b.dataset.hecha.split("|")));
  if ($("#nuevaS")) $("#nuevaS").onclick = () => fichaSalida(null);
  $("#xlsPred").onclick = () => conExcel(xlsPredicacion);
}
function filaSalida(r, f) {
  const d = r.d; const dia = f ? isoDia(f) : +d.dia;
  return `<button class="card srow" data-sid="${r.id}"><span class="dpill" style="background:#${COLOR_DIA[dia]}">${f ? DIAS[dia].slice(0, 3) + " " + fd(f).d : DIAS[dia]}</span><div style="min-width:0;flex:1;text-align:left"><b>${esc([d.turno,d.hora].filter(Boolean).join(" · "))}</b>${d.nota ? ` <span class="pill t-warn">${esc(d.nota)}</span>` : ""}<div class="note">${esc(nomCorto(d.capitan) || "Sin capitán")} · ${esc(d.lugar || "—")} · ${esc(nomTerr(d.territorio) || "—")}</div></div></button>`;
}
function selTerritorio(id, v) {
  const ts = R("territorio").sort((a, b) => (+a.d.numero || 0) - (+b.d.numero || 0));
  return `<select id="${id}" class="csel"><option value="">—</option><optgroup label="Territorios">${ts.map(t => `<option value="${t.id}" ${v === t.id ? "selected" : ""}>${esc(nomTerr(t.id))}</option>`).join("")}</optgroup><optgroup label="Modalidades">${MODALIDADES.map(m => `<option ${v === m ? "selected" : ""}>${m}</option>`).join("")}</optgroup></select>`;
}
function fichaSalida(r) {
  const d = r ? r.d : { tipo: "fija", dia: 1, turno: "Mañana", hora: "8:15", capitan: "", lugar: "Salón del Reino", territorio: "", fecha: HOY, nota: "" };
  if (!cAdmin()) { toast("Solo los administradores pueden editar"); return; }
  hoja(`<div class="shead"><h2>${r ? "Editar salida" : "Nueva salida"}</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
    ${campo("Tipo", `<div class="picks"><button class="pk ${d.tipo === "fija" ? "on" : ""}" data-tipo="fija">Fija cada semana</button><button class="pk ${d.tipo === "fecha" ? "on" : ""}" data-tipo="fecha">Una fecha</button></div>`)}
    <div id="sDia" ${d.tipo === "fija" ? "" : "hidden"}>${campo("Día", `<select id="sD" class="csel">${[1, 2, 3, 4, 5, 6, 7].map(i => `<option value="${i}" ${+d.dia === i ? "selected" : ""}>${DIAS[i]}</option>`).join("")}</select>`)}</div>
    <div id="sFecha" ${d.tipo === "fecha" ? "" : "hidden"}>${campo("Fecha", `<input id="sF" type="date" value="${esc(d.fecha || HOY)}">`)}</div>
    <div class="grid2">${campo("Turno", `<select id="sT" class="csel">${["Mañana", "Tarde"].map(x => `<option ${d.turno === x ? "selected" : ""}>${x}</option>`).join("")}</select>`)}${campo("Hora", inp("sH", d.hora, "8:15"))}</div>
    ${campo("Capitán", selPersona("sC", d.capitan, esHermano))}
    ${campo("Lugar de encuentro", inp("sL", d.lugar, "Salón del Reino, Familia Gómez…"))}
    ${campo("Territorio", selTerritorio("sR", d.territorio))}
    ${campo("Nota (opcional)", inp("sN", d.nota, "Visita del superintendente, Grupo 3…"))}
    <button class="btn pri" id="sOk">Guardar</button>${r ? `<button class="btn bad" id="sDel">Borrar salida</button>` : ""}`,
    (bg, close) => {
      let tipo = d.tipo;
      bg.querySelectorAll("[data-tipo]").forEach(b => b.onclick = () => { tipo = b.dataset.tipo; bg.querySelectorAll("[data-tipo]").forEach(x => x.classList.toggle("on", x === b)); bg.querySelector("#sDia").hidden = tipo !== "fija"; bg.querySelector("#sFecha").hidden = tipo !== "fecha"; });
      bg.querySelector("#sOk").onclick = async () => {
        const nd = { tipo, dia: +val(bg, "sD"), fecha: tipo === "fecha" ? val(bg, "sF") : "", turno: val(bg, "sT"), hora: val(bg, "sH"), capitan: val(bg, "sC"), lugar: val(bg, "sL"), territorio: val(bg, "sR"), nota: val(bg, "sN") };
        const quien = tipo === "fija" ? DIAS[nd.dia] + " " + nd.turno.toLowerCase() : corto(nd.fecha);
        const aviso = r && r.d.capitan !== nd.capitan ? `Predicación ${quien}: capitán ahora ${nom(nd.capitan) || "sin asignar"}` : r ? `Predicación ${quien}: salida actualizada` : `Nueva salida de predicación: ${quien}`;
        await cGuardar("pred_salida", tipo === "fija" ? "fija" : nd.fecha.slice(0, 7), r ? r.id : null, nd, aviso); close(); toast("Salida guardada");
      };
      const del = bg.querySelector("#sDel"); if (del) del.onclick = async () => { await cBorrar(r.id, "Se borró una salida de predicación"); close(); };
    });
}
async function marcarHecha(f, sid) {
  const s = R("pred_salida").find(r => r.id === sid); const v = visitaDe(f, sid);
  if (v) { await cBorrar(v.id); toast("Desmarcada"); }
  else { await cGuardar("terr_visita", f, null, { salida: sid, territorio: s.d.territorio, capitan: s.d.capitan, fecha: f }); toast("Marcada como realizada"); }
  vPred();
}
async function xlsPredicacion(X) {
  const wb = new X.Workbook(); const ws = wb.addWorksheet("Predicación", { views: [{ showGridLines: false }] });
  ws.columns = [{ width: 14 }, { width: 14 }, { width: 11 }, { width: 24 }, { width: 24 }, { width: 28 }];
  ws.mergeCells("A1:F1"); celda(ws, "A1", "PREDICACIÓN SEMANAL", { bold: true, size: 12, align: "center", color: "C0392B", fill: "FFE24D" });
  ws.mergeCells("A2:F2"); celda(ws, "A2", `${mesNombre(CG.mes).toUpperCase()} - HORARIO DE PREDICACIÓN`, { bold: true, size: 16, align: "center", color: "C0392B", fill: "FFE24D" });
  ["Día", "Mañana y tarde", "Horario", "Capitán", "Lugar", "Territorio"].forEach((t, i) => celda(ws, String.fromCharCode(65 + i) + "3", t, { bold: true, align: "center", fill: "FFE24D", color: "C0392B" }));
  let row = 4;
  const fijas = R("pred_salida").filter(r => r.d.tipo === "fija").sort((a, b) => a.d.dia - b.d.dia || (a.d.turno === "Mañana" ? -1 : 1));
  const fechas = R("pred_salida").filter(r => r.d.tipo === "fecha" && r.d.fecha.startsWith(CG.mes) && !r.d.nota).sort((a, b) => (isoDia(a.d.fecha) - isoDia(b.d.fecha)) || (a.d.fecha < b.d.fecha ? -1 : 1));
  const linea = (dia, etiqueta, d) => { const fill = COLOR_DIA[dia]; [etiqueta, (d.turno||"").toUpperCase(), d.hora, nom(d.capitan).toUpperCase(), (d.lugar || "").toUpperCase(), nomTerr(d.territorio).toUpperCase()].forEach((v, i) => celda(ws, String.fromCharCode(65 + i) + row, v, { fill, align: i === 0 ? "right" : "center", bold: i === 0 })); row++; };
  fijas.forEach(r => linea(+r.d.dia, DIAS[r.d.dia].toUpperCase(), r.d));
  fechas.forEach(r => linea(isoDia(r.d.fecha), `${DIAS[isoDia(r.d.fecha)].toUpperCase()} (${fd(r.d.fecha).d})`, r.d));
  const esp = R("pred_salida").filter(r => r.d.tipo === "fecha" && r.d.fecha.startsWith(CG.mes) && r.d.nota);
  if (esp.length) {
    row++; ws.mergeCells(`A${row}:F${row}`); celda(ws, "A" + row, "VISITA DEL SUPERINTENDENTE / ESPECIALES", { bold: true, align: "center", color: "C0392B" }); row++;
    esp.forEach(r => linea(isoDia(r.d.fecha), `${DIAS[isoDia(r.d.fecha)].toUpperCase()} ${fd(r.d.fecha).d}`, { ...r.d, turno: r.d.nota }));
  }
  hojaImprimible(ws, false);
  // Hoja 2: resumen de territorios del mes
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
  const ts = R("territorio").sort((a, b) => (+a.d.numero || 0) - (+b.d.numero || 0));
  const vis = R("terr_visita");
  const ultima = id => vis.filter(v => v.d.territorio === id).map(v => v.k).sort().pop();
  const veces = id => vis.filter(v => v.d.territorio === id && v.k.startsWith(CG.mes)).length;
  const ms = mesSelector(vTerr);
  let h = tabs(SEC.pred.tabs) + ms.html + `<div class="list">`;
  h += `<div class="card note" style="display:flex;gap:10px;align-items:center"><span class="pill t-warn">En desarrollo</span><span>Por ahora cada territorio va con su foto o imagen de la tarjeta. Tócala para verla en grande.</span></div>`;
  h += ts.length ? `<div class="tgrid">` + ts.map(t => { const u = ultima(t.id); const m = u ? Math.floor(dias(u, HOY) / 30.44) : null; const warn = !u || m >= 4; const im = CG.imgs[t.id];
    return `<button class="card tcard" data-tid="${t.id}"><div class="timg">${im ? `<img src="${im}" alt="">` : `<span class="note">${CG.imgsOk ? "Sin imagen" : "Cargando…"}</span>`}<span class="tnum">${esc(t.d.numero || "—")}</span></div><div class="tinfo"><b>${esc(t.d.nombre)}</b><div class="note">${t.d.lamina ? "Lámina " + esc(t.d.lamina) + " · " : ""}${veces(t.id)}× este mes</div>${warn ? `<div class="note wtxt">${u ? "Hace " + m + " meses" : "Nunca trabajado"}</div>` : ""}</div></button>`; }).join("") + `</div>` : vacio("Agrega los territorios: número, nombre, lámina y la foto de la tarjeta.");
  h += `</div><div class="row" style="margin-top:12px">${cAdmin() ? `<button class="btn pri" id="nuevoT">+ Territorio</button>` : ""}${btnExcel("xlsTerr", "Excel de territorios")}</div>`;
  $("#cview").innerHTML = h; ms.bind(); bindTabs();
  document.querySelectorAll("[data-tid]").forEach(b => b.onclick = () => fichaTerr(ts.find(t => t.id === b.dataset.tid)));
  if ($("#nuevoT")) $("#nuevoT").onclick = () => fichaTerr(null);
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
      let nueva = null;
      const verImg = () => { const im = bg.querySelector("#tImg"); if (im) im.onclick = () => visor(im.src); };
      verImg();
      if (!ed) return;
      bg.querySelector("#tFile").onchange = async e => {
        const f = e.target.files[0]; if (!f) return;
        try { nueva = await comprimir(f); bg.querySelector("#tImgBox").innerHTML = `<img src="${nueva}" alt="" id="tImg">`; verImg(); toast("Imagen lista, dale Guardar"); } catch (er) { toast("No se pudo leer la imagen"); }
      };
      bg.querySelector("#tOk").onclick = async () => {
        const nd = { numero: val(bg, "tN"), lamina: val(bg, "tL"), nombre: val(bg, "tB"), mapa: val(bg, "tM"), notas: val(bg, "tO") };
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
function vReu() { return CG.tab === "acomod" ? vAcomod() : vVmc(); }
const VMC_BASE = () => ({ lectura: "", c1: "", oracion1: "", intro: "", t1: { titulo: "", p: "" }, t2: { titulo: "Busquemos perlas escondidas", p: "" }, lect: { cita: "", p: "", a: "" }, consejero: "", maestros: [{ titulo: "", min: "", p: "", pa: "", a: "", aa: "" }, { titulo: "", min: "", p: "", pa: "", a: "", aa: "" }, { titulo: "", min: "", p: "", pa: "", a: "", aa: "" }], c2: "", vida: [{ titulo: "", min: "15", p: "" }], estudio: { p: "", lector: "" }, c3: "", oracion2: "", evento: "" });
function semanasMes(ym) { const out = []; let l = lunesDe(ym + "-01"); if (l.slice(0, 7) < ym) l = sumDias(l, 7); while (l.slice(0, 7) === ym) { out.push(l); l = sumDias(l, 7); } return out; }
function vVmc() {
  const ms = mesSelector(vVmc);
  let h = tabs(SEC.reu.tabs) + ms.html + `<div class="list">`;
  for (const l of semanasMes(CG.mes)) {
    const r = R("vmc").find(x => x.k === l); const d = r ? r.d : null;
    const fin = sumDias(l, 6);
    const asign = d ? [d.intro, d.t1.p, d.t2.p, d.lect.p, ...d.maestros.map(m => m.p), ...d.vida.map(v => v.p), d.estudio.p].filter(Boolean).length : 0;
    h += `<button class="card trow" data-sem="${l}"><span class="dpill" style="background:var(--accent-soft);color:var(--accent)">${fd(l).d}–${fd(fin).d}</span><div style="flex:1;min-width:0;text-align:left"><b>Semana ${fd(l).d} al ${fd(fin).d} de ${fd(fin).m}</b><div class="note">${d ? (d.evento ? esc(d.evento) : `${esc(d.lectura || "Sin lectura")} · ${asign} asignaciones`) : "Sin programa"}</div></div><span class="pill ${d ? (d.evento ? "t-warn" : "t-ok") : "t-idle"}">${d ? (d.evento ? "Evento" : "Listo") : "Vacío"}</span></button>`;
  }
  h += `</div><div class="row" style="margin-top:12px">${btnExcel("xlsVmc", "Excel del mes")}</div>`;
  $("#cview").innerHTML = h; ms.bind(); bindTabs();
  document.querySelectorAll("[data-sem]").forEach(b => b.onclick = () => fichaVmc(b.dataset.sem));
  $("#xlsVmc").onclick = () => conExcel(xlsVmc);
}
function fichaVmc(l) {
  const r = R("vmc").find(x => x.k === l); const d = r ? JSON.parse(JSON.stringify(r.d)) : VMC_BASE();
  const ed = cAdmin();
  const sp = (id, v, f) => selPersona(id, v, f || esHermano);
  const usados = () => { const s = {}; return s; };
  const m = (i, x) => `<div class="card vpart"><div class="grid2">${campo("Parte " + (4 + i), inp("mT" + i, x.titulo, "Empecemos conversaciones"))}${campo("Min.", inp("mM" + i, x.min, "3", 'inputmode="numeric"'))}</div>
    <div class="grid2">${campo("Sala princ.", sp("mP" + i, x.p, () => true))}${campo("Ayudante", sp("mPA" + i, x.pa, () => true))}</div>
    <div class="grid2">${campo("Sala aux.", sp("mA" + i, x.a, () => true))}${campo("Ayudante", sp("mAA" + i, x.aa, () => true))}</div></div>`;
  hoja(`<div class="shead"><h2>Semana ${fd(l).d}–${fd(sumDias(l, 6)).d} de ${fd(sumDias(l, 6)).m}</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
    ${campo("Evento especial (deja vacío si hay reunión normal)", `<select id="vE" class="csel">${["", "Asamblea regional", "Asamblea de circuito", "Visita del superintendente de circuito", "Conmemoración"].map(x => `<option ${d.evento === x ? "selected" : ""} value="${x}">${x || "Reunión normal"}</option>`).join("")}</select>`)}
    <div id="vCuerpo">
    ${campo("Lectura semanal de la Biblia", inp("vL", d.lectura, "Lamentaciones 1, 2"))}
    <div class="grid2">${campo("Canción inicial", inp("vC1", d.c1, "28", 'inputmode="numeric"'))}${campo("Oración", sp("vO1", d.oracion1))}</div>
    ${campo("Palabras de introducción (presidente)", sp("vI", d.intro, esNombrado))}
    <div class="vsec" style="background:#2A7F7F">TESOROS DE LA BIBLIA</div>
    <div class="grid2">${campo("1. Título", inp("vT1", d.t1.titulo, ""))}${campo("Discursante", sp("vT1p", d.t1.p, esNombrado))}</div>
    <div class="grid2">${campo("2. Perlas escondidas", inp("vT2", d.t2.titulo, ""))}${campo("Conductor", sp("vT2p", d.t2.p, esNombrado))}</div>
    ${campo("3. Lectura de la Biblia (cita)", inp("vLc", d.lect.cita, "Lam 1:8-18 (th 10)"))}
    <div class="grid2">${campo("Sala princ.", sp("vLp", d.lect.p))}${campo("Sala aux.", sp("vLa", d.lect.a))}</div>
    ${campo("Consejero sala auxiliar", sp("vCo", d.consejero, esNombrado))}
    <div class="vsec" style="background:#B8860B">SEAMOS MEJORES MAESTROS</div>
    <div id="vMae">${d.maestros.map(m).join("")}</div>
    <div class="row"><button class="btn line" id="vMas">+ Parte</button><button class="btn line" id="vMenos">− Parte</button></div>
    <div class="vsec" style="background:#8B1A1A">NUESTRA VIDA CRISTIANA</div>
    ${campo("Canción", inp("vC2", d.c2, "90", 'inputmode="numeric"'))}
    <div id="vVida">${d.vida.map((v, i) => `<div class="grid2">${campo("Parte (" + (v.min || "15") + " min)", inp("vV" + i, v.titulo, ""))}${campo("Encargado", sp("vVp" + i, v.p, esNombrado))}</div>`).join("")}</div>
    <div class="row"><button class="btn line" id="vVMas">+ Parte</button></div>
    <div class="grid2">${campo("Estudio bíblico (conductor)", sp("vEc", d.estudio.p, esNombrado))}${campo("Lector", sp("vEl", d.estudio.lector))}</div>
    <div class="grid2">${campo("Canción final", inp("vC3", d.c3, "75", 'inputmode="numeric"'))}${campo("Oración final", sp("vO2", d.oracion2))}</div>
    </div>
    <div id="vAviso"></div>
    ${ed ? `<button class="btn pri" id="vOk">Guardar semana</button>` : `<p class="note">Solo los administradores pueden editar.</p>`}`,
    (bg, close) => {
      const q = s => bg.querySelector(s);
      const leer = () => {
        const nd = { evento: val(bg, "vE"), lectura: val(bg, "vL"), c1: val(bg, "vC1"), oracion1: val(bg, "vO1"), intro: val(bg, "vI"), t1: { titulo: val(bg, "vT1"), p: val(bg, "vT1p") }, t2: { titulo: val(bg, "vT2"), p: val(bg, "vT2p") }, lect: { cita: val(bg, "vLc"), p: val(bg, "vLp"), a: val(bg, "vLa") }, consejero: val(bg, "vCo"), maestros: [], c2: val(bg, "vC2"), vida: [], estudio: { p: val(bg, "vEc"), lector: val(bg, "vEl") }, c3: val(bg, "vC3"), oracion2: val(bg, "vO2") };
        bg.querySelectorAll("#vMae .vpart").forEach((_, i) => nd.maestros.push({ titulo: val(bg, "mT" + i), min: val(bg, "mM" + i), p: val(bg, "mP" + i), pa: val(bg, "mPA" + i), a: val(bg, "mA" + i), aa: val(bg, "mAA" + i) }));
        let i = 0; while (q("#vV" + i)) { nd.vida.push({ titulo: val(bg, "vV" + i), min: (d.vida[i] || {}).min || "15", p: val(bg, "vVp" + i) }); i++; }
        return nd;
      };
      const evento = () => { q("#vCuerpo").hidden = !!val(bg, "vE"); };
      q("#vE").onchange = evento; evento();
      const dupl = () => { const nd = leer(); const ids = [nd.intro, nd.t1.p, nd.t2.p, nd.lect.p, nd.lect.a, ...nd.maestros.flatMap(x => [x.p, x.pa, x.a, x.aa]), ...nd.vida.map(v => v.p), nd.estudio.p, nd.estudio.lector].filter(Boolean); const c = {}; ids.forEach(x => c[x] = (c[x] || 0) + 1); const rep = Object.keys(c).filter(k => c[k] > 1); q("#vAviso").innerHTML = rep.length ? `<div class="aviso warn">${I.alert}<span>Con más de una asignación esta semana: <b>${rep.map(nomCorto).map(esc).join(", ")}</b>.</span></div>` : ""; };
      bg.querySelectorAll("select").forEach(s => s.addEventListener("change", dupl)); dupl();
      q("#vMas").onclick = () => { const i = bg.querySelectorAll("#vMae .vpart").length; q("#vMae").insertAdjacentHTML("beforeend", m(i, { titulo: "", min: "", p: "", pa: "", a: "", aa: "" })); bg.querySelectorAll("#vMae select").forEach(s => s.onchange = dupl); };
      q("#vMenos").onclick = () => { const l2 = bg.querySelectorAll("#vMae .vpart"); if (l2.length > 1) l2[l2.length - 1].remove(); };
      q("#vVMas").onclick = () => { let i = 0; while (q("#vV" + i)) i++; q("#vVida").insertAdjacentHTML("beforeend", `<div class="grid2">${campo("Parte", inp("vV" + i, "", ""))}${campo("Encargado", sp("vVp" + i, "", esNombrado))}</div>`); };
      const ok = q("#vOk"); if (ok) ok.onclick = async () => {
        const nd = leer();
        let aviso = r ? null : `Programa de Vida y Ministerio cargado: semana del ${corto(l)}`;
        if (r) { const cambios = []; const cmp = (a, b, t) => { if ((a || "") !== (b || "")) cambios.push(`${t}: ${nomCorto(b) || "sin asignar"}`); };
          cmp(r.d.intro, nd.intro, "presidente"); cmp(r.d.t1.p, nd.t1.p, "discurso de Tesoros"); cmp(r.d.t2.p, nd.t2.p, "perlas escondidas"); cmp(r.d.lect.p, nd.lect.p, "lectura de la Biblia"); cmp(r.d.estudio.p, nd.estudio.p, "estudio bíblico"); cmp(r.d.estudio.lector, nd.estudio.lector, "lector");
          nd.maestros.forEach((x, i) => cmp((r.d.maestros[i] || {}).p, x.p, `parte ${4 + i}`));
          aviso = cambios.length ? `Vida y Ministerio ${corto(l)} · cambió ${cambios.join("; ")}` : `Vida y Ministerio ${corto(l)}: programa actualizado`; }
        await cGuardar("vmc", l, r ? r.id : null, nd, aviso); close(); toast("Semana guardada");
      };
    });
}
async function xlsVmc(X) {
  const wb = new X.Workbook(); const ws = wb.addWorksheet("Vida y Ministerio", { views: [{ showGridLines: false }] });
  ws.columns = [{ width: 50 }, { width: 10 }, { width: 24 }, { width: 10 }, { width: 24 }];
  const MX = s => s.toUpperCase();
  ws.mergeCells("A1:E1"); celda(ws, "A1", "VIDA Y MINISTERIO CRISTIANOS", { bold: true, size: 18, align: "center", color: "1F2A5A", border: false });
  ws.mergeCells("A2:E2"); celda(ws, "A2", `${mesNombre(CG.mes)}  ·  Congregación: TIERRA BAJA`, { size: 12, align: "center", color: "1F2A5A", border: false });
  let r = 4;
  const bar = (t, fill) => { ws.mergeCells(`A${r}:E${r}`); celda(ws, "A" + r, t, { bold: true, align: "center", color: "FFFFFF", fill }); r++; };
  const fila = (t, nombre, color, extra) => { ws.mergeCells(`A${r}:${extra ? "C" : "D"}${r}`); celda(ws, "A" + r, t, { color: color || "2A7F7F", bold: true }); if (extra) { celda(ws, "D" + r, extra[0], { size: 8, align: "right", border: false }); } celda(ws, "E" + r, nombre ? MX(nom(nombre)) : "", { bold: true, align: "center" }); r++; };
  const sala = (p, a, lab) => { celda(ws, "A" + r, "", { border: false }); celda(ws, "B" + r, lab || "S. Princ.:", { size: 9, align: "right", border: false }); celda(ws, "C" + r, p ? MX(nom(p)) : "", { bold: true, align: "center" }); celda(ws, "D" + r, lab ? "Ayudante:" : "S. Aux.:", { size: 9, align: "right", border: false }); celda(ws, "E" + r, a ? MX(nom(a)) : "", { bold: true, align: "center" }); r++; };
  for (const l of semanasMes(CG.mes)) {
    const rr = R("vmc").find(x => x.k === l); const fin = sumDias(l, 6);
    ws.mergeCells(`A${r}:C${r}`); celda(ws, "A" + r, `SEMANA ${fd(l).d}-${fd(fin).d} DE ${MX(fd(fin).m)}`, { bold: true });
    ws.mergeCells(`D${r}:E${r}`); celda(ws, "D" + r, `Lectura semanal de la Biblia: ${rr ? MX(rr.d.lectura || "") : ""}`, { bold: true, size: 9 }); r++;
    if (!rr) { bar("SIN PROGRAMA", "999999"); r++; continue; }
    const d = rr.d;
    if (d.evento) { bar(MX(d.evento), "2A7F7F"); r++; continue; }
    ws.mergeCells(`A${r}:B${r}`); celda(ws, "A" + r, `•  Canción ${d.c1} y oración:`, { bold: true, align: "right", border: false }); celda(ws, "C" + r, MX(nom(d.oracion1)), { bold: true, align: "center" }); celda(ws, "D" + r, "Palabras de introd.:", { size: 8, align: "right", border: false }); celda(ws, "E" + r, MX(nom(d.intro)), { bold: true, align: "center" }); r++;
    bar("TESOROS DE LA BIBLIA", "2A7F7F");
    fila("1. " + d.t1.titulo + " (10 mins)", d.t1.p); fila("2. " + (d.t2.titulo || "Busquemos perlas escondidas") + " (10 mins)", d.t2.p);
    fila("3. Lectura de la Biblia (4 mins): " + d.lect.cita, d.consejero, null, ["Cons. aux."]); sala(d.lect.p, d.lect.a);
    bar("SEAMOS MEJORES MAESTROS", "B8860B");
    d.maestros.forEach((m, i) => { ws.mergeCells(`A${r}:E${r}`); celda(ws, "A" + r, `${4 + i}. ${m.titulo}${m.min ? " (" + m.min + " mins)" : ""}`, { bold: true, color: "B8860B" }); r++; sala(m.p, m.a); if (m.pa || m.aa) { celda(ws, "A" + r, "", { border: false }); celda(ws, "B" + r, "Ayudante:", { size: 9, align: "right", border: false }); celda(ws, "C" + r, MX(nom(m.pa)), { bold: true, align: "center" }); celda(ws, "D" + r, "Ayudante:", { size: 9, align: "right", border: false }); celda(ws, "E" + r, MX(nom(m.aa)), { bold: true, align: "center" }); r++; } });
    bar("NUESTRA VIDA CRISTIANA", "8B1A1A");
    ws.mergeCells(`A${r}:E${r}`); celda(ws, "A" + r, "•  Canción " + d.c2, { bold: true, color: "8B1A1A" }); r++;
    const n0 = 4 + d.maestros.length;
    d.vida.forEach((v, i) => fila(`${n0 + i}. ${v.titulo} (${v.min || 15} mins)`, v.p, "8B1A1A"));
    ws.mergeCells(`A${r}:B${r}`); celda(ws, "A" + r, `${n0 + d.vida.length}. Estudio bíblico de la congregación (30 mins)`, { bold: true, color: "8B1A1A" }); celda(ws, "C" + r, MX(nom(d.estudio.p)), { bold: true, align: "center" }); celda(ws, "D" + r, "Lector:", { size: 9, align: "right", border: false }); celda(ws, "E" + r, MX(nom(d.estudio.lector)), { bold: true, align: "center" }); r++;
    ws.mergeCells(`A${r}:B${r}`); celda(ws, "A" + r, "•  Palabras de conclusión (3 mins)", { bold: true, color: "8B1A1A" }); ws.mergeCells(`C${r}:D${r}`); celda(ws, "C" + r, `•  Canción ${d.c3} y oración`, { bold: true, color: "8B1A1A", align: "right" }); celda(ws, "E" + r, MX(nom(d.oracion2)), { bold: true, align: "center" }); r++;
    r++;
  }
  hojaImprimible(ws, false);
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
  h += `<div class="row" style="margin-top:12px">${cAdmin() ? `<button class="btn pri" id="nuevoA">+ Asignación</button>` : ""}${btnExcel("xlsAc", "Excel del mes")}</div>`;
  $("#cview").innerHTML = h; ms.bind(); bindTabs();
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
async function xlsAcomod(X) {
  const wb = new X.Workbook(); const ws = wb.addWorksheet("Acomodadores", { views: [{ showGridLines: false }] });
  ws.columns = [{ width: 12 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 26 }, { width: 18 }];
  let r = 1;
  const titulo = t => { ws.mergeCells(`A${r}:F${r}`); celda(ws, "A" + r, t, { bold: true, size: 13, border: false, fill: "FFF27A" }); r++; };
  for (const tipo of ["entre", "tb16", "tb18"]) {
    titulo(tipo === "entre" ? "Reunión de entre semana · acomodadores y micrófonos" : `Reunión fin de semana · horario ${tipo === "tb16" ? "4 pm" : "6:15 pm"}`);
    const cols = tipo === "entre" ? ["Fechas", "Acomodador", "Micrófonos", "Plataforma"] : ["Fechas", "Presidente", "Lector", "Acomodador", "Micrófonos", "Plataforma"];
    cols.forEach((t, i) => celda(ws, String.fromCharCode(65 + i) + r, t, { fill: "A8D8DC" })); r++;
    R("acomod").filter(x => x.d.reunion === tipo && x.k.startsWith(CG.mes)).sort((a, b) => a.k < b.k ? -1 : 1).forEach(x => {
      const mic = (x.d.microfonos || []).filter(Boolean).map(nomCorto).join(" - ");
      const vals = tipo === "entre" ? [corto(x.k), nomCorto(x.d.acomodador), mic, nomCorto(x.d.plataforma)] : [corto(x.k), nomCorto(x.d.presidente), nomCorto(x.d.lector), nomCorto(x.d.acomodador), mic, nomCorto(x.d.plataforma)];
      vals.forEach((v, i) => celda(ws, String.fromCharCode(65 + i) + r, v, { fill: "D6EEF0" })); r++;
    });
    r += 2;
  }
  hojaImprimible(ws, false);
  await descargar(wb, `Acomodadores ${mesNombre(CG.mes)}.xlsx`);
}

/* ================= INFORMES ================= */
let gInf = null;
function miPersona() { return CG.personas.find(p => norm(p.nombre) === norm(CG.me.nombre || "")); }
function vInf() {
  if (!cAdmin()) { $("#cview").innerHTML = vacio("Los informes solo los ven los administradores."); return; }
  if (!gInf) { const yo = miPersona(); gInf = yo && yo.encargado ? yo.horario + "|" + yo.grupo : "todos"; }
  const ms = mesSelector(vInf);
  const regs = R("informe").filter(r => r.k.startsWith(CG.mes + "|"));
  const inf = id => regs.find(r => r.d.persona === id);
  const lista = CG.personas.filter(p => gInf === "todos" || (p.horario + "|" + p.grupo) === gInf);
  const hechos = lista.filter(p => inf(p.id)).length;
  const part = lista.filter(p => inf(p.id) && inf(p.id).d.participo).length;
  const cursos = lista.reduce((s, p) => s + (inf(p.id) ? +inf(p.id).d.cursos || 0 : 0), 0);
  const horas = lista.reduce((s, p) => s + (inf(p.id) ? +inf(p.id).d.horas || 0 : 0), 0);
  let h = ms.html + `<div class="roles ctabs"><button class="chipo ${gInf === "todos" ? "" : "off"}" data-gi="todos">Todos</button>${["tb16", "tb18"].flatMap(hh => [1, 2, 3].map(g => `<button class="chipo ${gInf === hh + "|" + g ? "" : "off"}" data-gi="${hh}|${g}">G${g} · ${HOR[hh]}</button>`)).join("")}</div>
  <div class="kpis">${[[`${hechos}/${lista.length}`, "Entregados"], [part, "Participaron"], [cursos, "Cursos"], [horas, "Horas prec."]].map(([n, l]) => `<div class="kpi"><span class="n">${n}</span><span class="l">${l}</span></div>`).join("")}</div>
  <div class="bar" style="margin:10px 2px"><i style="width:${lista.length ? Math.round(hechos / lista.length * 100) : 0}%;background:var(--ok)"></i></div>
  <p class="note" style="margin:0 4px 10px">Toca <b>Sí</b> o <b>No</b> para marcar si participó. Las horas solo aplican a precursores (y a quien fue auxiliar ese mes).</p><div class="list">`;
  h += lista.map(p => { const r = inf(p.id); const d = r ? r.d : {}; const prec = p.precursor !== "no" || d.aux;
    return `<div class="card irow" data-ip="${p.id}"><div class="ihead"><b>${esc(p.nombre)}</b><span class="pchips">${p.precursor !== "no" ? `<span class="pill t-ok">${p.precursor === "auxiliar" ? "PA" : "PR"}</span>` : ""}${r ? "" : `<span class="pill t-warn">Falta</span>`}</span></div>
      <div class="icontrols"><div class="seg2"><button class="${d.participo === true ? "on" : ""}" data-v="si">Sí</button><button class="${d.participo === false ? "on no" : ""}" data-v="no">No</button></div>
      <label class="ic">Cursos <input type="number" min="0" inputmode="numeric" value="${d.cursos ?? ""}" data-f="cursos"></label>
      ${prec ? `<label class="ic">Horas <input type="number" min="0" inputmode="numeric" value="${d.horas ?? ""}" data-f="horas"></label>` : `<label class="ic chk"><input type="checkbox" data-f="aux" ${d.aux ? "checked" : ""}> Auxiliar</label>`}</div></div>`; }).join("");
  h += `</div><div class="row" style="margin-top:12px">${btnExcel("xlsInf", "Excel del mes")}</div>`;
  $("#cview").innerHTML = h; ms.bind();
  document.querySelectorAll("[data-gi]").forEach(b => b.onclick = () => { gInf = b.dataset.gi; vInf(); });
  document.querySelectorAll("[data-ip]").forEach(card => {
    const pid = card.dataset.ip;
    const guardar = async cambio => { const r = inf(pid); const nd = Object.assign({ persona: pid, mes: CG.mes, participo: null, cursos: 0, horas: null, aux: false }, r ? r.d : {}, cambio);
      try { await rpc("cong_reg_guardar", { p_modulo: "informe", p_clave: CG.mes + "|" + pid, p_id: r ? r.id : null, p_d: nd, p_aviso: null }); await cCargar(); vInf(); } catch (e) { toast(e.message); } };
    card.querySelectorAll("[data-v]").forEach(b => b.onclick = () => guardar({ participo: b.dataset.v === "si" }));
    card.querySelectorAll("[data-f]").forEach(i => i.onchange = () => guardar({ [i.dataset.f]: i.type === "checkbox" ? i.checked : (i.value === "" ? null : Math.max(0, +i.value)) }));
  });
  $("#xlsInf").onclick = () => conExcel(xlsInformes);
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
