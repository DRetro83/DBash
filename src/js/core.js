/* DBash · core.js: settings, storage and the terminal screen (lines, colours, copy and paste).
   The first of the shared app files (see js/README.md for all of them). They run in a normal browser
   as a preview (demo.js) and inside the DBash app, where real.js swaps in the real backend.
   Most names in the code are Dutch (regel = line, voerUit = run, vraagAI = ask the AI). */
const DBASH_VERSIE='0.4.3';
const DBASH_REPO='DRetro83/DBash';   // GitHub owner/repo: used for "update DBash" (change it here if the repo moves)
const $=id=>document.getElementById(id);
const out=$('out');

const THEMAS={
  'DBash':     {ok:'#9bb06a',warn:'#d8893a',err:'#c8503f',info:'#7aa6a0',bg:'#24201c',fg:'#d8c8a8',dim:'#8a7a62',accent:'#e0b030',glow:'rgba(216,200,168,.12)',bezel:'#3a342c',rood:'#9a2e40'},
  'Green':     {ok:'#66ff99',warn:'#ccff66',err:'#ff6655',info:'#33ccaa',bg:'#050a05',fg:'#33ff66',dim:'#1a8c38',accent:'#aaffbb',glow:'rgba(51,255,102,.55)'},
  'Amber':     {ok:'#ffd060',warn:'#ff8a00',err:'#ff5533',info:'#ffc890',bg:'#0d0700',fg:'#ffb000',dim:'#8a5f00',accent:'#ffd77a',glow:'rgba(255,176,0,.55)'},
  'White':     {ok:'#9ad48a',warn:'#e6b450',err:'#e06c6c',info:'#7fb4e6',bg:'#0a0a0c',fg:'#e8e8e8',dim:'#777',accent:'#ffffff',glow:'rgba(255,255,255,.4)'},
  'C64':       {ok:'#9ae29b',warn:'#c9d487',err:'#e07070',info:'#70a4ff',bg:'#352879',fg:'#a5a1ff',dim:'#6c5eb5',accent:'#ffffff',glow:'rgba(165,161,255,.5)'},
  'IBM Blue': {ok:'#7ee0a0',warn:'#ffd36a',err:'#ff7070',info:'#9fe2ff',bg:'#000a33',fg:'#5ac8ff',dim:'#2a6a99',accent:'#c8ecff',glow:'rgba(90,200,255,.5)'},
  'Debian':    {ok:'#ff9fb6',warn:'#ffb070',err:'#ff4040',info:'#ffd0dc',bg:'#120006',fg:'#ff3366',dim:'#a80030',accent:'#ffc0d0',glow:'rgba(215,10,83,.5)'},
};

/* ---------- storage (falls back to memory if the browser blocks it) ---------- */
const GEHEUGEN={};
const opslag={
  get(k){try{const v=localStorage.getItem(k);return v!==null?v:(k in GEHEUGEN?GEHEUGEN[k]:null)}catch(e){return k in GEHEUGEN?GEHEUGEN[k]:null}},
  set(k,v){GEHEUGEN[k]=v;try{localStorage.setItem(k,v)}catch(e){}}
};
/* ---------- settings ---------- */
const STD={thema:'DBash',frame:'venster',historie:true,font:"'IBM Plex Mono',monospace",size:17,scan:true,glow:true,flicker:false,type:true,splash:true,
           model:'Qwen3.5-9B-Q5_K_S',url:'http://127.0.0.1:8080',gpu:true,think:false,taal:'en',kleur:true,dlmap:'~/DBash/Downloads',dlOpen:true,mmap:'~/DBash/Models',mOpen:true,lees:true,zoekregio:'',sudomodus:'15',ts_aan:false,deeluit:'ask',kennis:[],rol:'free',les:{nu:0,klaar:[]},ctx:'16384',runvraag:true,ts_ess:true,ts_dev:'',br1:'default',br2:'firefox-esr',br3:'none',mupd:'notify',mkeep:'1',oudOpen:false,tab:'ai',wizardKlaar:false,pins:['Qwen3.5-9B-Q5_K_S','gpt-oss-20b-mxfp4'],updstart:true,appupd:true,
           sys_send:true,sys_os:'Debian 13 (trixie)',sys_de:'KDE Plasma',sys_gpu:'AMD Radeon RX 9070 XT (16 GB)',sys_cpu:'AMD Ryzen 5 9600X',sys_ram:'32 GB',sys_extra:'Steam installed'};
