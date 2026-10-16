/* Discursos Públicos · Congregación Tierra Baja
   Front sencillo (sin build) + Supabase vía funciones RPC protegidas por PIN. */
const SB_URL="https://pswgldarwsdgznxyegov.supabase.co";
const SB_KEY="sb_publishable_s77cAYroy7Q5XSZsvslQCQ_vHEAmk12";

const tit=n=>TITULOS[n-1]||"";
const noUsar=n=>tit(n)==="(No usar)";
const norm=s=>String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
const ESTADOS={sin:["Sin asignar","t-idle"],asig:["Asignado","t-info"],porc:["Por confirmar","t-warn"],conf:["Confirmado","t-ok"],planb:["Plan B","t-bad"],hecho:["Realizado","t-idle"]};
const hoyBogota=()=>new Date(Date.now()-5*3600e3).toISOString().slice(0,10);
let HOY=hoyBogota();

const I={
 check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
 clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
 alert:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.5v.1"/></svg>',
 empty:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5" stroke-dasharray="3 3"/></svg>',
 cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
 user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10" cy="8" r="3.5"/><path d="M3.5 20c.7-3.6 3.3-5.5 6.5-5.5 1.4 0 2.7.4 3.7 1.1M18 14v6M15 17h6"/></svg>',
 house:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 10 12 4l9 6M5 10v9M19 10v9M9.5 19v-5h5v5M3 20h18"/></svg>',
 paste:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h11M8 12h11M8 18h11"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>',
 wa:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5a9.4 9.4 0 0 0-8.1 14.2L2.6 21.5l4.9-1.3A9.4 9.4 0 1 0 12 2.5zm5.4 13.3c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.8-1.1-4.6-4-4.8-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.3 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.1.1.6-.1 1.2z"/></svg>',
 copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
 arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" style="width:16px;height:16px"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
 key:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l2 2M14 9l2 2"/></svg>'
};
const ICO_E={sin:I.empty,asig:I.cal,porc:I.clock,conf:I.check,planb:I.alert,hecho:I.check};

/* ---------- Almacenamiento local seguro ---------- */
const LS={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}},del:k=>{try{localStorage.removeItem(k)}catch(e){}}};

/* ---------- Backend ---------- */
let PIN=LS.get("dtb_pin"), DB={congs:[],hermanos:[],prog:[],log:[]}, rol=null;
async function rpc(fn,args){
  const r=await fetch(`${SB_URL}/rest/v1/rpc/${fn}`,{method:"POST",headers:{"apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY,"Content-Type":"application/json"},body:JSON.stringify({p_pin:PIN,...args})});
  const txt=await r.text();let j=null;try{j=txt?JSON.parse(txt):null}catch(e){}
  if(!r.ok)throw new Error((j&&j.message)||"No se pudo conectar. Revisa tu internet.");
  return j;
}
async function cargar(){
  const d=await rpc("app_data",{});
  rol=d.rol;
  DB={congs:d.congs||[],hermanos:(d.hermanos||[]).map(h=>({...h,bos:h.bos||[]})),prog:d.prog||[],log:d.log||[]};
  HOY=hoyBogota();
}
async function accion(fn,args,okMsg){
  document.body.classList.add("loading");
  try{await rpc(fn,args);await cargar();render();if(okMsg)toast(okMsg);return true}
  catch(e){toast(e.message);return false}
  finally{document.body.classList.remove("loading")}
}
const guardarProg=(p,aviso,k)=>accion("app_save_prog",{p_fecha:p.f,p_d:p.d||null,p_o:p.o||null,p_s:p.s||null,p_e:p.e,p_aviso:aviso||null,p_k:k||null});

/* ---------- Utilidades ---------- */
const H=id=>DB.hermanos.find(h=>h.id===id);
const C=id=>DB.congs.find(c=>c.id===id);
const MES=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const fd=f=>{const[y,m,d]=f.split("-").map(Number);return{d,m:MES[m-1],y,corto:`sáb. ${d} ${MES[m-1].slice(0,3)}`}};
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const dias=(a,b)=>Math.round((new Date(b)-new Date(a))/864e5);
const ini=n=>n.split(" ").filter(Boolean).map(x=>x[0]).slice(0,2).join("").toUpperCase();
const TONOS=["t-acc","t-ok","t-warn","t-bad","t-info","t-cyan"];
const tono=id=>TONOS[[...String(id)].reduce((a,c)=>a+c.charCodeAt(0),0)%TONOS.length];
const cname=id=>C(id)?.nombre||"Sin congregación";
function ultimaVez(n,excepto){return DB.prog.filter(x=>x.d===n&&x.f!==excepto&&x.e!=="sin").map(x=>x.f).sort().pop()||null}
function toast(t){const el=document.createElement("div");el.className="toast";el.textContent=t;document.body.appendChild(el);setTimeout(()=>el.remove(),2600)}
const $=s=>document.querySelector(s);
const esAdmin=()=>rol==="admin";

/* Sábados: los guardados + los próximos que aún no existen */
let semanas=10;
function sabados(){
  const map=new Map(DB.prog.map(p=>[p.f,p]));
  const d=new Date(HOY+"T12:00:00");d.setDate(d.getDate()+((6-d.getDay()+7)%7));
  for(let i=0;i<semanas;i++){const f=d.toISOString().slice(0,10);if(!map.has(f))map.set(f,{f,d:null,o:null,s:null,e:"sin",virtual:true});d.setDate(d.getDate()+7)}
  return [...map.values()].sort((a,b)=>a.f<b.f?-1:1);
}
const getSab=f=>sabados().find(x=>x.f===f)||{f,d:null,o:null,s:null,e:"sin"};

/* ---------- Login con PIN ---------- */
let entrada="";
function pintaLogin(msg){
  $("#login").hidden=false;$("#app").hidden=true;
  $("#dots").innerHTML=Array.from({length:Math.max(4,entrada.length)},(_,i)=>`<i class="${i<entrada.length?"on":""}"></i>`).join("");
  $("#err").textContent=msg||"";
  $("#pad").innerHTML=[1,2,3,4,5,6,7,8,9,"borrar",0,"entrar"].map(k=>`<button data-k="${k}" class="${typeof k==="string"?"ghost":""}">${k==="borrar"?"Borrar":k==="entrar"?"Entrar":k}</button>`).join("");
  $("#pad").querySelectorAll("button").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();tecla(b.dataset.k)}));
}
async function tecla(k){
  if(k==="borrar"){entrada=entrada.slice(0,-1);return pintaLogin()}
  if(k==="entrar")return intentar();
  if(entrada.length<8){entrada+=k;pintaLogin()}
}
document.addEventListener("keydown",e=>{if(!$("#login").hidden){if(/^[0-9]$/.test(e.key))tecla(e.key);else if(e.key==="Backspace")tecla("borrar");else if(e.key==="Enter")tecla("entrar")}});
async function intentar(){
  if(entrada.length<4)return pintaLogin("El PIN tiene mínimo 4 números");
  PIN=entrada;$("#err").textContent="Verificando…";
  try{await cargar();LS.set("dtb_pin",PIN);entrada="";iniciar()}
  catch(e){PIN=null;entrada="";pintaLogin(e.message)}
}
function salir(){LS.del("dtb_pin");PIN=null;rol=null;entrada="";pintaLogin()}

