/* Discursos Públicos · Congregación Tierra Baja (grupos 4:00 PM y 6:15 PM)
   Front sencillo (sin build) + Supabase vía funciones RPC protegidas por PIN. */
const SB_URL="https://pswgldarwsdgznxyegov.supabase.co";
const SB_KEY="sb_publishable_s77cAYroy7Q5XSZsvslQCQ_vHEAmk12";

const tit=n=>TITULOS[n-1]||"";
const noUsar=n=>tit(n)==="(No usar)";
const norm=s=>String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
const ESTADOS={sin:["Sin asignar","t-idle"],asig:["Asignado","t-info"],porc:["Por confirmar","t-warn"],conf:["Confirmado","t-ok"],planb:["Plan B","t-bad"],hecho:["Realizado","t-idle"],evento:["Sin reunión","t-warn"]};
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
let PIN=LS.get("dtb_pin"), DB={congs:[],hermanos:[],prog:[],log:[]}, rol=null, GRUPO={id:"",nombre:"Tierra Baja",hora:""}, ETIQ="";
async function rpc(fn,args){
  let r;try{r=await fetch(`${SB_URL}/rest/v1/rpc/${fn}`,{method:"POST",headers:{"apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY,"Content-Type":"application/json"},body:JSON.stringify({p_pin:PIN,...args})})}catch(e){throw new Error("No se pudo conectar con el servidor. Revisa tu internet o intenta en unos minutos.")}
  const txt=await r.text();let j=null;try{j=txt?JSON.parse(txt):null}catch(e){}
  if(!r.ok){if(r.status>=500||r.status===0)throw new Error("El servidor está despertando. Intenta de nuevo en unos minutos.");throw new Error((j&&j.message)||"No se pudo conectar. Revisa tu internet.")}
  return j;
}
async function cargar(){
  const d=await rpc("app_data",{});
  rol=d.rol;GRUPO=d.grupo||GRUPO;ETIQ=d.etiqueta||"";SUPER=!!d.super;PERM=d.permisos||null;
  if(d.pid){LS.set("dtb_uid",String(d.pid));LS.set("dtb_unom",ETIQ);if(PIN&&!/#/.test(PIN)){PIN=d.pid+"#"+PIN;LS.set("dtb_pin",PIN)}}
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
const cname=id=>{const c=C(id);if(!c)return"Sin congregación";return c.nombre+(c.ciudad&&!/tierra baja/i.test(c.nombre)?` (${c.ciudad})`:"")};
const cancionDe=p=>p.c||(H(p.o)?.canc||{})[p.d]||null;
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
let entrada="", USUARIOS=null, SUPER=false, PERM=null;
const PERM_BASE={admin:["disc","reu","pred","inf","rec","pub"],consulta:["disc","reu","pred","rec"],publicador:[]};
const puede=id=>SUPER||((PERM&&PERM[rol])||PERM_BASE[rol]||[]).includes(id)&&(rol==="admin"||id!=="inf");
const yo=()=>{const id=LS.get("dtb_uid");return id?{id,n:LS.get("dtb_unom")||""}:null};
async function cargarUsuarios(){if(USUARIOS)return USUARIOS;const r=await fetch(SB_URL+"/rest/v1/rpc/login_usuarios",{method:"POST",headers:{apikey:SB_KEY,Authorization:"Bearer "+SB_KEY,"Content-Type":"application/json"},body:"{}"});if(!r.ok)throw new Error("El servidor está despertando… intenta en un minuto");const j=await r.json();USUARIOS=Array.isArray(j)?j:[];return USUARIOS}
function pintaLogin(msg){
  $("#login").hidden=false;$("#app").hidden=true;$("#hub").hidden=true;if($("#cong"))$("#cong").hidden=true;
  const u=yo();
  $("#quien").innerHTML=u?`<div class="yo"><span class="av">${esc(ini(u.n))}</span><div><b>${esc(u.n)}</b><button class="lnk" id="otroU">No soy yo · cambiar</button></div></div>`:"";
  $("#lpin").hidden=!u;$("#lbus").hidden=!!u;
  if(!u){pintaBuscador(msg);return}
  $("#dots").innerHTML=Array.from({length:Math.max(4,entrada.length)},(_,i)=>`<i class="${i<entrada.length?"on":""}"></i>`).join("");
  $("#err").textContent=msg||"";
  $("#pad").innerHTML=[1,2,3,4,5,6,7,8,9,"borrar",0,"entrar"].map(k=>`<button data-k="${k}" class="${k==="borrar"?"ghost":k==="entrar"?"go":""}">${k==="borrar"?"Borrar":k==="entrar"?"Entrar":k}</button>`).join("");
  $("#pad").querySelectorAll("button").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();tecla(b.dataset.k)}));
  $("#otroU").onclick=()=>{LS.del("dtb_uid");LS.del("dtb_unom");entrada="";pintaLogin()};
}
async function pintaBuscador(msg){
  $("#lerr").textContent=msg||"";
  const q=$("#lq"),L=$("#llist");
  L.innerHTML=`<div class="note" style="padding:14px;text-align:center">Cargando…</div>`;
  let us=[];try{us=await cargarUsuarios()}catch(e){L.innerHTML=`<div class="err" style="padding:14px">${esc(e.message)}</div>`;return}
  const pinta=()=>{const t=norm(q.value.trim());if(t.length<2){L.innerHTML=`<div class="note" style="padding:14px;text-align:center">Escribe al menos 2 letras de tu nombre</div>`;return}const f=us.filter(x=>norm(x.n).split(" ").some(w=>w.startsWith(t))||norm(x.n).includes(t));
    L.innerHTML=f.length?f.slice(0,60).map(x=>`<button class="lu" data-id="${x.id}" data-n="${esc(x.n)}"><span class="av">${esc(ini(x.n))}</span>${esc(x.n)}</button>`).join(""):`<div class="note" style="padding:14px;text-align:center">No encuentro ese nombre. Pídele a un anciano que te cree el acceso.</div>`;
    L.querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>{LS.set("dtb_uid",b.dataset.id);LS.set("dtb_unom",b.dataset.n);entrada="";pintaLogin()})};
  q.oninput=pinta;pinta();
}
async function tecla(k){
  if(k==="borrar"){entrada=entrada.slice(0,-1);return pintaLogin()}
  if(k==="entrar")return intentar();
  if(entrada.length<8){entrada+=k;pintaLogin()}
}
document.addEventListener("keydown",e=>{if(!$("#login").hidden&&!$("#lpin").hidden){if(/^[0-9]$/.test(e.key))tecla(e.key);else if(e.key==="Backspace")tecla("borrar");else if(e.key==="Enter")tecla("entrar")}});
async function intentar(){
  if(entrada.length<4)return pintaLogin("El PIN tiene mínimo 4 números");
  const u=yo();if(!u)return pintaLogin();
  PIN=u.id+"#"+entrada;$("#err").textContent="Verificando…";
  try{await cargar();LS.set("dtb_pin",PIN);entrada="";iniciar()}
  catch(e){PIN=null;entrada="";pintaLogin(e.message);const d=$("#dots");d.classList.remove("shake");void d.offsetWidth;d.classList.add("shake");try{navigator.vibrate&&navigator.vibrate(180)}catch(_){}}
}
function salir(){LS.del("dtb_pin");PIN=null;rol=null;entrada="";USUARIOS=null;pintaLogin()}

/* ---------- App ---------- */
let vista="cal",filtroE=null;
const SECCIONES=[
  {id:"disc",nombre:"Discursos p\u00fablicos",desc:"Programa de los s\u00e1bados, confirmaciones y plan B",tono:"t-acc",ico:"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><rect x=\"3.5\" y=\"5\" width=\"17\" height=\"15.5\" rx=\"3\"/><path d=\"M3.5 10h17M8 3v4M16 3v4\"/></svg>",activa:true},
  {id:"reu",nombre:"Reuniones",desc:"Vida y Ministerio \u00b7 acomodadores, micr\u00f3fonos y plataforma",tono:"t-info",ico:"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><path d=\"M4 5h11l3 3v11H4z\"/><path d=\"M7.5 10h7M7.5 13.5h7M7.5 17h4\"/></svg>",activa:true},
  {id:"pred",nombre:"Predicaci\u00f3n",desc:"Horario de salidas, capitanes y territorios",tono:"t-ok",ico:"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\"><path d=\"M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z\"/><circle cx=\"12\" cy=\"9.5\" r=\"2.5\"/></svg>",activa:true},
  {id:"inf",nombre:"Informes",desc:"Informe mensual por grupo, faltantes y totales",tono:"t-cyan",ico:"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><path d=\"M4 20V10M10 20V4M16 20v-7M22 20H2\"/></svg>",activa:true},
  {id:"rec",nombre:"Recordatorios",desc:"Aseo, hospitalidad, asambleas y visitas",tono:"t-warn",ico:"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><path d=\"M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4\"/></svg>",activa:true},
  {id:"pub",nombre:"Publicadores",desc:"Grupos de servicio, privilegios y usuarios",tono:"t-bad",ico:"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"12\" cy=\"8\" r=\"3.2\"/><circle cx=\"5\" cy=\"10\" r=\"2.3\"/><circle cx=\"19\" cy=\"10\" r=\"2.3\"/><path d=\"M6.5 19c.6-3 2.8-4.7 5.5-4.7s4.9 1.7 5.5 4.7M1.8 18c.3-2 1.5-3.3 3.2-3.6M22.2 18c-.3-2-1.5-3.3-3.2-3.6\"/></svg>",activa:true}
];
function saludo(){const h=new Date().getHours();return h<12?"Buen día":h<19?"Buenas tardes":"Buenas noches"}
function resumenDiscursos(){
  const fut=sabados().filter(p=>p.f>=HOY);const prox=fut[0];if(!prox)return"";
  const F=fd(prox.f),o=H(prox.o),dd=dias(HOY,prox.f),[et]=ESTADOS[prox.e];
  return`${dd===0?"Hoy":dd===1?"Mañana":"Sáb. "+F.d+" "+F.m.slice(0,3)}: ${o?esc(o.nombre.split(" ").slice(0,2).join(" ")):"sin orador"} · ${et}`;
}
function mostrarInicio(){
  if(rol==="publicador")return abrirMiEspacio();
  $("#login").hidden=true;$("#app").hidden=true;$("#hub").hidden=false;$("#fab").hidden=true;
  const quien=esAdmin()?String(ETIQ||"").split(" ")[0]:"";const dS=new Date(HOY+"T12:00:00");
  $("#hello").textContent=`${saludo()}${quien&&!/admin/i.test(quien)?", "+quien:""}`;
  $("#hubsub").innerHTML=`<span>${(t=>t[0].toUpperCase()+t.slice(1))(dS.toLocaleDateString("es-CO",{weekday:"long",day:"numeric",month:"long"}))}</span><span class="pill ${esAdmin()?"t-acc":"t-idle"}">${SUPER?"Super administrador":esAdmin()?"Administrador":"Consulta"}</span>`;
  const pend=sabados().filter(p=>p.f>=HOY&&p.e!=="conf"&&dias(HOY,p.f)<=14).length;
  const SECS=SECCIONES.filter(x=>puede(x.id));
  $("#hubgrid").innerHTML=SECS.map((x,i)=>`<button class="hcard wide ${i===0?"main":""}" data-sec="${x.id}">
    <span class="tile ${x.tono}">${x.ico}</span>
    ${i===0?`<span class="txt"><b>${x.nombre}</b><small><span class="gchip g-${esc(GRUPO.id)}">Sábado ${esc(GRUPO.hora||"")}</span></small><small>${resumenDiscursos()||x.desc}</small>${pend?`<small style="color:var(--warn);font-weight:800">${pend} sábado${pend>1?"s":""} por cerrar en 2 semanas</small>`:""}</span><span class="go" style="color:var(--accent)">${I.arrow}</span>`
      :`<span class="txt"><b>${x.nombre}</b><small>${x.desc}</small></span><span class="go" style="color:var(--muted)">${I.arrow}</span>`}
  </button>`).join("");
  document.querySelectorAll("[data-sec]").forEach(b=>b.onclick=()=>{const x=SECCIONES.find(s=>s.id===b.dataset.sec);if(x.activa)abrirSeccion(x.id);else toast(`${x.nombre}: la estamos construyendo`)});
  contarAvisos().then(n=>{$("#hubnb").innerHTML=n>0?`<span class="b">${n>9?"9+":n}</span>`:""});
  $("#hubver").textContent=document.querySelector(".login .note[style*='opacity']")?.textContent||"";
  scrollTo(0,0);
}
function abrirSeccion(id){if(!puede(id))return toast("No tienes acceso a esa sección");if(id==="disc"){$("#hub").hidden=true;iniciarDiscursos()}else abrirCong(id)}
function iniciar(){mostrarInicio()}
function iniciarDiscursos(){
  $("#login").hidden=true;$("#app").hidden=false;
  $("#subt").textContent=`Reunión del sábado · ${GRUPO.hora||""}`;
  render();
}
function setVista(v){vista=v;document.querySelectorAll("nav button").forEach(x=>x.classList.toggle("on",x.dataset.v===v));if(v==="avisos"){LS.set("dtb_leidos_"+GRUPO.id,String(DB.log.length?DB.log[0].t:""))}render();scrollTo(0,0)}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>setVista(b.dataset.v));
$("#campana").onclick=()=>setVista("avisos");
$("#aInicio").onclick=()=>{refrescar();mostrarInicio()};
$("#hubSalir").onclick=()=>salir();
$("#hubBell").onclick=()=>abrirCong("avi");
$("#cBack").onclick=()=>cVolver();
$("#cBell").onclick=()=>abrirCong("avi");
function cambiarTema(){const r=document.documentElement,dark=r.dataset.theme==="dark";r.dataset.theme=dark?"light":"dark";LS.set("dtb_tema",r.dataset.theme)}
// Apariencia: modo claro/oscuro y tamaño de letra (como en JW Library)
const ZOOMS=[.88,.94,1,1.07,1.14,1.22,1.3,1.4,1.5,1.62];
function ponerZoom(i){const z=ZOOMS[i]||1;document.documentElement.style.setProperty("--z",z);document.documentElement.classList.toggle("zm",z!==1);LS.set("dtb_zoom",String(i))}
function abrirApariencia(){
  const r=document.documentElement;let zi=+(LS.get("dtb_zoom")??2);if(!(zi>=0&&zi<ZOOMS.length))zi=2;
  const bg=document.createElement("div");bg.className="sheet-bg";
  bg.innerHTML=`<div class="sheet" role="dialog" aria-label="Apariencia"><div class="grab"></div><div class="shead"><h2>Apariencia</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
    <div class="flab">Tema</div><div class="segT"><button data-t="light">☀️ Claro</button><button data-t="dark">🌙 Oscuro</button></div>
    <div class="flab" style="margin-top:18px">Tamaño de la letra</div>
    <div class="jwsz"><span class="a1">A</span><span class="a2">A</span><div class="jwtr"><div class="jwtk">${ZOOMS.map(()=>"<i></i>").join("")}</div><input type="range" min="0" max="${ZOOMS.length-1}" step="1" value="${zi}" aria-label="Tamaño de la letra"></div></div>
    <p class="jwprev">Así se verá el texto en toda la app.</p>
    <button class="btn line" id="zReset" style="width:100%;margin-top:6px">Volver al tamaño normal</button></div>`;
  document.body.appendChild(bg);
  const close=()=>bg.remove();bg.onclick=e=>{if(e.target===bg)close()};bg.querySelector("[data-close]").onclick=close;
  const marca=()=>bg.querySelectorAll("[data-t]").forEach(b=>b.classList.toggle("on",b.dataset.t===(r.dataset.theme||"light")));marca();
  bg.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{r.dataset.theme=b.dataset.t;LS.set("dtb_tema",b.dataset.t);marca()});
  const rg=bg.querySelector("input[type=range]");rg.oninput=()=>ponerZoom(+rg.value);
  bg.querySelector("#zReset").onclick=()=>{rg.value=2;ponerZoom(2)};
}
$("#tema").onclick=abrirApariencia;document.querySelectorAll(".btnTema").forEach(b=>{b.onclick=abrirApariencia;b.setAttribute("aria-label","Apariencia: tema y tamaño de letra")});
{document.documentElement.dataset.theme=LS.get("dtb_tema")||"light"}
function updBadge(){const ult=LS.get("dtb_leidos_"+GRUPO.id)||"";const n=DB.log.filter(l=>l.t>ult).length;$("#nb").innerHTML=n>0?`<span class="b">${n>9?"9+":n}</span>`:""}
function render(){
  if($("#cong")&&!$("#cong").hidden){if(typeof cRender==="function")cRender();return}
  if($("#app").hidden)return;
  $("#fab").hidden=!esAdmin()||$("#app").hidden;
  updBadge();
  ({cal:vCal,disc:vDisc,her:vHer,cong:vCong,avisos:vAvisos})[vista]();
}

/* ---------- Reglas de descanso ---------- */
const DESCANSO_ORADOR_MESES=6;   // un orador no debería volver antes de esto
const REPETIR_DISCURSO_MESES=12; // un bosquejo no debería repetirse antes de esto
const meses=(a,b)=>Math.abs(dias(a,b))/30.44;
function fmtM(m){if(m<1)return"menos de un mes";const r=Math.round(m);if(r<12)return r===1?"1 mes":`${r} meses`;const a=Math.floor(r/12),mm=r%12;return`${a} año${a>1?"s":""}${mm?` y ${mm} mes${mm>1?"es":""}`:""}`}
function cercana(lista,f){return lista.sort((a,b)=>Math.abs(dias(a,f))-Math.abs(dias(b,f)))[0]||null}
function infoDiscurso(n,f){
  const g=cercana(DB.prog.filter(x=>x.d===n&&x.f!==f&&x.e!=="sin").map(x=>x.f),f||HOY);
  if(!g)return{nivel:"ok",txt:"Nunca se ha dado"};
  const warn=meses(g,f||HOY)<REPETIR_DISCURSO_MESES;
  const txt=g<HOY?`Se dio hace ${fmtM(meses(g,HOY))} (${fd(g).corto})`:g===HOY?"Se da hoy":`Ya está programado el ${fd(g).corto}`;
  return{nivel:warn?"warn":"ok",txt,g};
}
function infoOrador(id,f){
  const g=cercana(DB.prog.filter(x=>x.o===id&&x.f!==f&&x.e!=="sin").map(x=>x.f),f||HOY);
  if(!g)return{nivel:"ok",txt:"No ha venido antes"};
  const warn=meses(g,f||HOY)<DESCANSO_ORADOR_MESES;
  const txt=g<HOY?`Vino hace ${fmtM(meses(g,HOY))}`:`Ya tiene el ${fd(g).corto}`;
  return{nivel:warn?"warn":"ok",txt,g};
}


/* Alerta de sábados sin asignar en el mes vigente (y el siguiente desde el día 20) */
function alertaMes(fut){
  const hoy=new Date(HOY+"T12:00:00"),mesAct=HOY.slice(0,7);
  const sig=new Date(hoy.getFullYear(),hoy.getMonth()+1,15).toISOString().slice(0,7);
  const vacios=fut.filter(p=>p.e==="sin"&&(p.f.slice(0,7)===mesAct||(hoy.getDate()>=20&&p.f.slice(0,7)===sig)));
  if(!vacios.length)return"";
  const urg=vacios.some(p=>dias(HOY,p.f)<=14);
  const fechas=vacios.map(p=>fd(p.f).d+" "+fd(p.f).m.slice(0,3)).join(", ");
  const nomMeses=[...new Set(vacios.map(p=>fd(p.f).m))].join(" y ");
  return`<button class="alertmes ${urg?"urg":""}" id="alertMes">${I.alert}<span><b>${vacios.length} sábado${vacios.length>1?"s":""} de ${nomMeses} sin asignar</b><br>${fechas}${urg?" · ¡el más cercano es en menos de 2 semanas!":""}</span><span class="go">${esAdmin()?"Asignar":"Ver"} ${I.arrow}</span></button>`;
}
/* ---------- SÁBADOS ---------- */
let verPasados=false;
function cuando(dd){return dd===0?"Hoy":dd===1?"Mañana":`En ${dd} días`}
function vCal(){
  const todos=sabados(),fut=todos.filter(p=>p.f>=HOY);
  const cnt=k=>fut.filter(p=>p.e===k).length;
  let h=`<div class="kpis">${[["conf","Confirmados"],["porc","Por confirmar"],["sin","Sin asignar"],["planb","Plan B"]].map(([k,l])=>`<button class="kpi ${filtroE===k?"sel":""}" data-k="${k}"><span class="n"><i class="dot-${k}"></i>${cnt(k)}</span><span class="l">${l}</span></button>`).join("")}</div>`;
  h=alertaMes(fut)+h;
  if(esAdmin())h+=`<button class="btn pri big" id="asigTop">${I.cal} Asignar discurso</button>`;
  const prox=fut[0];
  if(prox&&!filtroE){
    const F=fd(prox.f),o=H(prox.o),s=H(prox.s),dd=dias(HOY,prox.f),[et,ec]=ESTADOS[prox.e];
    const txt={conf:"Todo listo. El orador confirmó.",porc:"Recordatorio enviado. Esperando respuesta del hermano.",asig:dd<=3?"Hoy es buen día para enviarle el recordatorio.":"Envíale el recordatorio el jueves o viernes.",sin:"Todavía no hay discurso asignado.",planb:s?`El orador no puede. Suplente: ${s.nombre}.`:"El orador no puede y no hay suplente."}[prox.e]||"";
    const act={sin:"Asignar discurso",asig:"Enviar recordatorio",porc:"Registrar respuesta",planb:"Resolver plan B"}[prox.e];
    h+=`<div class="hero" data-f="${prox.f}" role="button" tabindex="0">
      <div class="hhead"><div class="bigdate ${ec}"><span class="w">SÁB</span><span class="d">${F.d}</span><span class="m">${F.m.slice(0,3).toUpperCase()}</span></div>
        <div style="min-width:0"><div class="when">${cuando(dd)}</div><span class="pill ${ec}">${et}</span></div></div>
      ${prox.d?`<div class="htitle"><span class="num">#${prox.d}</span> ${esc(tit(prox.d))}</div>`:prox.o?`<div class="htitle sinnum">Discurso por definir</div>`:""}
      ${o?`<div class="hwho">${I.user.replace("<svg",'<svg class="mini"')} ${esc(o.nombre)} · ${esc(cname(o.cong))}</div>`:""}
      <div class="msg">${txt}</div>
      ${esAdmin()&&act?`<button class="btn ${prox.e==="planb"?"bad":"pri"}" id="heroAct">${act} ${I.arrow}</button>`:""}
    </div>`;
  }
  const pasados=todos.filter(p=>p.f<HOY).slice(-4);
  const lista=filtroE?fut.filter(p=>p.e===filtroE):fut.slice(filtroE?0:1);
  h+=`<div class="label">${filtroE?ESTADOS[filtroE][0]+' · <button class="chipo mini" id="qf">Quitar filtro ✕</button>':"Próximos sábados"}</div><div class="list">`;
  let mesAnt="";
  lista.forEach(p=>{
    const F=fd(p.f),o=H(p.o),[et,ec]=ESTADOS[p.e];
    if(!filtroE&&F.m!==mesAnt){h+=`<div class="mes">${F.m} ${F.y}</div>`;mesAnt=F.m}
    if(p.e==="evento"){h+=`<button class="sat" data-f="${p.f}"><div class="dbox t-warn"><div class="d">${F.d}</div><div class="w">${F.m.slice(0,3)}</div></div><div class="tt"><span class="pill t-warn">Sin reunión</span><div class="ttl">Asamblea / evento</div><div class="who">No se asigna discurso</div></div></button>`;return}
    if(p.e==="sin"){
      h+=`<button class="sat vacio" ${esAdmin()?`data-asig="${p.f}"`:`data-f="${p.f}"`}><div class="dbox t-idle"><div class="d">${F.d}</div><div class="w">${F.m.slice(0,3)}</div></div><span class="vtxt">Sin asignar</span>${esAdmin()?`<span class="vadd">+ Asignar</span>`:""}</button>`;
      return;
    }
    h+=`<button class="sat" data-f="${p.f}">
      <div class="dbox ${ec}"><div class="d">${F.d}</div><div class="w">${F.m.slice(0,3)}</div></div>
      <div class="tt"><span class="pill ${ec}">${et}</span><div class="ttl">${p.d?`<span class="num">#${p.d}</span> ${esc(tit(p.d))}`:`<span class="sinnum">Discurso por definir</span>`}</div><div class="who">${o?esc(o.nombre)+" · "+esc(cname(o.cong)):"Sin orador"}</div></div></button>`;
  });
  if(!lista.length)h+=`<div class="empty">No hay sábados en este estado.</div>`;
  h+=`</div>`;
  if(!filtroE){
    h+=`<button class="btn line" style="width:100%;margin-top:12px" id="mas">Ver más sábados</button>`;
    if(pasados.length){
      h+=`<button class="linkbtn" id="pas">${verPasados?"Ocultar":"Ver"} anteriores (${pasados.length})</button>`;
      if(verPasados)h+=`<div class="list">${pasados.reverse().map(p=>{const F=fd(p.f),o=H(p.o),[et,ec]=ESTADOS[p.e];return`<button class="sat past" data-f="${p.f}"><div class="dbox t-idle"><div class="d">${F.d}</div><div class="w">${F.m.slice(0,3)}</div></div><div class="tt"><span class="pill ${ec}">${et}</span><div class="ttl">${p.d?`<span class="num">#${p.d}</span> ${esc(tit(p.d))}`:"Sin discurso"}</div><div class="who">${o?esc(o.nombre):"—"}</div></div></button>`}).join("")}</div>`;
    }
  }
  $("#view").innerHTML=h;
  document.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>abrir(b.dataset.f));
  document.querySelectorAll("[data-asig]").forEach(b=>b.onclick=()=>asignar(b.dataset.asig));
  document.querySelectorAll(".kpi").forEach(b=>b.onclick=()=>{filtroE=filtroE===b.dataset.k?null:b.dataset.k;vCal()});
  const ha=$("#heroAct");if(ha)ha.onclick=e=>{e.stopPropagation();prox.e==="sin"?asignar(prox.f):abrir(prox.f)};
  const am=$("#alertMes");if(am)am.onclick=()=>{const v=sabados().find(p=>p.f>=HOY&&p.e==="sin");esAdmin()&&v?asignar(v.f):(filtroE="sin",vCal())};
  const at=$("#asigTop");if(at)at.onclick=()=>asignar();
  const qf=$("#qf");if(qf)qf.onclick=()=>{filtroE=null;vCal()};
  const m=$("#mas");if(m)m.onclick=()=>{semanas+=8;vCal()};
  const ps=$("#pas");if(ps)ps.onclick=()=>{verPasados=!verPasados;vCal()};
}

/* ---------- HOJAS ---------- */
function hoja(html,onMount){
  const bg=document.createElement("div");bg.className="sheet-bg";
  bg.innerHTML=`<div class="sheet" role="dialog"><div class="grab"></div>${html}</div>`;
  document.body.appendChild(bg);
  const close=()=>{if(!bg.isConnected)return;try{bg._alCerrar&&bg._alCerrar()}catch(e){}bg.remove();render()};
  bg.onclick=e=>{if(e.target===bg)close()};
  bg.querySelectorAll("[data-close]").forEach(b=>b.onclick=close);
  onMount&&onMount(bg,close);
  return bg;
}
function copiar(texto,el){const fb=()=>{if(el){const r=document.createRange();r.selectNodeContents(el);getSelection().removeAllRanges();getSelection().addRange(r)}toast("Texto seleccionado, cópialo")};try{navigator.clipboard.writeText(texto).then(()=>toast("Mensaje copiado")).catch(fb)}catch(e){fb()}}

function avisoHtml(info,pref,lim){return`<div class="aviso ${info.nivel}">${info.nivel==="warn"?I.alert:I.check}<span>${pref}${info.txt.charAt(0).toLowerCase()+info.txt.slice(1)}.${info.nivel==="warn"?` <b>Lo ideal es esperar ${lim} meses.</b>`:""}</span></div>`}
function pickerDiscurso(cont,actual,f,onPick){
  cont.innerHTML=`<input placeholder="Escribe número o palabra (ej. 103, familia)" inputmode="search" aria-label="Buscar discurso"><div class="avs"></div><div class="res"></div>`;
  const inp=cont.querySelector("input"),res=cont.querySelector(".res"),avs=cont.querySelector(".avs");
  const pinta=()=>{const raw=inp.value.trim(),q=norm(raw);let n=0,out="";
    const exacto=/^[0-9]+$/.test(raw)&&+raw>=1&&+raw<=TITULOS.length?+raw:null;
    const foco=exacto||(!raw&&actual)||null;
    avs.innerHTML=foco?(noUsar(foco)?`<div class="aviso warn">${I.alert}<span>El #${foco} no se usa.</span></div>`:avisoHtml(infoDiscurso(foco,f),`El #${foco} `,REPETIR_DISCURSO_MESES)):"";
    for(let i=1;i<=TITULOS.length&&n<6;i++){if(noUsar(i))continue;
      if(q&&!(String(i)===q||(q.length>1&&String(i).startsWith(q))||norm(tit(i)).includes(q)))continue;
      if(!q&&i!==actual)continue;
      const inf=infoDiscurso(i,f),tiene=DB.hermanos.filter(h=>h.bos.includes(i)).length;
      out+=`<button data-n="${i}" class="${i===actual?"on":""}"><b>#${i}</b><span>${esc(tit(i))}</span><small class="${inf.nivel==="warn"?"w":""}">${inf.nivel==="warn"?"⚠ ":""}${inf.txt} · ${tiene} orador${tiene===1?"":"es"} lo tiene${tiene===1?"":"n"}</small></button>`;n++}
    res.innerHTML=out||(q?`<div class="note">Sin resultados.</div>`:"");
    res.querySelectorAll("button").forEach(b=>b.onclick=()=>onPick(+b.dataset.n));
  };
  inp.oninput=pinta;pinta();
}
function chipsOradores(d,f,sel,excluir){
  const l=DB.hermanos.filter(h=>h.id!==excluir).map(h=>{const inf=infoOrador(h.id,f),tiene=!!(d&&h.bos.includes(d));return{h,inf,tiene,score:(tiene?2:0)+(inf.nivel==="ok"?1:0)}})
    .sort((a,b)=>b.score-a.score||a.h.nombre.localeCompare(b.h.nombre));
  if(!l.length)return`<span class="note">Aún no hay oradores registrados.</span>`;
  return l.map(({h,inf,tiene})=>`<button class="pk ${sel===h.id?"on":""} ${inf.nivel==="warn"?"warn":""} ${tiene?"":"star"}" data-h="${h.id}">${esc(h.nombre)}<small>${esc(cname(h.cong))}${tiene?" · lo tiene ✓":""}</small><small class="${inf.nivel==="warn"?"w":""}">${inf.nivel==="warn"?"⚠ ":""}${inf.txt}</small></button>`).join("");
}
function msgRecordatorio(p){const o=H(p.o),F=fd(p.f),base=GRUPO.nombre.replace(/\s*\d.*$/,""),dd=dias(HOY,p.f),hora=String(GRUPO.hora||"").replace(/\.$/,"");
  const cuandoTxt=dd===0?`hoy sábado ${F.d}`:dd===1?`mañana sábado ${F.d}`:dd<=7?`este sábado ${F.d} de ${F.m}`:`el sábado ${F.d} de ${F.m}`;
  const disc=p.d?` «${tit(p.d).replace(/[“”"«»]/g,"")}» (n.º ${p.d})`:"";const cc=cancionDe(p),canc=cc?` La canción de apertura es la ${cc}.`:"";
  return`Hola, hermano ${o.nombre.split(" ")[0]}, ¿cómo está? Le escribo para recordarle con cariño que ${cuandoTxt} nos acompaña con el discurso público${disc} en la congregación ${base}, en la reunión de las ${hora}.${canc}\n\n${p.d?"¿Nos confirma, por favor, si puede venir?":"¿Nos confirma, por favor, si puede venir y qué bosquejo va a presentar?"}\n\n¡Muchas gracias!`}
function msgAncianos(p,estado){
  const F=fd(p.f),dd=dias(HOY,p.f),hora=String(GRUPO.hora||"").replace(/\.$/,"");
  const cuando=dd===0?`hoy sábado ${F.d}`:dd===1?`mañana sábado ${F.d}`:dd>1&&dd<=7?`este sábado ${F.d} de ${F.m}`:`el sábado ${F.d} de ${F.m}`;
  const o=H(p.o),s=H(p.s),de=h=>h&&C(h.cong)?`, de la congregación ${cname(h.cong)},`:"";
  const disc=p.d?`el discurso «${tit(p.d).replace(/[“”"«»]/g,"")}» (n.º ${p.d})`:"el discurso público";
  const cc=cancionDe(p),canc=cc?` La canción de apertura es la ${cc}.`:"";
  const reu=`la reunión de las ${hora}`;
  let t="";
  if(estado==="conf")t=`Hola, hermanos. Les cuento que el hermano ${o.nombre}${de(o)} ya confirmó que nos acompaña ${cuando} en ${reu}. Presentará ${disc}.${canc}`;
  else if(estado==="planb")t=`Hola, hermanos. Les aviso que el hermano ${o?o.nombre:"asignado"} no podrá venir ${cuando}. ${s?`En su lugar nos acompañará el hermano ${s.nombre}${de(s)} con ${disc}.${canc}`:"Estamos buscando quién lo reemplace; apenas lo tengamos les cuento."}`;
  else if(estado==="porc")t=`Hola, hermanos. Para ${cuando} en ${reu} tenemos al hermano ${o.nombre}${de(o)} con ${disc}. Ya le recordé y estoy esperando que me confirme.${canc}`;
  else t=`Hola, hermanos. Para ${cuando} en ${reu} está asignado el hermano ${o?o.nombre:""}${de(o)} con ${disc}.${canc}`;
  return t.replace(/\s+,/g,",").replace(/ {2,}/g," ")+`\n\n¡Gracias!`;
}
const normContacto=v=>{v=String(v||"").trim();if(!v)return"";if(/[a-zA-Z_]/.test(v)||v.startsWith("@"))return"@"+v.replace(/^@+/,"").replace(/\s+/g,"").toLowerCase();return v.replace(/\D/g,"")};
const esUsuario=t=>String(t||"").startsWith("@");
const telWa=t=>{t=String(t||"");if(esUsuario(t))return t.slice(1);t=t.replace(/\D/g,"");return t.length===10?"57"+t:t};
// Con @usuario WhatsApp aún no abre el chat por enlace: se abre "Enviar a…" con el mensaje listo para escoger al hermano
const linkWa=(t,msg)=>esUsuario(t)?`https://wa.me/?text=${encodeURIComponent(msg||"")}`:`https://wa.me/${telWa(t)}${msg?`?text=${encodeURIComponent(msg)}`:""}`;

function avisarAncianos(m){
  hoja(`<div class="shead"><h2>Avisar a los ancianos</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
   <div class="note">Ya quedó registrado en la app. Envíalo también al grupo de WhatsApp de ancianos:</div>
   <div class="wmsg" id="mA">${esc(m)}</div>
   <div class="row"><button class="btn line" id="cp">${I.copy} Copiar</button><a class="btn ok" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(m)}">${I.wa} Enviar al grupo</a></div>`,
   bg=>{bg.querySelector("#cp").onclick=()=>copiar(m,bg.querySelector("#mA"))});
}

function progreso(e){
  const idx=e==="conf"||e==="hecho"?2:e==="porc"?1:e==="asig"||e==="planb"?0:-1;
  return`<div class="prog3">${["Asignado","Recordado","Confirmado"].map((t,i)=>`<div class="ps ${i<=idx?"on":""} ${i===idx?"cur":""}"><i></i><span>${t}</span></div>`).join("")}</div>`;
}
function abrir(f){
  const p=getSab(f),F=fd(f),o=H(p.o),s=H(p.s);
  const edit=esAdmin()&&p.e!=="hecho";
  let h=`<div class="shead"><span class="pill ${ESTADOS[p.e][1]}">${ESTADOS[p.e][0]}</span><button class="x" data-close aria-label="Cerrar">✕</button></div>
  <h2>Sábado ${F.d} de ${F.m}</h2>
  ${p.e!=="sin"&&p.e!=="evento"?progreso(p.e):""}
  ${p.e==="evento"?"":`<div class="card"><div style="font-weight:800">${p.d?`<span style="color:var(--accent)">#${p.d}</span> ${esc(tit(p.d))}`:"Discurso por definir"}</div>
  <div class="note" style="margin-top:6px">Orador: <b>${o?esc(o.nombre)+" · "+esc(cname(o.cong)):"—"}</b><br>Suplente: <b>${s?esc(s.nombre):"—"}</b>${!esAdmin()?`<br>Canción: <b>${cancionDe(p)?"n.º "+cancionDe(p):"—"}</b>`:""}</div>
  ${esAdmin()&&p.e!=="hecho"?`<div class="cancion"><span>🎵 Canción</span><input id="cNum" type="number" inputmode="numeric" min="1" max="200" placeholder="n.º" value="${cancionDe(p)||""}"><button class="btn line" id="cOk">Guardar</button></div>`:""}</div>`}`;
  if(esAdmin()&&p.e!=="hecho"&&o){
    const m=msgRecordatorio(p);
    const wa=`<div class="row"><a class="btn ok" target="_blank" rel="noopener" href="${linkWa(o.tel,m)}" id="waR">${I.wa} ${p.e==="porc"?"Reenviar recordatorio":"Enviar recordatorio"}</a><button class="btn line" id="cpR" style="flex:0 0 auto">${I.copy}</button></div>
      ${!o.tel?`<div class="aviso warn">${I.alert}<span>Este orador no tiene WhatsApp registrado. Agrégale el celular o el @usuario en Oradores.</span></div>`:esUsuario(o.tel)?`<div class="note">Contacto por usuario <b>${esc(o.tel)}</b>: WhatsApp abrirá “Enviar a…” con el mensaje ya escrito; busca ahí a ${esc(o.tel)} y envía.</div>`:""}
      <details class="msgbox"><summary>Ver mensaje</summary><div class="wmsg" id="mR">${esc(m)}</div></details>`;
    const resp=`<span class="flab">¿Qué respondió ${esc(o.nombre.split(" ")[0])}?</span><div class="row"><button class="btn pri" id="si">${I.check} Confirmó</button><button class="btn bad" id="no">No puede</button></div>`;
    if(p.e==="asig")h+=`<span class="flab">Paso 1 · Recordatorio</span>${wa}${resp}`;
    if(p.e==="porc")h+=`${resp}<span class="flab">Recordatorio</span>${wa}<button class="btn line" id="grupo">${I.wa} Enviar estado al grupo</button>`;
    const comp=`<span class="flab">Compartir</span><div class="row"><button class="btn ok" id="grupo">${I.wa} Enviar al grupo</button><a class="btn line" target="_blank" rel="noopener" href="${linkWa(o.tel,m)}" id="waR2">Reenviar al orador</a></div>`;
    if(p.e==="conf")h+=`${comp}${f<=HOY?`<button class="btn pri" id="hecho">${I.check} Marcar realizado</button>`:""}<button class="btn bad" id="no">Canceló a última hora</button>`;
    if(p.e==="planb")h+=`<div class="aviso warn">${I.alert}<span>${s?`Plan B en curso. Llama a <b>${esc(s.nombre)}</b> y confírmalo.`:"No hay suplente. Toca “Cambiar asignación”."}</span></div>${s?`<button class="btn pri" id="si">${I.check} Suplente confirmado</button>`:""}${comp}`;
  }
  if(edit)h+=`<button class="btn line" id="cambiar">${p.d?"Cambiar asignación":p.o?"Poner número de discurso":"Asignar ahora"}</button>`;
  if(p.e==="hecho")h+=`<div class="note">Este discurso ya se pronunció.</div>`;
  if(p.e==="evento")h+=`<div class="aviso warn">${I.alert}<span><b>No hay reunión este sábado</b>${p.ev?` · ${esc(p.ev)}`:""}. No se asigna discurso.</span></div>${esAdmin()?`<button class="btn line" id="siReu">Sí hay reunión (quitar)</button>`:""}`;
  else if(esAdmin()&&p.e!=="hecho")h+=`<button class="btn line" id="noReu">🏟 No hay reunión (asamblea / evento)</button>`;
  hoja(h,(bg,close)=>{
    const q=x=>bg.querySelector(x);
    if(q("#cambiar"))q("#cambiar").onclick=()=>{bg.remove();asignar(f)};
    if(q("#noReu"))q("#noReu").onclick=()=>{bg.remove();hoja(`<div class="shead"><h2>Sábado ${F.d} sin reunión</h2><button class="x" data-close aria-label="Cerrar">✕</button></div><div class="picks" id="evs">${["Asamblea regional","Asamblea de circuito","Otro evento"].map((x,i)=>`<button class="pk ${i?"":"on"}" data-v="${x}">${x}</button>`).join("")}</div><div class="note">Ese sábado queda marcado sin discurso y no sale en las alertas de “sin asignar”.${o?` <b>Ojo:</b> se quita la asignación de ${esc(o.nombre)}.`:""}</div><button class="btn pri" id="evOk">Confirmar</button>`,(b2,c2)=>{let v="Asamblea regional";b2.querySelectorAll("[data-v]").forEach(x=>x.onclick=()=>{v=x.dataset.v;b2.querySelectorAll("[data-v]").forEach(y=>y.classList.toggle("on",y===x))});
      b2.querySelector("#evOk").onclick=async()=>{b2.remove();if(await guardarProg({...p,d:null,o:null,s:null,e:"evento"},`Sábado ${F.d} de ${F.m}: no hay reunión (${v}).`,"evento"))toast("Marcado sin reunión")}})};
    if(q("#siReu"))q("#siReu").onclick=async()=>{bg.remove();await guardarProg({...p,e:"sin"},`Sábado ${F.d} de ${F.m}: sí hay reunión, queda pendiente asignar.`,"sin")};
    if(q("#cOk"))q("#cOk").onclick=async()=>{const v=q("#cNum").value.trim();const c=v?parseInt(v,10):null;
      if(c!==null&&!(c>=1&&c<=200)){toast("Canción entre 1 y 200");return}
      try{document.body.classList.add("loading");await rpc("app_save_cancion",{p_fecha:f,p_c:c});if(c&&o&&p.d&&(o.canc||{})[p.d]!==c){const cc={...(o.canc||{}),[p.d]:c};rpc("app_save_hermano",{p_nombre:o.nombre,p_cong:o.cong||null,p_tel:o.tel||"",p_bos:o.bos||[],p_id:o.id,p_canc:cc}).then(()=>{o.canc=cc}).catch(()=>{})}const x=DB.prog.find(z=>z.f===f);if(x)x.c=c;else DB.prog.push({...p,c,virtual:undefined});bg.remove();toast(c?`Canción n.º ${c} guardada`:"Canción quitada");abrir(f)}
      catch(e){toast(e.message)}finally{document.body.classList.remove("loading")}};
    if(q("#grupo"))q("#grupo").onclick=()=>{bg.remove();avisarAncianos(msgAncianos(p,p.e))};
    if(q("#waR2"))q("#waR2").addEventListener("click",()=>{if(esUsuario(o.tel)){try{navigator.clipboard.writeText(msgRecordatorio(p)).catch(()=>{})}catch(e){}toast(`En WhatsApp busca a ${o.tel} y toca Enviar`)}});
    const marcarR=async()=>{if(p.e==="asig"){await guardarProg({...p,e:"porc"},`Recordatorio enviado a ${o.nombre}${p.d?" por el n.º "+p.d:""} del ${F.corto}.`,"porc")}};
    if(q("#cpR"))q("#cpR").onclick=()=>{q(".msgbox").open=true;copiar(q("#mR").textContent,q("#mR"));marcarR()};
    if(q("#waR"))q("#waR").addEventListener("click",()=>{if(esUsuario(o.tel)){try{navigator.clipboard.writeText(q("#mR").textContent).catch(()=>{})}catch(e){}toast(`En WhatsApp busca a ${o.tel} y toca Enviar`)}bg.remove();marcarR()});
    if(q("#si"))q("#si").onclick=async()=>{const plan=p.e==="planb",quien=plan?s:o;
      const np={...p,e:"conf",o:plan?p.s:p.o,s:plan?null:p.s};
      const m=msgAncianos(np,"conf");
      bg.remove();if(await guardarProg(np,m,"conf"))avisarAncianos(m)};
    if(q("#no"))q("#no").onclick=async()=>{const m=msgAncianos(p,"planb");
      bg.remove();if(await guardarProg({...p,e:"planb"},m,"planb"))avisarAncianos(m)};
    if(q("#hecho"))q("#hecho").onclick=()=>{bg.remove();guardarProg({...p,e:"hecho"},`Realizado${p.d?": n.º "+p.d:""} por ${o.nombre} (${cname(o.cong)}).`,"hecho")};
  });
}

/* Asignar: sábado (tira deslizable) → discurso (con aviso) → orador (con descanso) */
function asignar(fIni){
  const prev=semanas;semanas=Math.max(semanas,16);
  const libres=sabados().filter(p=>p.f>=HOY&&p.e!=="hecho");semanas=prev;
  const st={f:fIni||(libres.find(p=>p.e==="sin")||libres[0])?.f,d:null,o:null,s:null};
  const cargarSt=()=>{const p=getSab(st.f);st.d=p.d;st.o=p.o;st.s=p.s};cargarSt();
  const bg=hoja(`<div class="shead"><h2>Asignar discurso</h2><button class="x" data-close aria-label="Cerrar">✕</button></div><div id="body" style="display:flex;flex-direction:column;gap:14px"></div>`);
  const body=bg.querySelector("#body");
  let saltar=null;
  const pinta=()=>{
    const ops=libres.slice();if(st.f&&!ops.find(p=>p.f===st.f))ops.unshift(getSab(st.f));
    const sel=getSab(st.f),F=fd(st.f);
    const io=st.o?infoOrador(st.o,st.f):null;
    body.innerHTML=`
      <div><span class="flab">1 · Sábado</span>
        <div class="strip" id="strip">${ops.map(p=>{const G=fd(p.f);return`<button class="dchip ${st.f===p.f?"on":""}" data-sf="${p.f}"><span class="m">${G.m.slice(0,3)}</span><span class="d">${G.d}</span><i class="dot-${p.e}"></i></button>`}).join("")}</div>
        <div class="selline">Sábado ${F.d} de ${F.m} · <span class="pill ${ESTADOS[sel.e][1]}">${ESTADOS[sel.e][0]}</span></div></div>
      <div><span class="flab">2 · Discurso</span><div id="pd"></div></div>
      ${st.d?`<div id="sec3"><span class="flab">3 · Orador</span>${io&&io.nivel==="warn"?avisoHtml(io,`${H(st.o).nombre.split(" ")[0]} `,DESCANSO_ORADOR_MESES):""}<div class="picks" id="po">${chipsOradores(st.d,st.f,st.o)}</div><div class="note" style="margin-top:8px">Primero los que tienen el bosquejo y ya descansaron. ¿No está? <button class="chipo mini" id="nuevoH">+ Nuevo orador</button></div></div>`:""}
      ${st.o?`<div id="sec4"><span class="flab">Suplente (opcional)</span><div class="picks" id="ps">${chipsOradores(st.d,st.f,st.s,st.o)}</div></div>`:""}
      <button class="btn pri" id="ok" ${st.f&&st.d&&st.o?"":"disabled"}>Guardar asignación</button>`;
    pickerDiscurso(body.querySelector("#pd"),st.d,st.f,n=>{st.d=n;saltar="#sec3";pinta()});
    const on=body.querySelector(".dchip.on");if(on)on.scrollIntoView({inline:"center",block:"nearest"});
    body.querySelectorAll("[data-sf]").forEach(b=>b.onclick=()=>{st.f=b.dataset.sf;cargarSt();pinta()});
    body.querySelectorAll("#po [data-h]").forEach(b=>b.onclick=()=>{st.o=b.dataset.h;if(st.s===st.o)st.s=null;saltar="#ok";pinta()});
    body.querySelectorAll("#ps [data-h]").forEach(b=>b.onclick=()=>{st.s=st.s===b.dataset.h?null:b.dataset.h;pinta()});
    const nh=body.querySelector("#nuevoH");if(nh)nh.onclick=()=>{bg.remove();nuevoOrador(()=>asignar(st.f))};
    if(saltar){const t=body.querySelector(saltar);saltar=null;if(t)setTimeout(()=>t.scrollIntoView({behavior:"smooth",block:"center"}),60)}
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
    <div><span class="flab">Congregación</span><div class="picks" id="pc"></div><div id="nCw" class="grid2" ${st.nuevaC?"":"hidden"} style="margin-top:8px"><input id="nC" placeholder="Congregación (ej. El Bosque)"><input id="nCc" placeholder="Ciudad" value="Cartagena"></div></div>
    <div><span class="flab">WhatsApp: celular o @usuario</span><input id="nT" autocapitalize="off" autocorrect="off" placeholder="300 000 0000 o @usuario" value="${esc(h0?.tel||"")}"></div>
    <div><span class="flab">Bosquejos que tiene</span><input id="nB" inputmode="numeric" placeholder="Ej. 1, 23, 99" value="${esc((h0?.bos||[]).join(", "))}"><div id="pb" class="bcanc"></div></div>
    <button class="btn pri" id="ok">Guardar orador</button>
    ${h0?`<button class="btn bad" id="del">Quitar de la lista</button>`:""}`,(bg)=>{
    const q=x=>bg.querySelector(x);
    const pc=()=>{q("#pc").innerHTML=DB.congs.map(c=>`<button class="pk ${!st.nuevaC&&st.cong===c.id?"on":""}" data-c="${c.id}">${esc(c.nombre)}${c.ciudad&&!/tierra baja/i.test(c.nombre)?`<small class="ciu">${esc(c.ciudad)}</small>`:""}</button>`).join("")+`<button class="pk star ${st.nuevaC?"on":""}" data-c="__n">+ Nueva</button>`;
      q("#pc").querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{if(b.dataset.c==="__n"){st.nuevaC=true}else{st.nuevaC=false;st.cong=b.dataset.c}q("#nCw").hidden=!st.nuevaC;pc();if(st.nuevaC)q("#nC").focus()})};
    pc();
    const nums=()=>[...new Set(q("#nB").value.split(/[^0-9]+/).map(Number).filter(x=>x>0&&x<=TITULOS.length&&!noUsar(x)))];
    const canc={...(h0?.canc||{})};
    const pb=()=>{q("#pb").querySelectorAll("[data-cn]").forEach(i=>{canc[i.dataset.cn]=i.value.trim()});
      const ns=nums();q("#pb").innerHTML=ns.length?`<div class="note" style="margin:8px 2px 4px">Canción de apertura que usa en cada bosquejo (opcional):</div>`+ns.map(n=>`<div class="bc"><span class="cn" title="${esc(tit(n))}">#${n} ${esc(tit(n).slice(0,30))}${tit(n).length>30?"…":""}</span><label>🎵<input data-cn="${n}" inputmode="numeric" placeholder="n.º" value="${esc(canc[n]||"")}"></label></div>`).join(""):""};
    q("#nB").oninput=pb;pb();
    if(!h0)setTimeout(()=>q("#nN").focus(),250);
    q("#ok").onclick=async()=>{const n=q("#nN").value.trim();if(!n){toast("Escribe el nombre");q("#nN").focus();return}
      document.body.classList.add("loading");
      try{
        let cid=st.cong;
        if(st.nuevaC){const cn=q("#nC").value.trim();if(!cn){toast("Escribe la congregación");return}cid=await rpc("app_save_cong",{p_nombre:cn,p_ciudad:q("#nCc").value.trim()})}
        q("#pb").querySelectorAll("[data-cn]").forEach(i=>{canc[i.dataset.cn]=i.value.trim()});
        const cc={};nums().forEach(x=>{const v=parseInt(canc[x],10);if(v>=1&&v<=200)cc[x]=v});
        await rpc("app_save_hermano",{p_nombre:n,p_cong:cid||null,p_tel:normContacto(q("#nT").value),p_bos:nums(),p_id:h0?.id||null,p_canc:cc});
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
    <div class="note">Uno por línea: <b>Nombre ; Congregación ; Celular o @usuario ; bosquejos</b>. Si la congregación no existe, se crea sola. Sirve para pegar desde WhatsApp o Excel.</div>
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
          await rpc("app_save_hermano",{p_nombre:c[0],p_cong:cid,p_tel:normContacto(c[2]),p_bos:(c[3]||"").split(/[^0-9]+/).map(Number).filter(x=>x>0&&x<=TITULOS.length)});
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
      <div class="note">${esc(cname(x.cong))}${x.tel?" · "+esc(x.tel):""}</div><div class="note ${infoOrador(x.id,HOY).nivel==="warn"?"wtxt":""}">${infoOrador(x.id,HOY).txt}</div>
      ${x.tel?(esUsuario(x.tel)?`<button class="wabtn" data-user="${esc(x.tel)}" aria-label="Copiar usuario de WhatsApp">${I.wa}</button>`:`<a class="wabtn" target="_blank" rel="noopener" href="${linkWa(x.tel)}" onclick="event.stopPropagation()">${I.wa}</a>`):""}<div class="chips">${x.bos.slice().sort((a,b)=>a-b).map(b=>`<span class="cn" title="${esc(tit(b))}">#${b}</span>`).join("")||'<span class="note">Sin bosquejos registrados</span>'}</div></div></div>`});
  h+=`</div>`;
  if(esAdmin())h+=`<div class="row" style="margin-top:12px"><button class="btn pri" id="a1">+ Orador</button><button class="btn line" id="a2">${I.paste} Pegar varios</button></div>`;
  $("#view").innerHTML=h;
  if($("#a1")){$("#a1").onclick=()=>nuevoOrador();$("#a2").onclick=pegarVarios}
  document.querySelectorAll("[data-eh]").forEach(e=>e.onclick=()=>nuevoOrador(null,e.dataset.eh));
  document.querySelectorAll("[data-user]").forEach(b=>b.onclick=ev=>{ev.stopPropagation();const u=b.dataset.user;try{navigator.clipboard.writeText(u).then(()=>toast(`${u} copiado: búscalo en WhatsApp`)).catch(()=>toast(`Busca a ${u} en WhatsApp`))}catch(e){toast(`Busca a ${u} en WhatsApp`)}});
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
  <div class="log">${DB.log.length?DB.log.map(l=>`<div class="card"><span class="tile ${(ESTADOS[l.k]||ESTADOS.sin)[1]}">${ICO_E[l.k]||I.empty}</span><div style="min-width:0"><time>${esc(l.t)}${l.autor?" · "+esc(l.autor):""}</time><div style="white-space:pre-wrap;font-weight:600;font-size:14px">${esc(l.m.replace(/\*/g,""))}</div></div></div>`).join(""):`<div class="card empty">Todavía no hay avisos.</div>`}</div>
  <div class="label">Cuenta</div>
  <div class="card" style="display:flex;flex-direction:column;gap:10px">
    <div class="note">Entraste como <b>${esc(esAdmin()?ETIQ:"Consulta")}</b> de <b>${esc(GRUPO.nombre)}</b>. Para ver el otro grupo, sal y entra con su PIN.</div>
    ${esAdmin()?`<div class="row"><button class="btn line" id="pc">${I.key} PIN de consulta</button><button class="btn line" id="pa">${I.key} Mi PIN</button></div>`:""}
    <button class="btn bad" id="out">Salir / cambiar de grupo</button>
  </div>`;
  $("#view").innerHTML=h;
  $("#out").onclick=salir;
  const cambiar=tipo=>hoja(`<div class="shead"><h2>${tipo==="consulta"?"PIN de consulta":"Mi PIN ("+esc(ETIQ)+")"}</h2><button class="x" data-close aria-label="Cerrar">✕</button></div>
    <div class="note">${tipo==="consulta"?"Es el que usan los ancianos para ver el programa. Al cambiarlo, deben entrar con el nuevo.":"Es tu PIN de administrador. Debe tener de 6 a 8 números y ser distinto a los demás."}</div>
    <div><span class="flab">Nuevo PIN (${tipo==="consulta"?"4":"6"} a 8 números)</span><input id="np" inputmode="numeric" maxlength="8" autocomplete="off"></div>
    <button class="btn pri" id="ok">Guardar PIN</button>`,(bg)=>{
      bg.querySelector("#ok").onclick=async()=>{const v=bg.querySelector("#np").value.trim();if(!(tipo==="consulta"?/^[0-9]{4,8}$/:/^[0-9]{6,8}$/).test(v)){toast(tipo==="consulta"?"Usa de 4 a 8 números":"Usa de 6 a 8 números");return}
        try{await rpc("app_cambiar_pin",{p_tipo:tipo,p_nuevo:v});if(tipo==="admin"){PIN=(LS.get("dtb_uid")||"")+"#"+v;LS.set("dtb_pin",PIN)}bg.remove();toast("PIN actualizado")}catch(e){toast(e.message)}}});
  if($("#pc")){$("#pc").onclick=()=>cambiar("consulta");$("#pa").onclick=()=>cambiar("admin")}
}

/* ---------- Arranque y refresco ---------- */
async function refrescar(){if(!PIN||$("#app").hidden||document.querySelector(".sheet-bg"))return;try{await cargar();render()}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)refrescar()});
setInterval(refrescar,60000);
(async()=>{
  if(document.readyState==="loading")await new Promise(r=>document.addEventListener("DOMContentLoaded",r));
  if(PIN){try{await cargar();iniciar();return}catch(e){LS.del("dtb_pin");PIN=null}}
  pintaLogin();
})();