let S={...STD};STD.taal='auto';
const OUDE_THEMAS={'Vhalron':'DBash','Groen':'Green','Wit':'White','IBM blauw':'IBM Blue'};
try{Object.assign(S,JSON.parse(opslag.get('debhelp')||'{}'))}catch(e){}
if(OUDE_THEMAS[S.thema])S.thema=OUDE_THEMAS[S.thema];
if(!S.taalV3){S.taal='auto';S.taalV3=true}
function bewaar(){opslag.set('debhelp',JSON.stringify(S))}

function pasToe(){
  const t={bezel:'#1b1a17',rood:'',...(THEMAS[S.thema]||THEMAS.DBash)}, r=document.documentElement.style;
  if(!t.rood) t.rood=t.dim;
  if(!S.kleur){t.ok=t.fg;t.warn=t.accent;t.err=t.accent;t.info=t.dim;}
  for(const k in t) r.setProperty('--'+k,t[k]);
  r.setProperty('--font',S.font); r.setProperty('--size',S.size+'px');
  $('monitor').className='monitor '+(S.frame||'venster');
  $('screen').classList.toggle('scan',S.scan);
  $('screen').classList.toggle('glow',S.glow);
  $('screen').classList.toggle('flicker',S.flicker);
  document.querySelectorAll('.sw').forEach(e=>e.classList.toggle('sel',e.dataset.t===S.thema));
  $('sizev').textContent=S.size;
  if(typeof bouwModelWissel==='function')bouwModelWissel();
  bewaar();
}

// paneel vullen
for(const n in THEMAS){
  const t=THEMAS[n],d=document.createElement('div');
  d.className='sw';d.dataset.t=n;d.textContent=n;
  d.style.background=t.bg;d.style.color=t.fg;
  d.onclick=()=>{S.thema=n;pasToe()};
  $('themes').appendChild(d);
}
const koppel=(id,key,prop='value',num=false)=>{
  $(id)[prop]=S[key];
  $(id).addEventListener('input',()=>{S[key]=num?+$(id)[prop]:$(id)[prop];pasToe()});
};
koppel('frame','frame');koppel('historie','historie','checked');koppel('font','font');koppel('size','size','value',true);
koppel('fx-scan','scan','checked');koppel('fx-glow','glow','checked');
koppel('fx-flicker','flicker','checked');koppel('fx-type','type','checked');koppel('fx-splash','splash','checked');koppel('fx-kleur','kleur','checked');koppel('dlmap','dlmap');koppel('lees','lees','checked');koppel('zoekregio','zoekregio');koppel('sudomodus','sudomodus');koppel('ts_ess','ts_ess','checked');koppel('ts_dev','ts_dev');koppel('br1','br1');koppel('br2','br2');koppel('br3','br3');koppel('mupd','mupd');koppel('mkeep','mkeep');koppel('mmap','mmap');koppel('updstart','updstart','checked');koppel('appupd','appupd','checked');
// oude opgeslagen lettertype-instelling eenmalig vervangen door de nieuwe, duidelijkere standaard
if(!S.v2){S.font=STD.font;S.size=STD.size;S.v2=true;$('font').value=S.font;$('size').value=S.size;}
$('model').addEventListener('change',()=>{const v=$('model').value;if(v&&v!==S.model)wisselModel(v)});koppel('url','url');koppel('gpu','gpu','checked');koppel('think','think','checked');koppel('taal','taal');koppel('deeluit','deeluit');koppel('ctx','ctx');$('ctx').addEventListener('change',()=>{regel('◆ AI memory set to '+(+S.ctx).toLocaleString()+' tokens. It takes effect the next time the model loads (⚙ → LOAD AI, or switch model).','l-sys');toonGeheugen()});koppel('runvraag','runvraag','checked');['sys_os','sys_de','sys_gpu','sys_cpu','sys_ram','sys_extra'].forEach(k=>koppel(k,k));koppel('sys_send','sys_send','checked');