/* ---------- App ---------- */
let vista="cal",filtroE=null;
function iniciar(){
  $("#login").hidden=true;$("#app").hidden=false;
  $("#subt").textContent=`Tierra Baja · ${esAdmin()?"Responsable":"Consulta"}`;
  render();
}
function setVista(v){vista=v;document.querySelectorAll("nav button").forEach(x=>x.classList.toggle("on",x.dataset.v===v));if(v==="avisos"){LS.set("dtb_leidos",String(DB.log.length?DB.log[0].t:""))}render();scrollTo(0,0)}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>setVista(b.dataset.v));
$("#campana").onclick=()=>setVista("avisos");
$("#tema").onclick=()=>{const r=document.documentElement,dark=r.dataset.theme?r.dataset.theme==="dark":matchMedia("(prefers-color-scheme: dark)").matches;r.dataset.theme=dark?"light":"dark";LS.set("dtb_tema",r.dataset.theme)};
{const t=LS.get("dtb_tema");if(t)document.documentElement.dataset.theme=t}
function updBadge(){const ult=LS.get("dtb_leidos")||"";const n=DB.log.filter(l=>l.t>ult).length;$("#nb").innerHTML=n>0?`<span class="b">${n>9?"9+":n}</span>`:""}
function render(){
  $("#fab").hidden=!esAdmin();
  updBadge();
  ({cal:vCal,disc:vDisc,her:vHer,cong:vCong,avisos:vAvisos})[vista]();
}

