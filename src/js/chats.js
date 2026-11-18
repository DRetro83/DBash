/* DBash · chats.js: conversations and their folders. Part of the shared app logic (see js/README.md). */
/* ---------- saving conversations ---------- */
let huidigId=null;
const GKEY='debhelp-gesprekken';
function laadLijst(){try{return JSON.parse(opslag.get(GKEY)||'[]')}catch(e){return[]}}
function schrijfLijst(l){opslag.set(GKEY,JSON.stringify(l))}
function datumTekst(t){const d=new Date(t);return d.toLocaleDateString(undefined,{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}
function bewaarGesprek(){
  if(!S.historie||!gesprek.length)return;
  const l=laadLijst();
  if(!huidigId)huidigId=Date.now();
  const eerste=(gesprek.find(m=>m.role==='user'&&!m.samenvatting)||{content:'Conversation'}).content;
  const i=l.findIndex(x=>x.id===huidigId);
  const oud=i>=0?l[i]:null;
  const item={id:huidigId,titel:oud&&oud.hernoemd?oud.titel:eerste.slice(0,48),hernoemd:oud?oud.hernoemd:false,
              map:oud?oud.map:nieuweMap,web:webAan,rol:S.rol,datum:Date.now(),berichten:gesprek};
  if(i>=0)l.splice(i,1);
  l.unshift(item);
  schrijfLijst(l.slice(0,50));
  if(!oud)regel('✓ Saved in '+(item.map?'"'+item.map+'"':'loose chats'),'l-ok');
  toonLijst();
}
/* ---------- folders (tree) ---------- */
const MKEY='debhelp-mappen';
let nieuweMap='';
function laadMappen(){try{const m=JSON.parse(opslag.get(MKEY));if(Array.isArray(m))return m}catch(e){}return[{naam:'Debian',open:true},{naam:'Steam',open:true}]}
function schrijfMappen(m){opslag.set(MKEY,JSON.stringify(m))}
function pasGesprekAan(id,f){const l=laadLijst(),g=l.find(x=>x.id===id);if(g){f(g);schrijfLijst(l)}toonLijst()}
function bewerk(el,oud,klaar){
  const i=document.createElement('input');i.value=oud;i.className='bewerk';
  el.replaceWith(i);i.focus();i.select();
  let gedaan=false;
  const stop=ok=>{if(gedaan)return;gedaan=true;i.onblur=null;const v=i.value.trim();ok&&v&&v!==oud?klaar(v):toonLijst()};
  i.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')stop(true);if(e.key==='Escape')stop(false)};
  i.onblur=()=>stop(true);i.onclick=e=>e.stopPropagation();
}
function maakItem(g,laatste,mappen){
  const d=document.createElement('div');d.className='item'+(g.id===huidigId?' actief':'');d.draggable=true;
  d.innerHTML='<span class="tak"></span><span class="t"></span><span class="d"></span>'+(g.snapshot?'<button class="weg terug" title="Roll back your system to the start of this chat">⟲</button>':'')+'<button class="weg zet" title="Move to folder">⇄</button><button class="weg del" title="Delete">✕</button>';
  if(g.snapshot){const tb=d.querySelector('.terug');tb.onclick=e=>{e.stopPropagation();if(window.rolChatTerug)rolChatTerug(g)}}
  d.querySelector('.tak').textContent=laatste?'└─':'├─';
  d.querySelector('.t').textContent=g.titel;d.querySelector('.t').title='Double-click to rename';
  if(g.snapshot){const m=document.createElement('span');m.className='tsmerk';m.textContent=' ⟲';m.title='Restore point '+g.snapshot.naam;d.querySelector('.t').appendChild(m)}
  d.querySelector('.d').textContent=datumTekst(g.datum);
  d.onclick=()=>openGesprek(g.id);
  d.querySelector('.t').ondblclick=e=>{e.stopPropagation();bewerk(e.target,g.titel,v=>pasGesprekAan(g.id,x=>{x.titel=v;x.hernoemd=true}))};
  d.querySelector('.del').onclick=async e=>{e.stopPropagation();
    if(g.snapshot&&window.verwijderSnapshot){$('hpanel').classList.remove('open');const ok=await verwijderSnapshot(g);if(!ok)return}
    schrijfLijst(laadLijst().filter(x=>x.id!==g.id));if(g.id===huidigId)huidigId=null;toonLijst()};
  d.querySelector('.zet').onclick=e=>{
    e.stopPropagation();
    const sel=document.createElement('select');sel.className='bewerk';
    sel.innerHTML='<option value="">— loose chats —</option>'+mappen.map(m=>'<option></option>').join('');
    mappen.forEach((m,i)=>{sel.options[i+1].value=m.naam;sel.options[i+1].textContent=m.naam});
    sel.value=g.map||'';sel.onclick=ev=>ev.stopPropagation();
    sel.onchange=()=>pasGesprekAan(g.id,x=>x.map=sel.value);sel.onblur=()=>toonLijst();
    e.target.replaceWith(sel);sel.focus();
  };
  d.ondragstart=e=>{e.dataTransfer.setData('text/plain',String(g.id))};
  return d;
}
function maakDropDoel(el,mapNaam){
  el.ondragover=e=>{e.preventDefault();el.classList.add('drop')};
  el.ondragleave=()=>el.classList.remove('drop');
  el.ondrop=e=>{e.preventDefault();el.classList.remove('drop');const id=+e.dataTransfer.getData('text/plain');if(id)pasGesprekAan(id,x=>x.map=mapNaam)};
}