/* ---------- settings tabs ---------- */
(function(){
  const TABS=[['ai','AI'],['look','LOOK'],['system','SYSTEM'],['safety','SAFETY'],['files','FILES']];
  const SECTIE={'AI':'ai','RESTORE POINTS':'safety','COMMAND SAFETY':'safety','SUDO':'safety','TIMESHIFT':'safety','DOWNLOADS':'files','BACKUP':'files','WEBSITES':'files','THEME':'look','SYSTEM':'system','AI ROLE':'system','WINDOW':'look','FONT':'look','EFFECTS':'look'};
  const panel=$('panel'),h2=panel.querySelector('h2');
  const nav=document.createElement('div');nav.className='tabs';
  TABS.forEach(([id,naam])=>{const b=document.createElement('button');b.textContent=naam;b.dataset.t=id;b.onclick=()=>{S.tab=id;bewaar();toonTab()};nav.appendChild(b)});
  h2.after(nav);
  let huidig=null;
  [...panel.children].forEach(el=>{
    if(el.tagName==='H3'){const k=el.textContent.replace(/[\[\]]/g,'').trim();huidig=SECTIE[k]||huidig}
    if(huidig&&el!==nav&&el!==h2&&!el.classList.contains('close')){el.dataset.tab=huidig;if(el.style.display==='none')el.dataset.verborgen='1'}
  });
  window.toonTab=function(){
    if(!TABS.some(t=>t[0]===S.tab))S.tab='ai';
    nav.querySelectorAll('button').forEach(b=>b.classList.toggle('act',b.dataset.t===S.tab));
    panel.querySelectorAll('[data-tab]').forEach(el=>el.style.display=el.dataset.tab===S.tab&&!el.dataset.verborgen?'':'none');
  };
  toonTab();
})();

function paneel(id){['panel','hpanel','bpanel'].forEach(p=>{if(p!==id)$(p).classList.remove('open')});$(id).classList.toggle('open')}
$('gear').onclick=()=>paneel('panel');
$('hist').onclick=()=>paneel('hpanel');
$('boek').onclick=()=>{paneel('bpanel');toonBoek()};
$('bclose').onclick=()=>$('bpanel').classList.remove('open');
$('hclose').onclick=()=>$('hpanel').classList.remove('open');
$('close').onclick=()=>$('panel').classList.remove('open');

/* ---------- terminal output ---------- */
// stay at the bottom while you are at the bottom, whatever is added (buttons, cards, folds);
// when you scroll up to read, DBash leaves you there
let plakt=true;
out.addEventListener('scroll',()=>{plakt=out.scrollHeight-out.scrollTop-out.clientHeight<70});
new MutationObserver(()=>{if(plakt)out.scrollTop=1e9}).observe(out,{childList:true,subtree:true,characterData:true});
new ResizeObserver(()=>{if(plakt)out.scrollTop=1e9}).observe(out);
let naScroll=0;function onderaan(){out.scrollTop=1e9;cancelAnimationFrame(naScroll);naScroll=requestAnimationFrame(()=>{out.scrollTop=1e9})}
function regel(tekst,cls='l-sys'){
  const d=document.createElement('div');d.className=cls;d.textContent=tekst;
  out.insertBefore(d,invoerRij);onderaan();return d;
}
async function typ(tekst,cls){
  if(!S.type){regel(tekst,cls);return}
  const d=regel('',cls);
  for(const c of tekst){d.textContent+=c;await new Promise(r=>setTimeout(r,8))}
}