/* ---------- SÁBADOS ---------- */
function vCal(){
  const todos=sabados(),fut=todos.filter(p=>p.f>=HOY);
  const cnt=k=>fut.filter(p=>p.e===k).length;
  let h=`<div class="kpis">${[["conf","Confirmados"],["porc","Por confirmar"],["sin","Sin asignar"],["planb","Plan B"]].map(([k,l])=>`<button class="kpi ${filtroE===k?"sel":""}" data-k="${k}"><span class="tile ${ESTADOS[k][1]}">${ICO_E[k]}</span><span class="n">${cnt(k)}</span><span class="l">${l}</span></button>`).join("")}</div>`;
  const prox=fut[0];
  if(prox){
    const F=fd(prox.f),o=H(prox.o),dd=dias(HOY,prox.f);
    const txt={conf:"Todo listo. El orador confirmó.",porc:"Recordatorio enviado. Esperando respuesta.",asig:dd<=3?"Hoy es buen día para enviarle el recordatorio.":"Asignado. Envía el recordatorio el jueves o viernes.",sin:"Todavía no hay discurso asignado.",planb:"El orador no puede. Revisa el suplente."}[prox.e]||"";
    const pct={sin:5,asig:35,porc:66,conf:100,planb:20}[prox.e]||0;
    const col={sin:"var(--idle)",asig:"var(--info)",porc:"var(--warn)",conf:"var(--ok)",planb:"var(--bad)"}[prox.e];
    h+=`<div class="hero" role="button" tabindex="0" data-f="${prox.f}" style="cursor:pointer">
      <div class="head"><span class="tile ${ESTADOS[prox.e][1]}">${ICO_E[prox.e]}</span><div style="min-width:0"><h2>${dd===0?"Hoy":"Sábado "+F.d}${dd>0?` · en ${dd} día${dd===1?"":"s"}`:""}</h2><div class="msg">${txt}</div></div></div>
      ${prox.d?`<div style="font-weight:700"><span style="color:var(--accent)">#${prox.d}</span> ${esc(tit(prox.d))}</div><div class="note">${o?esc(o.nombre)+" · "+esc(cname(o.cong)):""}</div>`:""}
      <div class="bar"><i style="width:${pct}%;background:${col}"></i></div></div>`;
  }
  h+=`<div class="label">${filtroE?ESTADOS[filtroE][0]+' · <button class="chipo" style="padding:3px 10px;font-size:12px;letter-spacing:0" id="qf">Quitar filtro ✕</button>':"Programa"}</div><div class="list">`;
  const pasados=todos.filter(p=>p.f<HOY).slice(-3);
  const lista=(filtroE?fut.filter(p=>p.e===filtroE):[...pasados,...fut]);
  let mesAnt="";
  lista.forEach(p=>{
    const F=fd(p.f),o=H(p.o),[et,ec]=ESTADOS[p.e];
    if(!filtroE&&F.m!==mesAnt){h+=`<div class="note" style="font-weight:800;margin:8px 4px 0;text-transform:capitalize">${F.m} ${F.y}</div>`;mesAnt=F.m}
    h+=`<button class="sat ${p.f<HOY?"past":""}" data-f="${p.f}">
      <div class="dbox ${ec}"><div class="d">${F.d}</div><div class="w">${F.m.slice(0,3)}</div></div>
      <div class="tt">${p.d?`<span class="num">#${p.d}</span>${esc(tit(p.d))}`:`<span style="color:var(--muted)">${esAdmin()?"Toca para asignar":"Por asignar"}</span>`}
        <div class="meta"><span>${o?esc(o.nombre)+" · "+esc(cname(o.cong)):"Sin orador"}</span><span class="pill ${ec}">${et}</span></div></div></button>`;
  });
  if(!lista.length)h+=`<div class="empty">No hay sábados en este estado.</div>`;
  h+=`</div>`;
  if(!filtroE)h+=`<button class="btn line" style="width:100%;margin-top:12px" id="mas">Ver más sábados</button>`;
  $("#view").innerHTML=h;
  document.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>abrir(b.dataset.f));
  document.querySelectorAll(".kpi").forEach(b=>b.onclick=()=>{filtroE=filtroE===b.dataset.k?null:b.dataset.k;vCal()});
  const qf=$("#qf");if(qf)qf.onclick=()=>{filtroE=null;vCal()};
  const m=$("#mas");if(m)m.onclick=()=>{semanas+=8;vCal()};
}

/* ---------- HOJAS ---------- */
function hoja(html,onMount){
  const bg=document.createElement("div");bg.className="sheet-bg";
  bg.innerHTML=`<div class="sheet" role="dialog"><div class="grab"></div>${html}</div>`;
  document.body.appendChild(bg);
  const close=()=>{bg.remove();render()};
  bg.onclick=e=>{if(e.target===bg)close()};
  bg.querySelectorAll("[data-close]").forEach(b=>b.onclick=close);
  onMount&&onMount(bg,close);
  return bg;
}
function copiar(texto,el){const fb=()=>{if(el){const r=document.createRange();r.selectNodeContents(el);getSelection().removeAllRanges();getSelection().addRange(r)}toast("Texto seleccionado, cópialo")};try{navigator.clipboard.writeText(texto).then(()=>toast("Mensaje copiado")).catch(fb)}catch(e){fb()}}

function pickerDiscurso(cont,actual,onPick){
  cont.innerHTML=`<input placeholder="Número o palabra (ej. 103, familia)" aria-label="Buscar discurso"><div class="res"></div>`;
  const inp=cont.querySelector("input"),res=cont.querySelector(".res");
  const pinta=()=>{const q=norm(inp.value.trim());let n=0,out="";
    for(let i=1;i<=TITULOS.length&&n<6;i++){if(noUsar(i))continue;
      if(q&&!(String(i)===q||(q.length>1&&String(i).startsWith(q))||norm(tit(i)).includes(q)))continue;
      if(!q&&i!==actual)continue;
      const uv=ultimaVez(i),rec=uv&&Math.abs(dias(uv,HOY))<365;
      const tiene=DB.hermanos.filter(h=>h.bos.includes(i)).length;
      out+=`<button data-n="${i}" class="${i===actual?"on":""}"><b>#${i}</b><span>${esc(tit(i))}</span><small>${rec?"⚠ Dado el "+fd(uv).corto+" · ":""}${tiene} orador${tiene===1?"":"es"} lo tiene${tiene===1?"":"n"}</small></button>`;n++}
    res.innerHTML=out||(q?`<div class="note">Sin resultados.</div>`:"");
    res.querySelectorAll("button").forEach(b=>b.onclick=()=>onPick(+b.dataset.n));
  };
  inp.oninput=pinta;pinta();
}
function chipsOradores(d,sel,excluir){
  const l=DB.hermanos.filter(h=>h.id!==excluir).sort((a,b)=>(d&&b.bos.includes(d))-(d&&a.bos.includes(d)));
  if(!l.length)return`<span class="note">Aún no hay oradores registrados.</span>`;
  return l.map(h=>`<button class="pk ${sel===h.id?"on":""} ${d&&h.bos.includes(d)?"":"star"}" data-h="${h.id}">${esc(h.nombre)}<small>${esc(cname(h.cong))}${d&&h.bos.includes(d)?" · lo tiene ✓":""}</small></button>`).join("");
}
function msgRecordatorio(p){const o=H(p.o),F=fd(p.f);return`Buen día, hermano ${o.nombre.split(" ")[0]}. Le recuerdo con cariño que este sábado ${F.d} de ${F.m} tiene a cargo el discurso público n.º ${p.d}: "${tit(p.d)}" en la congregación Tierra Baja.\n¿Nos confirma si cuenta con poder venir? Responda SÍ o NO.\n¡Muchas gracias!`}
function msgAncianos(p,txt){const F=fd(p.f);return`*Discursos públicos · sáb. ${F.d} ${F.m}*\n${txt}\nDiscurso n.º ${p.d}: "${tit(p.d)}"`}
const telWa=t=>{t=String(t||"").replace(/\D/g,"");return t.length===10?"57"+t:t};

function avisarAncianos(m){
  hoja(`<div class="shead"><h2>Avisar a los ancianos</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
   <div class="note">Ya quedó registrado en la app. Envíalo también al grupo de WhatsApp de ancianos:</div>
   <div class="wmsg" id="mA">${esc(m)}</div>
   <div class="row"><button class="btn line" id="cp">${I.copy} Copiar</button><a class="btn ok" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(m)}">${I.wa} Enviar al grupo</a></div>`,
   bg=>{bg.querySelector("#cp").onclick=()=>copiar(m,bg.querySelector("#mA"))});
}

function abrir(f){
  const p=getSab(f),F=fd(f),o=H(p.o),s=H(p.s);
  const idx=p.e==="conf"||p.e==="hecho"?2:p.e==="porc"?1:p.e==="asig"||p.e==="planb"?0:-1;
  const edit=esAdmin()&&p.e!=="hecho";
  let h=`<div class="shead"><span class="pill ${ESTADOS[p.e][1]}">${ESTADOS[p.e][0]}</span><button class="x" data-close aria-label="Cerrar">✕</button></div>
  <h2>Sábado ${F.d} de ${F.m}</h2>
  <div class="steps"><span class="${idx>=0?"on":""}">Asignado</span><span class="${idx>=1?"on":""}">Recordado</span><span class="${idx>=2?"on":""}">Confirmado</span></div>
  <div class="card"><div style="font-weight:800">${p.d?`<span style="color:var(--accent)">#${p.d}</span> ${esc(tit(p.d))}`:"Discurso por definir"}</div>
  <div class="note" style="margin-top:6px">Orador: <b>${o?esc(o.nombre)+" · "+esc(cname(o.cong)):"—"}</b><br>Suplente: <b>${s?esc(s.nombre):"—"}</b></div>
  ${edit?`<button class="btn line" style="width:100%;margin-top:12px;padding:11px" id="cambiar">${p.d?"Cambiar asignación":"Asignar ahora"}</button>`:""}</div>`;
  if(esAdmin()&&p.e!=="hecho"&&o&&p.d){
    if(p.e==="asig"||p.e==="porc"){
      const m=msgRecordatorio(p);
      h+=`<span class="flab">Recordatorio al orador</span><div class="wmsg" id="mR">${esc(m)}</div>
      <div class="row"><button class="btn line" id="cpR">${I.copy} Copiar</button><a class="btn ok" target="_blank" rel="noopener" href="https://wa.me/${telWa(o.tel)}?text=${encodeURIComponent(m)}" id="waR">${I.wa} WhatsApp</a></div>
      ${!o.tel?`<div class="warnl">${I.alert.replace("<svg",'<svg style="width:16px;height:16px"')} Este orador no tiene celular registrado.</div>`:""}
      <span class="flab" style="margin-top:6px">¿Qué respondió?</span>
      <div class="row"><button class="btn pri" id="si">${I.check} Confirmó</button><button class="btn bad" id="no">No puede</button></div>`;
    }
    if(p.e==="conf")h+=`<button class="btn bad" id="no">Canceló a última hora</button>${f<=HOY?`<button class="btn line" id="hecho">Marcar realizado</button>`:""}`;
    if(p.e==="planb")h+=`<div class="hero" style="margin:0"><div class="head"><span class="tile t-bad">${I.alert}</span><div><h2>Plan B en curso</h2><div class="msg">${s?`Llama a ${esc(s.nombre)} y confírmalo.`:"No hay suplente. Toca “Cambiar asignación”."}</div></div></div></div>${s?`<button class="btn pri" id="si">${I.check} Suplente confirmado</button>`:""}`;
  }
  if(p.e==="hecho")h+=`<div class="note">Este discurso ya se pronunció.</div>`;
  hoja(h,(bg,close)=>{
    const q=x=>bg.querySelector(x);
    if(q("#cambiar"))q("#cambiar").onclick=()=>{bg.remove();asignar(f)};
    const marcarR=async()=>{if(p.e==="asig"){await guardarProg({...p,e:"porc"},`Recordatorio enviado a ${o.nombre} por el n.º ${p.d} del ${F.corto}.`,"porc")}};
    if(q("#cpR"))q("#cpR").onclick=()=>{copiar(q("#mR").textContent,q("#mR"));marcarR()};
    if(q("#waR"))q("#waR").addEventListener("click",()=>{bg.remove();marcarR()});
    if(q("#si"))q("#si").onclick=async()=>{const plan=p.e==="planb",quien=plan?s:o;
      const np={...p,e:"conf",o:plan?p.s:p.o,s:plan?null:p.s};
      const m=msgAncianos(np,`✅ ${quien.nombre} (${cname(quien.cong)}) CONFIRMÓ.`);
      bg.remove();if(await guardarProg(np,m,"conf"))avisarAncianos(m)};
    if(q("#no"))q("#no").onclick=async()=>{const m=msgAncianos(p,`⚠️ ${o.nombre} NO puede venir. ${s?"Entra el suplente: "+s.nombre+".":"Se está buscando reemplazo."}`);
      bg.remove();if(await guardarProg({...p,e:"planb"},m,"planb"))avisarAncianos(m)};
    if(q("#hecho"))q("#hecho").onclick=()=>{bg.remove();guardarProg({...p,e:"hecho"},`Realizado: n.º ${p.d} por ${o.nombre} (${cname(o.cong)}).`,"hecho")};
  });
}

/* Asignar en 3 toques */
function asignar(fIni){
  const libres=sabados().filter(p=>p.f>=HOY&&p.e!=="hecho");
  const st={f:fIni||(libres.find(p=>p.e==="sin")||libres[0])?.f,d:null,o:null,s:null};
  const cargarSt=()=>{const p=getSab(st.f);st.d=p.d;st.o=p.o;st.s=p.s};cargarSt();
  const bg=hoja(`<div class="shead"><h2>Asignar discurso</h2><button class="x" data-close aria-label="Cerrar">✕</button></div><div id="body" style="display:flex;flex-direction:column;gap:12px"></div>`);
  const body=bg.querySelector("#body");
  const pinta=()=>{
    const ops=libres.slice(0,10);if(st.f&&!ops.find(p=>p.f===st.f))ops.unshift(getSab(st.f));
    body.innerHTML=`
      <div><span class="flab">1 · Sábado</span><div class="picks">${ops.map(p=>`<button class="pk ${st.f===p.f?"on":""}" data-sf="${p.f}">${fd(p.f).corto}<small>${ESTADOS[p.e][0]}</small></button>`).join("")}</div></div>
      <div><span class="flab">2 · Discurso</span><div id="pd"></div></div>
      ${st.d?`<div><span class="flab">3 · Orador</span><div class="picks" id="po">${chipsOradores(st.d,st.o)}</div><div class="note" style="margin-top:8px">Arriba los que ya tienen el bosquejo. ¿No está? <button class="chipo" style="padding:3px 10px;font-size:12px" id="nuevoH">+ Nuevo orador</button></div></div>`:""}
      ${st.o?`<div><span class="flab">Suplente (opcional)</span><div class="picks" id="ps">${chipsOradores(st.d,st.s,st.o)}</div></div>`:""}
      <button class="btn pri" id="ok" ${st.f&&st.d&&st.o?"":"disabled"}>Guardar asignación</button>`;
    pickerDiscurso(body.querySelector("#pd"),st.d,n=>{st.d=n;pinta()});
    body.querySelectorAll("[data-sf]").forEach(b=>b.onclick=()=>{st.f=b.dataset.sf;cargarSt();pinta()});
    body.querySelectorAll("#po [data-h]").forEach(b=>b.onclick=()=>{st.o=b.dataset.h;if(st.s===st.o)st.s=null;pinta()});
    body.querySelectorAll("#ps [data-h]").forEach(b=>b.onclick=()=>{st.s=st.s===b.dataset.h?null:b.dataset.h;pinta()});
    const nh=body.querySelector("#nuevoH");if(nh)nh.onclick=()=>{bg.remove();nuevoOrador(()=>asignar(st.f))};
    body.querySelector("#ok").onclick=async()=>{
      const p=getSab(st.f);const cambio=p.o!==st.o||p.d!==st.d;
      const e=(cambio||p.e==="sin")?"asig":p.e;
      bg.remove();
      await guardarProg({f:st.f,d:st.d,o:st.o,s:st.s,e},`Asignación ${fd(st.f).corto}: n.º ${st.d} · ${H(st.o).nombre}${st.s?" · suplente "+H(st.s).nombre:""}.`,"asig");
      toast("Asignación guardada")};
  };
  pinta();
}

function nuevoOrador(after,editar){
  const h0=editar?H(editar):null;
  const st={cong:h0?.cong||DB.congs[0]?.id,nuevaC:!DB.congs.length};
  const bg=hoja(`<div class="shead"><h2>${h0?"Editar orador":"Nuevo orador"}</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
    <div><span class="flab">Nombre</span><input id="nN" placeholder="Ej. Pedro Salas" autocomplete="off" value="${esc(h0?.nombre||"")}"></div>
    <div><span class="flab">Congregación</span><div class="picks" id="pc"></div><input id="nC" placeholder="Nombre de la nueva congregación" ${st.nuevaC?"":"hidden"} style="margin-top:8px"></div>
    <div><span class="flab">Celular (WhatsApp)</span><input id="nT" inputmode="tel" placeholder="300 000 0000" value="${esc(h0?.tel||"")}"></div>
    <div><span class="flab">Bosquejos que tiene</span><input id="nB" inputmode="numeric" placeholder="Ej. 1, 23, 99" value="${esc((h0?.bos||[]).join(", "))}"><div class="chips" id="pb"></div></div>
    <button class="btn pri" id="ok">Guardar orador</button>
    ${h0?`<button class="btn bad" id="del">Quitar de la lista</button>`:""}`,(bg)=>{
    const q=x=>bg.querySelector(x);
    const pc=()=>{q("#pc").innerHTML=DB.congs.map(c=>`<button class="pk ${!st.nuevaC&&st.cong===c.id?"on":""}" data-c="${c.id}">${esc(c.nombre)}</button>`).join("")+`<button class="pk star ${st.nuevaC?"on":""}" data-c="__n">+ Nueva</button>`;
      q("#pc").querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{if(b.dataset.c==="__n"){st.nuevaC=true}else{st.nuevaC=false;st.cong=b.dataset.c}q("#nC").hidden=!st.nuevaC;pc();if(st.nuevaC)q("#nC").focus()})};
    pc();
    const nums=()=>[...new Set(q("#nB").value.split(/[^0-9]+/).map(Number).filter(x=>x>0&&x<=TITULOS.length&&!noUsar(x)))];
    const pb=()=>{q("#pb").innerHTML=nums().map(n=>`<span class="cn" title="${esc(tit(n))}">#${n} ${esc(tit(n).slice(0,26))}${tit(n).length>26?"…":""}</span>`).join("")};
    q("#nB").oninput=pb;pb();
    if(!h0)setTimeout(()=>q("#nN").focus(),250);
    q("#ok").onclick=async()=>{const n=q("#nN").value.trim();if(!n){toast("Escribe el nombre");q("#nN").focus();return}
      document.body.classList.add("loading");
      try{
        let cid=st.cong;
        if(st.nuevaC){const cn=q("#nC").value.trim();if(!cn){toast("Escribe la congregación");return}cid=await rpc("app_save_cong",{p_nombre:cn,p_ciudad:""})}
        await rpc("app_save_hermano",{p_nombre:n,p_cong:cid||null,p_tel:q("#nT").value.replace(/\D/g,""),p_bos:nums(),p_id:h0?.id||null});
        await cargar();bg.remove();toast(h0?"Orador actualizado":"Orador agregado");if(after)after();else render();
      }catch(e){toast(e.message)}finally{document.body.classList.remove("loading")}};
    if(q("#del"))q("#del").onclick=()=>{q("#del").outerHTML=`<div class="row"><button class="btn line" id="nod">Cancelar</button><button class="btn bad" id="sid">Sí, quitar a ${esc(h0.nombre.split(" ")[0])}</button></div>`;
      q("#nod").onclick=()=>{bg.remove();render()};
      q("#sid").onclick=async()=>{bg.remove();await accion("app_quitar_hermano",{p_id:h0.id},"Orador quitado")}};
  });
}
function nuevaCong(editar){
  const c0=editar?C(editar):null;
  hoja(`<div class="shead"><h2>${c0?"Editar congregación":"Nueva congregación"}</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
    <div><span class="flab">Nombre</span><input id="cN" placeholder="Ej. La Boquilla" value="${esc(c0?.nombre||"")}"></div>
    <div><span class="flab">Ciudad</span><input id="cC" value="${esc(c0?.ciudad||"Cartagena")}"></div>
    <button class="btn pri" id="ok">Guardar congregación</button>`,(bg)=>{
    if(!c0)setTimeout(()=>bg.querySelector("#cN").focus(),250);
    bg.querySelector("#ok").onclick=async()=>{const n=bg.querySelector("#cN").value.trim();if(!n){toast("Escribe el nombre");return}
      bg.remove();await accion("app_save_cong",{p_nombre:n,p_ciudad:bg.querySelector("#cC").value.trim(),p_id:c0?.id||null},c0?"Congregación actualizada":"Congregación agregada")};
  });
}
function pegarVarios(){
  hoja(`<div class="shead"><h2>Pegar varios oradores</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
    <div class="note">Uno por línea: <b>Nombre ; Congregación ; Celular ; bosquejos</b>. Si la congregación no existe, se crea sola. Sirve para pegar desde WhatsApp o Excel.</div>
    <textarea id="tx" placeholder="Pedro Salas; La Boquilla; 3001234567; 1, 23, 99&#10;Luis Díaz; Crespo; 3019876543; 50, 140"></textarea>
    <div class="note" id="prev"></div>
    <button class="btn pri" id="ok">Importar</button>`,(bg,close)=>{
    const q=x=>bg.querySelector(x);
    const parse=()=>q("#tx").value.split("\n").map(l=>l.split(/[;\t]/).map(x=>x.trim())).filter(c=>c[0]);
    q("#tx").oninput=()=>{const r=parse();q("#prev").textContent=r.length?`${r.length} orador${r.length===1?"":"es"} listo${r.length===1?"":"s"} para importar.`:""};
    q("#ok").onclick=async()=>{const r=parse();if(!r.length){toast("Pega al menos una línea");return}
      document.body.classList.add("loading");
      try{
        const cache=new Map(DB.congs.map(c=>[norm(c.nombre),c.id]));
        for(const c of r){
          let cid=null;
          if(c[1]){cid=cache.get(norm(c[1]));if(!cid){cid=await rpc("app_save_cong",{p_nombre:c[1],p_ciudad:""});cache.set(norm(c[1]),cid)}}
          await rpc("app_save_hermano",{p_nombre:c[0],p_cong:cid,p_tel:(c[2]||"").replace(/\D/g,""),p_bos:(c[3]||"").split(/[^0-9]+/).map(Number).filter(x=>x>0&&x<=TITULOS.length)});
        }
        await cargar();close();toast(`${r.length} importado${r.length===1?"":"s"}`);
      }catch(e){toast(e.message)}finally{document.body.classList.remove("loading")}};
  });
}