// AI-antwoord opmaken: denk-blok weg, codeblokken als uitvoerbare commando's
const VERTROUWD=['github.com','githubusercontent.com','debian.org','kernel.org','gnu.org','steampowered.com','valvesoftware.com','gitlab.com','sourceforge.net','flathub.org','mozilla.org','python.org','nodejs.org','mesa3d.org','amd.com','nvidia.com','protondb.com','archlinux.org','kde.org','winehq.org','lutris.net','huggingface.co','duckduckgo.com','wikipedia.org'];
function domein(u){try{return new URL(u).hostname.replace(/^www\./,'')}catch(e){return''}}
function vertrouwd(u){const d=domein(u);return VERTROUWD.some(v=>d===v||d.endsWith('.'+v))}
function markeerVreemdeLinks(el,res){
  const doms=new Set(res.map(r=>domein(r.url)).filter(Boolean));
  const vreemd=()=>{const s=document.createElement('span');s.className='vreemd';s.textContent=' ⚠ not from the search results';s.title='The AI wrote this address itself. It may be wrong or made up.';return s};
  el.querySelectorAll('a').forEach(a=>{if(a.closest('.dl'))return;if(!doms.has(domein(a.href)))a.after(vreemd())});
  el.querySelectorAll('.dl').forEach(k=>{const a=k.querySelector('.meta a');if(a&&!doms.has(domein(a.href))){k.querySelector('.meta').append(vreemd())}});
}
function tekstMetLinks(el,t){
  // links, `inline code` and **bold** get their own color
  const delen=t.split(/(https?:\/\/[^\s)<>"'`]+|`[^`\n]+`|\*\*[^*\n]+\*\*)/g);
  delen.forEach((d,i)=>{
    if(i%2===0){el.appendChild(document.createTextNode(d));return}
    if(d.startsWith('`')){const c=document.createElement('code');c.textContent=d.slice(1,-1);el.appendChild(c)}
    else if(d.startsWith('**')){const b=document.createElement('strong');b.textContent=d.slice(2,-2);el.appendChild(b)}
    else{const a=document.createElement('a');a.href=d;a.textContent=d;a.target='_blank';a.rel='noopener';el.appendChild(a)}
  });
}
/* ---------- copy & paste (the app replaces these with the system clipboard) ---------- */
window.kopieer=window.kopieer||(async t=>{try{await navigator.clipboard.writeText(t);return true}catch(e){const ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch(x){}ta.remove();return ok}});
window.plakTekst=window.plakTekst||(async()=>{try{return await navigator.clipboard.readText()}catch(e){return null}});
let toastTik=0;
function toast(t){let k=document.querySelector('.kopietoast');if(!k){k=document.createElement('div');k.className='kopietoast';$('screen').appendChild(k)}k.textContent=t;k.classList.add('aan');clearTimeout(toastTik);toastTik=setTimeout(()=>k.classList.remove('aan'),1200)}
async function kopieerTekst(t,wat){if(!t)return;const ok=await kopieer(t);toast(ok===false?'✗ could not copy':'⧉ copied'+(wat?' '+wat:''))}
async function plakInPrompt(){
  const t=await plakTekst();if(t===null||t===undefined){toast('✗ nothing to paste');return}
  const v=document.querySelector('.vraagveld')||document.querySelector('.pwveld')||inp;v.focus();
  const a=v.selectionStart??v.value.length,b=v.selectionEnd??v.value.length;v.value=v.value.slice(0,a)+t+v.value.slice(b);
  try{v.setSelectionRange(a+t.length,a+t.length)}catch(e){}if(v===inp)groei();
}
const selectie=()=>String(window.getSelection&&window.getSelection()||'');
document.addEventListener('keydown',e=>{
  if(e.target&&e.target.closest&&e.target.closest('.xterm'))return;
  const k=(e.key||'').toLowerCase();
  if(e.ctrlKey&&k==='c'&&selectie()!==''&&!(e.target===inp&&inp.selectionStart!==inp.selectionEnd&&!e.shiftKey)){e.preventDefault();e.stopImmediatePropagation();kopieerTekst(selectie());return}
  if(e.ctrlKey&&e.shiftKey&&k==='v'){e.preventDefault();e.stopImmediatePropagation();plakInPrompt();return}
  if(e.ctrlKey&&!e.shiftKey&&k==='v'&&!(e.target&&/^(INPUT|TEXTAREA)$/.test(e.target.tagName))){e.preventDefault();plakInPrompt();return}
},true);
function rkMenu(x,y,items){
  document.querySelectorAll('.rkmenu').forEach(m=>m.remove());
  const m=document.createElement('div');m.className='rkmenu';
  items.forEach(([t,f,key])=>{const d=document.createElement('div');d.textContent=t;if(key){const s=document.createElement('span');s.className='rkkey';s.textContent=key;d.appendChild(s)}if(!f)d.className='uit';else d.onmousedown=e=>{e.preventDefault();e.stopPropagation();m.remove();f()};m.appendChild(d)});
  document.body.appendChild(m);const r=m.getBoundingClientRect();
  m.style.left=Math.min(x,innerWidth-r.width-6)+'px';m.style.top=Math.min(y,innerHeight-r.height-6)+'px';
  const weg=()=>{m.remove();document.removeEventListener('mousedown',weg,true)};setTimeout(()=>document.addEventListener('mousedown',weg,true));
}
document.addEventListener('contextmenu',e=>{
  if(!e.target.closest||!e.target.closest('#out,#in')||e.target.closest('.xterm'))return;
  e.preventDefault();const sel=selectie(),items=[];
  items.push(['⧉ Copy',sel?()=>kopieerTekst(sel):null,'Ctrl+C']);
  const c=e.target.closest('.cmd');if(c&&c.dataset.cmd)items.push(['⧉ Copy command',()=>kopieerTekst(c.dataset.cmd,'command')]);
  const u=e.target.closest('.l-uit,.l-uitfout,.uitvouw');if(u){const vol=u.querySelector('.uvol');items.push(['⧉ Copy output',()=>kopieerTekst((vol?vol.textContent:u.textContent).replace(/\s*(◆ ASK AI.*|↻ RETRY WITH SUDO.*)$/s,'').trim(),'output')])}
  const a=e.target.closest('.l-ai');if(a&&!c)items.push(['⧉ Copy this answer',()=>kopieerTekst(a.innerText.trim(),'answer')]);
  items.push(['📋 Paste into the prompt',()=>plakInPrompt(),'Ctrl+V']);
  rkMenu(e.clientX,e.clientY,items);
});
/* ---------- several lines that belong together become one command ---------- */
function voegRegelsSamen(regels){
  const uit=[];let buf=null,diepte=0,heredoc=null;
  for(const r of regels){
    if(buf===null){if(!r.trim())continue;buf=r}else buf+='\n'+r;
    const t=r.trim();
    if(heredoc){if(t===heredoc)heredoc=null;else continue}
    else{const h=/(^|[^<])<<-?\s*['"]?([A-Za-z_]\w*)['"]?/.exec(r);if(h){heredoc=h[2];continue}}
    if(/^#/.test(t)&&diepte===0&&buf===r){uit.push(buf);buf=null;continue}
    const z=r.replace(/'[^']*'|"(\\.|[^"\\])*"/g,'""').replace(/(^|\s)#.*$/,'');
    const open=(z.match(/(^|[;&|\s(])(do|then|case)(?=\s|$|;)/g)||[]).length+(z.match(/(^|[;&\s])\{(?=\s|$)/g)||[]).length;
    const dicht=(z.match(/(^|[;&|\s])(done|fi|esac)(?=\s|$|;|\)|<|>|\|)/g)||[]).length+(z.match(/(^|[;&\s])\}(?=\s|$|;)/g)||[]).length;
    diepte=Math.max(0,diepte+open-dicht);
    if(diepte>0||/\\$/.test(r)||/(\||&&|\|\|)\s*$/.test(z))continue;
    uit.push(buf.replace(/\\\n\s*/g,' '));buf=null;diepte=0;
  }
  if(buf!==null)uit.push(buf.replace(/\\\n\s*/g,' '));
  return uit;
}
/* ---------- terminal text: colours (ANSI), \r progress lines ---------- */
function zonderAnsi(t){return String(t||'').replace(/\x1b\[[0-9;?]*[A-Za-z]/g,'').replace(/\x1b\][^\x07\x1b]*(\x07|\x1b\\)/g,'').replace(/\x1b[()][A-Z0-9]/g,'')}
function schoonTerm(t){
  t=String(t||'').replace(/\x1b7[\s\S]*?\x1b8/g,'').replace(/\x1b\[s[\s\S]*?\x1b\[u/g,'').replace(/\x1b[78]/g,'').replace(/^Progress: \[\s*\d+%\].*(\r?\n|$)/gm,'').replace(/\x1b\][^\x07\x1b]*(\x07|\x1b\\)/g,'').replace(/\x1b\[[0-9;?]*[A-La-ln-z]/g,'').replace(/\x1b[()][A-Z0-9]/g,'').replace(/\x1b[=>]/g,'');
  return t.replace(/\r\n/g,'\n').split('\n').map(r=>{if(!r.includes('\r'))return r;const d=r.split('\r').filter(x=>x!=='');return d.length?d[d.length-1]:''}).join('\n').replace(/[\x00-\x08\x0b\x0c\x0e-\x1a\x1c-\x1f]/g,'').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').replace(/\s+$/,'');
}
function ansiDom(el,t){
  t=schoonTerm(t);let cls=[];const re=/\x1b\[([0-9;]*)m/g;let pos=0,m;
  const zet=x=>{if(!x)return;if(!cls.length){el.appendChild(document.createTextNode(x));return}const s=document.createElement('span');s.className=cls.join(' ');s.textContent=x;el.appendChild(s)};
  while((m=re.exec(t))){zet(t.slice(pos,m.index));pos=re.lastIndex;
    const codes=(m[1]||'0').split(';').map(Number);
    for(let i=0;i<codes.length;i++){const c=codes[i];
      if(c===0)cls=[];else if(c===1)cls=cls.filter(x=>x!=='a-1').concat('a-1');
      else if(c===22)cls=cls.filter(x=>x!=='a-1');
      else if((c>=30&&c<=37)||(c>=90&&c<=97))cls=cls.filter(x=>!/^a-(3|9)\d$/.test(x)).concat('a-'+c);
      else if(c===39)cls=cls.filter(x=>!/^a-(3|9)\d$/.test(x));
      else if(c===38||c===48){i+=codes[i+1]===5?2:codes[i+1]===2?4:0}}}
  zet(t.slice(pos));
}