$("#fab").onclick=()=>{
  hoja(`<div class="shead"><h2>¿Qué quieres agregar?</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
  <div class="qa">
    <button data-a="asig"><span class="tile t-acc">${I.cal}</span><b>Asignar sábado</b><small>Discurso + orador en 3 toques</small><span class="go" style="color:var(--accent)">Asignar ${I.arrow}</span></button>
    <button data-a="her"><span class="tile t-ok">${I.user}</span><b>Orador</b><small>Nombre, congregación y bosquejos</small><span class="go" style="color:var(--ok)">Agregar ${I.arrow}</span></button>
    <button data-a="cong"><span class="tile t-warn">${I.house}</span><b>Congregación</b><small>De dónde vienen los oradores</small><span class="go" style="color:var(--warn)">Agregar ${I.arrow}</span></button>
    <button data-a="paste"><span class="tile t-cyan">${I.paste}</span><b>Pegar varios</b><small>Lista desde WhatsApp o Excel</small><span class="go" style="color:var(--cyan)">Pegar ${I.arrow}</span></button>
  </div>`,(bg)=>{bg.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{bg.remove();({asig:()=>asignar(),her:()=>nuevoOrador(),cong:()=>nuevaCong(),paste:pegarVarios})[b.dataset.a]()})});
};

/* ---------- BOSQUEJOS ---------- */
let filtroD="",modoD="todos";
function vDisc(){
  $("#view").innerHTML=`<div class="roles" style="margin-bottom:12px">${[["todos","Todos"],["libres","Sin dar en 1 año"],["dados","Ya programados"]].map(([k,l])=>`<button class="chipo ${modoD===k?"":"off"}" data-m="${k}">${l}</button>`).join("")}</div>
  <input id="bq" placeholder="Buscar por número o palabra…" value="${esc(filtroD)}" aria-label="Buscar bosquejo">
  <div class="card" style="margin-top:12px;padding-block:4px" id="ld"></div>`;
  document.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{modoD=b.dataset.m;vDisc()});
  const pinta=()=>{const q=norm(filtroD);let out="";
    TITULOS.forEach((t,i)=>{const n=i+1,uv=ultimaVez(n);
      if(q&&!(String(n)===q||norm(t).includes(q)))return;
      const rec=uv&&dias(uv,HOY)<365;
      if(modoD==="libres"&&(rec||noUsar(n)))return;
      if(modoD==="dados"&&!uv)return;
      const prep=DB.hermanos.filter(h=>h.bos.includes(n)).map(h=>h.nombre.split(" ")[0]);
      out+=`<div class="disc ${noUsar(n)?"x":""}"><div class="n">${n}</div><div style="font-weight:600">${esc(t)}<small>${uv?(uv>=HOY?"Programado: ":"Última vez: ")+fd(uv).corto+" "+fd(uv).y:"Sin registro"}${prep.length?" · Lo tienen: "+esc(prep.join(", ")):""}</small></div></div>`});
    $("#ld").innerHTML=out||`<div class="empty">Nada coincide.</div>`};
  $("#bq").oninput=e=>{filtroD=e.target.value;pinta()};pinta();
}

/* ---------- ORADORES ---------- */
function vHer(){
  let h=`<div class="label" style="margin-top:4px">Oradores · ${DB.hermanos.length}</div>`;
  if(!DB.hermanos.length)h+=`<div class="card empty">Aún no hay oradores.${esAdmin()?"<br>Agrégalos uno a uno o pega la lista completa.":""}</div>`;
  h+=`<div class="list">`;
  DB.hermanos.forEach(x=>{const n=DB.prog.filter(p=>p.o===x.id&&p.f>=HOY).length;
    h+=`<div class="card person" ${esAdmin()?`data-eh="${x.id}" style="cursor:pointer"`:""}><span class="av ${tono(x.id)}">${esc(ini(x.nombre))}</span><div style="min-width:0">
      <div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(x.nombre)}</b>${n?`<span class="pill t-info">${n} próximo${n===1?"":"s"}</span>`:""}</div>
      <div class="note">${esc(cname(x.cong))}${x.tel?" · "+esc(x.tel):""}</div>
      <div class="chips">${x.bos.slice().sort((a,b)=>a-b).map(b=>`<span class="cn" title="${esc(tit(b))}">#${b}</span>`).join("")||'<span class="note">Sin bosquejos registrados</span>'}</div></div></div>`});
  h+=`</div>`;
  if(esAdmin())h+=`<div class="row" style="margin-top:12px"><button class="btn pri" id="a1">+ Orador</button><button class="btn line" id="a2">${I.paste} Pegar varios</button></div>`;
  $("#view").innerHTML=h;
  if($("#a1")){$("#a1").onclick=()=>nuevoOrador();$("#a2").onclick=pegarVarios}
  document.querySelectorAll("[data-eh]").forEach(e=>e.onclick=()=>nuevoOrador(null,e.dataset.eh));
}
/* ---------- CONGREGACIONES ---------- */
function vCong(){
  let h=`<div class="label" style="margin-top:4px">Congregaciones · ${DB.congs.length}</div><div class="list">`;
  DB.congs.forEach(c=>{const hs=DB.hermanos.filter(x=>x.cong===c.id);
    h+=`<div class="card person" ${esAdmin()?`data-ec="${c.id}" style="cursor:pointer"`:""}><span class="av ${tono(c.id)}">${I.house.replace("<svg",'<svg style="width:20px;height:20px"')}</span><div><b>${esc(c.nombre)}</b><div class="note">${esc(c.ciudad||"—")} · ${hs.length} orador${hs.length===1?"":"es"}</div>
    ${hs.length?`<div class="chips">${hs.map(x=>`<span class="cn">${esc(x.nombre)}</span>`).join("")}</div>`:""}</div></div>`});
  h+=`</div>`;
  if(esAdmin())h+=`<button class="btn pri" style="width:100%;margin-top:12px" id="a1">+ Congregación</button>`;
  $("#view").innerHTML=h;
  if($("#a1"))$("#a1").onclick=()=>nuevaCong();
  document.querySelectorAll("[data-ec]").forEach(e=>e.onclick=()=>nuevaCong(e.dataset.ec));
}
/* ---------- AVISOS + AJUSTES ---------- */
function vAvisos(){
  let h=`<div class="label" style="margin-top:4px">Avisos</div>
  <p class="note" style="margin:0 4px 12px">Cada asignación, confirmación o cambio queda registrado aquí para todos los ancianos.</p>
  <div class="log">${DB.log.length?DB.log.map(l=>`<div class="card"><span class="tile ${(ESTADOS[l.k]||ESTADOS.sin)[1]}">${ICO_E[l.k]||I.empty}</span><div style="min-width:0"><time>${esc(l.t)}</time><div style="white-space:pre-wrap;font-weight:600;font-size:14px">${esc(l.m.replace(/\*/g,""))}</div></div></div>`).join(""):`<div class="card empty">Todavía no hay avisos.</div>`}</div>
  <div class="label">Cuenta</div>
  <div class="card" style="display:flex;flex-direction:column;gap:10px">
    <div class="note">Entraste como <b>${esAdmin()?"responsable":"consulta"}</b>.</div>
    ${esAdmin()?`<div class="row"><button class="btn line" id="pc">${I.key} PIN de consulta</button><button class="btn line" id="pa">${I.key} Mi PIN</button></div>`:""}
    <button class="btn bad" id="out">Salir</button>
  </div>`;
  $("#view").innerHTML=h;
  $("#out").onclick=salir;
  const cambiar=tipo=>hoja(`<div class="shead"><h2>${tipo==="consulta"?"PIN de consulta":"PIN del responsable"}</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
    <div class="note">${tipo==="consulta"?"Es el que usan los ancianos para ver el programa. Al cambiarlo, deben entrar con el nuevo.":"Es tu PIN para hacer cambios. Usa uno distinto al de consulta."}</div>
    <div><span class="flab">Nuevo PIN (4 a 8 números)</span><input id="np" inputmode="numeric" maxlength="8" autocomplete="off"></div>
    <button class="btn pri" id="ok">Guardar PIN</button>`,(bg)=>{
      bg.querySelector("#ok").onclick=async()=>{const v=bg.querySelector("#np").value.trim();if(!/^[0-9]{4,8}$/.test(v)){toast("Usa de 4 a 8 números");return}
        try{await rpc("app_cambiar_pin",{p_tipo:tipo,p_nuevo:v});if(tipo==="admin"){PIN=v;LS.set("dtb_pin",v)}bg.remove();toast("PIN actualizado")}catch(e){toast(e.message)}}});
  if($("#pc")){$("#pc").onclick=()=>cambiar("consulta");$("#pa").onclick=()=>cambiar("admin")}
}

/* ---------- Arranque y refresco ---------- */
async function refrescar(){if(!PIN||$("#app").hidden||document.querySelector(".sheet-bg"))return;try{await cargar();render()}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)refrescar()});
setInterval(refrescar,60000);
(async()=>{
  if(PIN){try{await cargar();iniciar();return}catch(e){LS.del("dtb_pin");PIN=null}}
  pintaLogin();
})();
