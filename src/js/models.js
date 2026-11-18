/* DBash · models.js: downloads, the models folder, Hugging Face, model updates. Part of the shared app logic (see js/README.md). */
/* ---------- downloads (DBash download folder) ---------- */
const DKEY='dbash-downloads';
function laadDownloads(){try{return JSON.parse(opslag.get(DKEY)||'[]')}catch(e){return[]}}
function schrijfDownloads(l){opslag.set(DKEY,JSON.stringify(l))}
function voegDownloadToe(x){
  const l=laadDownloads();
  l.unshift({id:Date.now(),naam:x.naam,url:x.url,bron:x.bron,vertrouwd:x.vertrouwd,datum:Date.now(),gesprek:huidigId||null,gh:ghInfo(x.url)});
  schrijfDownloads(l.slice(0,200));toonLijst();
}
function toonDownload(dl){
  const g=dl.gesprek?laadLijst().find(x=>x.id===dl.gesprek):null;
  regel('⤓ '+dl.naam,'c-acc');
  regel('   path:   '+S.dlmap+'/'+dl.naam);
  const b=regel('   source: ','l-sys');tekstMetLinks(b,dl.url);
  const v=regel('   check:  '+(dl.vertrouwd?'✓ trusted source ('+dl.bron+')':'⚠ unknown source ('+dl.bron+')'),dl.vertrouwd?'l-ok':'l-warn');
  regel('   date:   '+datumTekst(dl.datum));
  if(dl.update){regel('   update: ↑ '+dl.update.tag+' is available (you have '+(dl.gh?dl.gh.tag:'?')+')','l-warn');
    const k=regel('','l-ai');k.appendChild(downloadKaart(dl.update.url));}
  else if(ghInfo(dl.url))regel('   update: '+(dl.gecheckt?'✓ up to date (checked '+datumTekst(dl.gecheckt)+')':'not checked yet, click ⟳ at Downloads'),dl.gecheckt?'l-ok':'l-sys');
  else regel('   update: can only be checked automatically for GitHub releases','l-sys');
  if(g){const r=regel('   chat:   ','l-sys');const a=document.createElement('a');a.href='#';a.textContent=g.titel;a.style.color='var(--accent)';
    a.onclick=e=>{e.preventDefault();openGesprek(g.id)};r.appendChild(a)}
  regel('   [preview] In the real app you can open the file or folder from here.','l-sys');
}
const DLICO='<svg width="14" height="12" viewBox="0 0 7 6" shape-rendering="crispEdges" fill="currentColor"><path d="M3 0h1v3H3zM2 2h1v1H2zM4 2h1v1H4zM0 4h1v2H0zM6 4h1v2H6zM1 5h5v1H1z"/></svg>';
function toonDownloadSectie(box,zq){
  const l=laadDownloads().filter(x=>!zq||x.naam.toLowerCase().includes(zq.toLowerCase())||(x.bron||'').includes(zq.toLowerCase()));
  if(zq&&!l.length)return;
  const r=document.createElement('div');r.className='map dlmap';
  r.innerHTML='<span class="pijl"></span><span class="mapico">'+DLICO+'</span><span class="naam">Downloads</span><span class="aantal"></span><button class="weg chk2 upd-knop" title="Check for updates">⟳</button><button class="weg del" title="Clear the download list (files stay on disk)">✕</button>';
  r.querySelector('.upd-knop').onclick=e=>{e.stopPropagation();checkUpdates(false)};
  r.querySelector('.pijl').textContent=S.dlOpen?'▾':'▸';
  r.querySelector('.aantal').textContent='('+l.length+')';
  r.title=S.dlmap;
  r.onclick=()=>{S.dlOpen=!S.dlOpen;bewaar();toonLijst()};
  r.querySelector('.del').onclick=e=>{e.stopPropagation();
    if(!r.dataset.zeker){r.dataset.zeker=1;e.target.textContent='sure?';setTimeout(()=>toonLijst(),2500);return}
    schrijfDownloads([]);toonLijst()};
  box.appendChild(r);
  if(!S.dlOpen)return;
  if(!l.length){const x=document.createElement('div');x.className='leeg in';x.textContent='└─ (no downloads yet)';box.appendChild(x);return}
  l.forEach((dl,i)=>{
    const d=document.createElement('div');d.className='item dl-item';
    d.innerHTML='<span class="tak"></span><span class="t"></span><span class="d"></span><button class="weg del" title="Remove from list">✕</button>';
    d.querySelector('.tak').textContent=i===l.length-1?'└─':'├─';
    const t=d.querySelector('.t');t.textContent=(dl.vertrouwd?'':'⚠ ')+dl.naam;t.title=dl.url;
    if(dl.update){const u=document.createElement('span');u.className='upd';u.textContent=' ↑ '+dl.update.tag;t.appendChild(u)}
    d.querySelector('.d').textContent=dl.bron;
    d.onclick=()=>{toonDownload(dl);$('hpanel').classList.remove('open');inp.focus()};
    d.querySelector('.del').onclick=e=>{e.stopPropagation();schrijfDownloads(laadDownloads().filter(x=>x.id!==dl.id));toonLijst()};
    box.appendChild(d);
  });
}
/* ---------- models folder ---------- */
const MOKEY='dbash-modellen';
const HF_REPO='mozilla-ai/llamafile_0.10';
let nieuweModellen=[],bezigMetCheck=false;
function laadModellen(){try{const m=JSON.parse(opslag.get(MOKEY));if(Array.isArray(m))return m}catch(e){}
  const vandaag=new Date();vandaag.setHours(15,20,0,0);const t=vandaag.getTime();
  return[{naam:'Qwen3.5-9B-Q5_K_S',gb:7.4,datum:t},{naam:'gpt-oss-20b-mxfp4',gb:12,datum:t},{naam:'Qwen3.5-4B-Q5_K_S',gb:4.1,datum:t},{naam:'Qwen3.5-2B-Q8_0',gb:3.2,datum:t},{naam:'Qwen3.5-0.8B-Q8_0',gb:1.6,datum:t}]}
function schrijfModellen(m){opslag.set(MOKEY,JSON.stringify(m))}
function ext(m){return m&&m.type==='gguf'?'.gguf':'.llamafile'}
function bestand(m){return m.naam+ext(m)}
function startCmd(naam){const m=laadModellen().find(x=>x.naam===(naam||S.model))||{naam:naam||S.model};
  const g=' --gpu '+(S.gpu?'vulkan -ngl 999':'cpu -ngl 0')+' --reasoning off';
  return m.type==='gguf'?S.mmap+'/llamafile -m '+S.mmap+'/'+bestand(m)+g:S.mmap+'/'+bestand(m)+g}
function grootte(gb){return(Math.round(gb*10)/10)+' GB'}
function vram(){const m=/(\d+)\s*GB/i.exec(S.sys_gpu||'');return m?+m[1]:0}
function past(gb){const v=vram();return v?gb<=v-2:false}
/* model switching with a visible loading time */
let modelLaden=null,laadGen=0;const inCache=new Set();
function titelTekst(){return 'DBASH v'+DBASH_VERSIE+' // '+(aiKlaar?S.model+(S.gpu?' // GPU':' // CPU'):'NO AI · '+kortNaam(S.model))}
function balk(p){const n=Math.round(p/10);return '['+'█'.repeat(n)+'░'.repeat(10-n)+'] '+String(Math.round(p)).padStart(3)+'%'}
function wisselModel(naam){
  if(S.model===naam&&!modelLaden){regel('◆ '+naam+' is already the active model.','c-acc');return}
  S.model=naam;const sel=$('model');if(![...sel.options].some(o=>o.value===naam)){const o=document.createElement('option');o.value=naam;o.textContent=naam;sel.appendChild(o)}
  sel.value=naam;pasToe();toonLijst();
  const m=laadModellen().find(x=>x.naam===naam)||{gb:5};
  const snel=inCache.has(naam);
  const echteSec=snel?2:Math.max(3,Math.round(m.gb*1.5));          // rough estimate for the real app
  const duur=(snel?1.2:Math.max(1.8,m.gb*0.45))*1000;                  // shortened for the preview
  const gen=++laadGen;
  const lijn=regel('','l-tl');
  const zet=p=>{lijn.textContent='⏳ Loading '+naam+'  '+balk(p)+(snel?'  (cached in RAM, fast)':'  ~'+echteSec+' s')};
  zet(0);
  $('title').textContent='DBASH v'+DBASH_VERSIE+' // LOADING '+kortNaam(naam)+'…';$('led').classList.add('laadt');
  $('modelwissel').classList.add('laden');
  let klaarFn;modelLaden=new Promise(r=>klaarFn=r);
  const start=performance.now();
  (function stap(){
    if(gen!==laadGen){lijn.textContent='✕ Loading '+naam+' cancelled (switched to another model)';lijn.className='l-sys';klaarFn();return}
    const p=Math.min(100,(performance.now()-start)/duur*100);
    zet(p);
    const knop=[...document.querySelectorAll('#modelwissel button')].find(b=>b.title.startsWith(naam));
    if(knop)knop.textContent='⏳'+Math.round(p)+'%';
    if(p<100){setTimeout(stap,80);return}
    inCache.add(naam);modelLaden=null;
    $('led').classList.remove('laadt');$('modelwissel').classList.remove('laden');bouwModelWissel();
    $('title').textContent=titelTekst();
    lijn.textContent='✓ '+naam+' loaded'+(S.gpu?' on GPU':' on CPU')+(snel?' (from RAM cache)':'');lijn.className='l-ok';
    if(aiKlaar)regel('[preview] The real app restarts the llamafile with this model; the time above is a shortened example.','l-sys');
    klaarFn();
  })();
}
const CHIPICO='<svg width="14" height="12" viewBox="0 0 7 6" shape-rendering="crispEdges" fill="currentColor"><path d="M1 0h1v1H1zM3 0h1v1H3zM5 0h1v1H5zM0 1h7v4H0zM1 5h1v1H1zM3 5h1v1H3zM5 5h1v1H5z"/><path d="M2 2h3v2H2z" fill="var(--bg)"/></svg>';
/* ---------- Hugging Face: find and download GGUF models ---------- */
const hfBase=()=>window.HF_BASE||'https://huggingface.co',ghBase=()=>window.GH_BASE||'https://api.github.com';
const HF_VERTROUWD=['unsloth','bartowski','ggml-org','lmstudio-community','Qwen','mistralai','google','mozilla-ai'];
const AANBEVOLEN=[
  ['Gemma 4 26B-A4B','gemma-4-26b-a4b-it',['qat.*q4_0','IQ4_XS','Q4_K_M'],14.5,'newest all-rounder, fast (MoE), strong for its size'],
  ['gpt-oss 20B','gpt-oss-20b',['mxfp4','Q4_K_M'],14.5,'reasoning and tools, fast (MoE)'],
  ['Qwen3 14B','qwen3-14b',['Q5_K_M','Q4_K_M'],11.5,'dense model, leaves room for a long chat'],
  ['Devstral Small','devstral-small',['Q4_K_M','IQ4_XS'],14.5,'best for programming'],
  ['Qwen3.5 4B','qwen3.5-4b',['Q5_K_M','Q4_K_M'],4,'small and very fast, for quick questions']];
window.hfJSON=window.hfJSON||(async u=>{const r=await fetch(u);if(!r.ok)throw new Error('HTTP '+r.status);return r.json()});
// The list of recommended models can also come from the DBash repository (data/models.json), so it can change
// without a new DBash version. Anything that does not look right is ignored, and then the list above is used.
let AANBEVOLEN_GH=null;
async function aanbevolen(){
  if(AANBEVOLEN_GH)return AANBEVOLEN_GH;
  try{
    const j=await hfJSON('https://raw.githubusercontent.com/'+DBASH_REPO+'/main/data/models.json');
    const tekst=(x,n)=>typeof x==='string'&&x.length>0&&x.length<=n;
    const l=(Array.isArray(j&&j.models)?j.models:[]).filter(m=>m&&tekst(m.name,40)&&tekst(m.search,60)&&/^[\w.-]+$/.test(m.search)&&Array.isArray(m.files)&&m.files.length&&m.files.every(f=>tekst(f,40)&&/^[\w.*-]+$/.test(f))&&typeof m.max_gb==='number'&&m.max_gb>0&&m.max_gb<=200)
      .slice(0,12).map(m=>[m.name,m.search,m.files.slice(0,5),m.max_gb,tekst(m.why,100)?m.why:'']);
    if(l.length){AANBEVOLEN_GH=l;return l}
  }catch(e){}
  return AANBEVOLEN;
}
const gb=n=>n<1e9?Math.max(1,Math.round(n/1e6))+' MB':(Math.round(n/1e8)/10)+' GB';
const pasLabel=bytes=>{const v=vram(),g=bytes/1e9;if(!v)return['?',''];if(g<=v-1.5)return['GPU ✓','ja'];if(g<=v+((parseInt(S.sys_ram)||16)*0.6))return['part CPU','half'];return['too big','nee']};
function hfRij(box,naam,info,knoppen,extra){const k=regel('','l-sys');const r=document.createElement('div');r.className='hfrij';
  const n=document.createElement('span');n.className='hn';n.textContent=naam;n.title=naam;r.appendChild(n);
  if(extra)r.appendChild(extra);if(info){const d=document.createElement('span');d.className='hd';d.textContent=info;r.appendChild(d)}
  (knoppen||[]).forEach(([t,f,uit])=>{const b=document.createElement('button');b.textContent=t;if(uit)b.disabled=true;else b.onclick=e=>{e.stopPropagation();f(b)};r.appendChild(b)});
  k.appendChild(r);return k}
const ggufBestanden=tree=>{
  const f=tree.filter(x=>x.type==='file'&&/\.gguf$/i.test(x.path)&&!/mmproj/i.test(x.path)),gr=x=>(x.lfs&&x.lfs.size)||x.size||0,uit=[];
  f.forEach(x=>{const m=/^(.*)-(\d{5})-of-(\d{5})\.gguf$/i.exec(x.path);
    if(!m){uit.push({pad:x.path,size:gr(x),delen:[x.path]});return}
    if(m[2]!=='00001')return;const delen=f.filter(y=>y.path.startsWith(m[1]+'-')&&/-\d{5}-of-\d{5}\.gguf$/i.test(y.path)).sort((a,b)=>a.path<b.path?-1:1);
    uit.push({pad:x.path,size:delen.reduce((a,y)=>a+gr(y),0),delen:delen.map(y=>y.path)})});
  return uit.sort((a,b)=>b.size-a.size)};
async function hfZoek(q){
  regel('🔍 Hugging Face · "'+q+'" · GGUF models, most downloaded first','c-info');
  let lijst;try{lijst=await hfJSON(hfBase()+'/api/models?search='+encodeURIComponent(q)+'&filter=gguf&sort=downloads&direction=-1&limit=40')}catch(e){regel('✗ Hugging Face is not reachable: '+e.message,'l-err');return}
  if(!lijst.length){regel('   nothing found. Try fewer or other words, e.g. "gemma 4" or "qwen3".','l-sys');return}
  lijst.sort((a,b)=>(HF_VERTROUWD.includes(b.id.split('/')[0])?1:0)-(HF_VERTROUWD.includes(a.id.split('/')[0])?1:0));
  lijst.slice(0,12).forEach(m=>{const slot=m.gated&&m.gated!=='false';const x=document.createElement('span');
    if(slot){x.className='slot';x.textContent='🔒 login'}else if(HF_VERTROUWD.includes(m.id.split('/')[0])){x.className='fit ja';x.textContent='✓ known'}
    hfRij(null,m.id,'⤓ '+(m.downloads||0).toLocaleString(),[[slot?'needs login':'FILES',()=>hfBestandenLijst(m.id),slot]],x)});
  regel('   ✓ known = a well-known uploader of GGUF files · pick an "-it" or "Instruct" model, not a "base" model','l-sys');
}
async function hfBestandenLijst(repo){
  regel('📦 '+repo,'c-info');
  let tree;try{tree=await hfJSON(hfBase()+'/api/models/'+repo+'/tree/main?recursive=1')}catch(e){regel('✗ '+e.message,'l-err');return}
  const fs2=ggufBestanden(tree);if(!fs2.length){regel('   no GGUF files in this repository','l-sys');return}
  fs2.forEach(f=>{const[l,c]=pasLabel(f.size);const x=document.createElement('span');x.className='fit '+c;x.textContent=l;
    hfRij(null,f.pad.split('/').pop()+(f.delen.length>1?' ('+f.delen.length+' parts)':''),gb(f.size),[['⤓ DOWNLOAD',()=>hfDownload(repo,f)]],x)});
  regel('   GPU ✓ = fits on your GPU ('+(vram()||'?')+' GB) with room for the AI memory · bigger Q numbers = better quality but bigger','l-sys');
}
async function hfDownload(repo,f){
  if(!window.downloadModel){regel('[preview] Downloading works in the DBash app.','l-sys');return}
  const naam=f.pad.split('/').pop();const[l]=pasLabel(f.size);
  const a=await vraagJN('Download '+naam+' ('+gb(f.size)+', '+l+') from '+repo+' into '+S.mmap+'? [y/N] ',{keys:[...JA,...NEE],def:'n'});
  if(!a||!JA.includes(a)){regel('   not downloaded','l-sys');return}
  const vrij=window.schijfVrij?await schijfVrij(S.mmap):null;
  if(vrij!==null&&vrij<f.size+2e9){regel('✗ Not enough free space in '+S.mmap+' ('+gb(vrij)+' free, '+gb(f.size)+' needed).','l-err');return}
  for(const deel of f.delen){const ok=await dlMetBalk(hfBase()+'/'+repo+'/resolve/main/'+deel.split('/').map(encodeURIComponent).join('/')+'?download=true',deel.split('/').pop());if(!ok)return}
  if(window.engineInfo){const e=await engineInfo();if(!e.heeft){const b=await vraagJN('⚙ .gguf models need the llamafile engine, and it is not in '+S.mmap+' yet. Download the newest from GitHub? [Y/n] ',{keys:[...JA,...NEE],def:'y'});if(b&&JA.includes(b))await hfEngine()}}
  if(window.scanModellen)await scanModellen(false);
  const m=naam.replace(/\.gguf$/i,'').replace(/-\d{5}-of-\d{5}$/,'');
  // remember where it came from, so DBash can check it for updates later (only the first part of a split model)
  S.modelBron=S.modelBron||{};S.modelBron[naam.replace(/\.gguf$/i,'')]={repo,pad:f.delen[0]};bewaar();
  const u=await vraagJN('Use '+m+' now? [Y/n] ',{keys:[...JA,...NEE],def:'y'});if(u&&JA.includes(u)&&laadModellen().some(x=>x.naam===m))wisselModel(m);
}
async function dlMetBalk(url,naam){
  const lijn=regel('⤓ '+naam+'  ','l-tl');const balk=document.createElement('span');balk.className='dlbalk';lijn.appendChild(balk);
  const st=document.createElement('button');st.className='stopknop';st.textContent='■ STOP';lijn.appendChild(st);
  let t0=Date.now(),d0=0;
  const job=downloadModel(url,naam,(done,total)=>{const p=total?Math.floor(done/total*100):0,n=Math.round(p/5),sec=(Date.now()-t0)/1000,mbs=sec>0?(done-d0)/1e6/sec:0;
    balk.textContent='█'.repeat(n)+'░'.repeat(20-n)+'  '+String(p).padStart(3)+'%  '+gb(done)+' of '+(total?gb(total):'?')+(mbs?'  ·  '+mbs.toFixed(0)+' MB/s':'')});
  st.onclick=e=>{e.stopPropagation();job.stop()};
  try{const pad=await job.klaar;st.remove();lijn.className='l-ok';lijn.firstChild.textContent='✓ '+naam+'  ';balk.textContent='saved: '+pad;logToevoegen({c:'⤓ '+naam,r:'safe',ok:true,gesprek:huidigId,uit:url});return true}
  catch(e){st.remove();lijn.className='l-err';balk.textContent='✗ '+String(e.message||e)+(/stopped|incomplete/.test(String(e))?'':'');return false}
}
async function hfEngine(){
  let rel;try{rel=await hfJSON(ghBase()+'/repos/mozilla-ai/llamafile/releases/latest')}catch(e){regel('✗ GitHub is not reachable: '+e.message,'l-err');return false}
  const a=(rel.assets||[]).find(x=>/^llamafile-\d+\.\d+\.\d+$/.test(x.name));if(!a){regel('✗ No engine file found in the newest release ('+rel.tag_name+'). Download it yourself from github.com/mozilla-ai/llamafile/releases and save it as '+S.mmap+'/llamafile.','l-err');return false}
  regel('⚙ llamafile engine '+rel.tag_name+' ('+gb(a.size)+')','c-info');
  return dlMetBalk(a.browser_download_url,'llamafile');
}
async function hfBeste(){
  regel('★ Best models for your GPU ('+(vram()||'?')+' GB) · found on Hugging Face right now','c-info');
  if(window.engineInfo){const e=await engineInfo();let tag='';try{tag=(await hfJSON(ghBase()+'/repos/mozilla-ai/llamafile/releases/latest')).tag_name||''}catch(x){}
    const nieuwer=tag&&e.versie&&tag.replace(/^v/,'')!==e.versie;
    hfRij(null,'⚙ llamafile engine',e.heeft?'you have '+(e.versie||'?')+(tag?' · newest '+tag:''):'missing (needed for .gguf)',[[e.heeft&&!nieuwer?'✓ OK':'⤓ '+(e.heeft?'UPDATE':'DOWNLOAD'),()=>hfEngine(),e.heeft&&!nieuwer]])}
  const lijst=await aanbevolen();if(lijst!==AANBEVOLEN)regel('   (the list comes from github.com/'+DBASH_REPO+', data/models.json)','l-sys');
  for(const[n,w,pats,max,u] of lijst){
    const r=await hfVind(w,pats,max);
    const x=document.createElement('span');x.className='hd';x.textContent=u;
    if(!r){hfRij(null,n,'not found right now',[],x);continue}
    hfRij(null,n+' · '+r.f.pad.split('/').pop(),gb(r.f.size)+' · '+r.repo.split('/')[0],[['⤓ DOWNLOAD',()=>hfDownload(r.repo,r.f)]],x);
  }
  regel('   Big models (13–15 GB) leave little room for the AI memory: use 8,000 or 16,000 tokens (⚙ → AI). Search more with: hf <words>','l-sys');
}
async function hfVind(w,pats,max){
  let lijst;try{lijst=await hfJSON(hfBase()+'/api/models?search='+encodeURIComponent(w)+'&filter=gguf&sort=downloads&direction=-1&limit=40')}catch(e){return null}
  const repos=lijst.filter(m=>!(m.gated&&m.gated!=='false')&&HF_VERTROUWD.includes(m.id.split('/')[0])).slice(0,6);
  const bomen=[];for(const m of repos){try{bomen.push({repo:m.id,fs:ggufBestanden(await hfJSON(hfBase()+'/api/models/'+m.id+'/tree/main?recursive=1'))})}catch(e){}}
  // the preferred quantisation first (e.g. the original mxfp4 of gpt-oss), from the most downloaded repo that has it
  for(const p of pats)for(const b of bomen){const f=b.fs.find(x=>new RegExp(p,'i').test(x.pad)&&x.size<=max*1e9);if(f)return{repo:b.repo,f}}
  return null}
function toonModelSectie(box,zq){
  const alleM=laadModellen();
  const l=alleM.filter(m=>!zq||m.naam.toLowerCase().includes(zq.toLowerCase()));
  if(zq&&!l.length)return;
  const totaal=alleM.reduce((a,m)=>a+(+m.gb||0),0),oudGb=alleM.reduce((a,m)=>a+(m.oud||[]).reduce((x,o)=>x+o.gb,0),0);
  const r=document.createElement('div');r.className='map mmap';
  r.innerHTML='<span class="pijl"></span><span class="mapico">'+CHIPICO+'</span><span class="naam">Models</span><span class="aantal"></span><button class="weg chk2 hf-knop" title="Find models on Hugging Face">🔍</button><button class="weg chk2 add-knop" title="Add a model file (.llamafile or .gguf)">＋</button><button class="weg chk2 upd-knop" title="Check for updates">⟳</button>';
  r.querySelector('.pijl').textContent=S.mOpen?'▾':'▸';
  const upd=l.filter(m=>m.update).length;
  r.querySelector('.aantal').textContent='('+l.length+' · '+grootte(totaal)+(upd?' · '+upd+'↑':'')+')';
  r.title=S.mmap+' · '+grootte(totaal)+(oudGb?' + old versions '+grootte(oudGb):'');
  r.onclick=()=>{S.mOpen=!S.mOpen;bewaar();toonLijst()};
  r.querySelector('.upd-knop').onclick=e=>{e.stopPropagation();checkUpdates(false)};
  r.querySelector('.add-knop').onclick=e=>{e.stopPropagation();$('modelbestand').click()};
  r.querySelector('.hf-knop').onclick=e=>{e.stopPropagation();$('hpanel').classList.remove('open');hfBeste()};
  if(bezigMetCheck)r.querySelectorAll('.upd-knop').forEach(b=>b.classList.add('draai'));
  box.appendChild(r);
  if(!S.mOpen)return;
  const oude=[];alleM.forEach(m=>(m.oud||[]).forEach((o,oi)=>oude.push({m,o,oi})));
  const nieuw=zq?[]:nieuweModellen.map(n=>({naam:n.naam,gb:n.gb,soort:'n'}));
  const rijen=[...l.map(m=>({...m,soort:'m'})),...nieuw];
  rijen.forEach((m,i)=>{
    const d=document.createElement('div');const laatste=i===rijen.length-1&&!oude.length;
    if(m.soort==='n'){
      d.className='item nieuw-item';
      d.innerHTML='<span class="tak"></span><span class="t"></span><span class="d"></span>';
      d.querySelector('.tak').textContent=laatste?'└─':'├─';
      d.querySelector('.t').textContent='＋ '+m.naam;d.querySelector('.d').textContent='new';
      d.title='New model in the repository. Click to download.';
      d.onclick=()=>{$('hpanel').classList.remove('open');regel('＋ New model available: '+m.naam,'c-info');
        const k=regel('','l-ai');k.appendChild(downloadKaart('https://huggingface.co/'+HF_REPO+'/resolve/main/'+m.naam+'.llamafile'));inp.focus()};
      box.appendChild(d);return;
    }
    d.className='item m-item'+(m.naam===S.model?' act':'');
    d.innerHTML='<span class="tak"></span><span class="t"></span><span class="d"></span><button class="pin" title="Show in bottom bar"></button><button class="weg mdel" title="Delete this model">✕</button>';
    const pb=d.querySelector('.pin');pb.textContent=S.pins.includes(m.naam)?'★':'☆';pb.classList.toggle('aan',S.pins.includes(m.naam));
    pb.onclick=e=>{e.stopPropagation();zetPin(m.naam)};
    d.querySelector('.tak').textContent=laatste?'└─':'├─';
    const t=d.querySelector('.t');t.textContent=(m.naam===S.model?'● ':'')+m.naam.replace(/-Q\d.*$|-mxfp4$/,'');
    if(m.bron==='manual'){const g=document.createElement('span');g.className='tag';g.textContent=m.type==='gguf'?'gguf · manual':'manual';t.appendChild(g)}
    if(m.klaar){const u=document.createElement('span');u.className='klaar';u.textContent=' ⇪ ready';t.appendChild(u)}
    else if(m.update){const u=document.createElement('span');u.className='upd';u.textContent=m.bezig?' ⤓ '+m.bezig+'%':' ↑';t.appendChild(u)}
    const dd=d.querySelector('.d');dd.innerHTML='';dd.append(grootte(m.gb)+' ');
    const f=document.createElement('span');f.className='fit'+(past(m.gb)?'':' nee');f.textContent=past(m.gb)?'GPU ✓':'part CPU';dd.append(f);
    d.title=bestand(m)+' — click for details and to use this model';
    d.onclick=()=>{$('hpanel').classList.remove('open');modelInfo(m.naam);inp.focus()};
    d.querySelector('.mdel').onclick=e=>{e.stopPropagation();const t2=e.target;if(!t2.dataset.z){t2.dataset.z=1;t2.textContent='sure?';t2.style.opacity=1;setTimeout(()=>toonLijst(),2500);return}
      verwijderModel(m.naam)};
    box.appendChild(d);
  });
  if(oude.length){
    const or=document.createElement('div');or.className='map oud';
    or.innerHTML='<span class="pijl"></span><span class="naam"></span><span class="aantal"></span><button class="weg schoon" title="Delete all old versions">🗑</button>';
    or.querySelector('.pijl').textContent=S.oudOpen?'▾':'▸';or.querySelector('.naam').textContent='old/';
    or.querySelector('.aantal').textContent='('+oude.length+' · '+grootte(oudGb)+')';
    or.onclick=()=>{S.oudOpen=!S.oudOpen;bewaar();toonLijst()};
    or.querySelector('.schoon').onclick=e=>{e.stopPropagation();const t2=e.target;if(!t2.dataset.z){t2.dataset.z=1;t2.textContent='sure?';setTimeout(()=>toonLijst(),2500);return}
      const ms=laadModellen();ms.forEach(m=>m.oud=[]);schrijfModellen(ms);regel('🗑 Old model versions deleted: '+grootte(oudGb)+' freed.','l-ok');toonLijst()};
    box.appendChild(or);
    if(S.oudOpen)oude.forEach(({m,o,oi},i)=>{
      const d=document.createElement('div');d.className='item oud-item';
      d.innerHTML='<span class="tak"></span><span class="t"></span><span class="d"></span><button class="weg herstel" title="Go back to this version">⟲</button><button class="weg" title="Delete this old version">✕</button>';
      d.querySelector('.tak').textContent=i===oude.length-1?'└─':'├─';
      d.querySelector('.t').textContent=m.naam.replace(/-Q\d.*$|-mxfp4$/,'')+' ('+new Date(o.datum).toLocaleDateString(undefined,{day:'2-digit',month:'2-digit'})+')';
      d.querySelector('.d').textContent=grootte(o.gb);
      d.title='old/'+m.naam+' ('+datumTekst(o.datum)+')'+ext(m);
      d.querySelector('.herstel').onclick=e=>{e.stopPropagation();herstelOud(m.naam,oi)};
      d.querySelectorAll('.weg')[1].onclick=e=>{e.stopPropagation();const ms=laadModellen();const mm=ms.find(x=>x.naam===m.naam);mm.oud.splice(oi,1);schrijfModellen(ms);regel('🗑 Old version of '+m.naam+' deleted ('+grootte(o.gb)+').','l-sys');toonLijst()};
      box.appendChild(d);
    });
  }
}
function modelInfo(naam){
  const m=laadModellen().find(x=>x.naam===naam);if(!m)return;
  regel('◆ '+bestand(m),'c-acc');
  regel('   path:   '+S.mmap+'/'+bestand(m));
  regel('   size:   '+grootte(m.gb)+'  ·  '+(past(m.gb)?'fits fully on your GPU ('+vram()+' GB)':'does not fit fully on your GPU, part runs on the CPU (slower)'),past(m.gb)?'l-ok':'l-warn');
  regel('   type:   '+(m.type==='gguf'?'.gguf (started with the llamafile engine)':'.llamafile')+(m.bron==='manual'?'  ·  added by you (no automatic update check)':'  ·  from Hugging Face (DBash checks it for updates)'));
  regel('   start:  '+startCmd(m.naam),'l-sys');
  if((m.oud||[]).length)regel('   old:    '+m.oud.length+' older version'+(m.oud.length===1?'':'s')+' in old/ ('+grootte(m.oud.reduce((a,o)=>a+o.gb,0))+')','l-sys');
  if(m.klaar){regel('   update: ⇪ new version downloaded and tested, ready to activate','l-ok');updateKaart(m.naam)}
  else if(m.update&&!m.bezig){regel('   update: ↑ '+m.update,'l-warn');
    const k=regel('','l-ai');const c=document.createElement('span');c.className='updkaart';c.innerHTML='<span class="k">↑ UPDATE AVAILABLE</span><br><button class="ja3">⤓ UPDATE ('+grootte(m.gb)+')</button><button>LATER</button>';
    c.querySelector('.ja3').onclick=e=>{e.stopPropagation();c.querySelectorAll('button').forEach(b=>b.remove());updateModel(m.naam)};
    c.querySelectorAll('button')[1].onclick=e=>{e.stopPropagation();c.querySelectorAll('button').forEach(b=>b.remove());c.append(' later')};k.appendChild(c)}
  else if(m.bezig)regel('   update: ⤓ downloading… '+m.bezig+'%','l-tl');
  else regel('   update: '+(m.bron==='manual'?'manual model, not checked':m.gecheckt?'✓ up to date (checked '+datumTekst(m.gecheckt)+')':'not checked yet, click ⟳ at Models'),m.gecheckt?'l-ok':'l-sys');
  if(S.model!==naam)wisselModel(naam);
}
function zetModel(naam,f){const ms=laadModellen();const m=ms.find(x=>x.naam===naam);if(m){f(m);schrijfModellen(ms)}return m}
function updateModel(naam,auto=false){
  const m0=laadModellen().find(x=>x.naam===naam);if(!m0||m0.bezig)return;
  const lijn=regel('','l-tl');const duur=Math.max(2000,m0.gb*450),start=performance.now();
  regel('   (you can keep working: the new version downloads next to the old one)','l-sys');
  (function stap(){
    const p=Math.min(100,(performance.now()-start)/duur*100);
    lijn.textContent='⤓ '+(auto?'Auto-update ':'Updating ')+naam+'  '+balk(p)+'  of '+grootte(m0.gb);
    zetModel(naam,m=>m.bezig=Math.round(p));if(Math.round(p)%10===0)toonLijst();
    if(p<100){setTimeout(stap,120);return}
    zetModel(naam,m=>{m.bezig=0;m.klaar=true});
    lijn.textContent='✓ Downloaded new '+naam+'  ·  ✓ checksum OK  ·  ✓ test start OK';lijn.className='l-ok';
    toonLijst();updateKaart(naam);
  })();
}
function updateKaart(naam){
  const k=regel('','l-ai');const c=document.createElement('span');c.className='updkaart';
  c.innerHTML='<span class="k">⇪ NEW VERSION OF '+naam.toUpperCase()+' IS READY</span><br><span class="l-sys"></span><br><button class="ja3">✓ ACTIVATE NOW</button><button>LATER</button>';
  c.querySelector('.l-sys').textContent='The old version moves to old/ ('+(S.mkeep==='0'?'and is deleted':S.mkeep==='1'?'keeping 1 old version':'keeping all old versions')+'). You can always go back.';
  c.querySelector('.ja3').onclick=e=>{e.stopPropagation();c.querySelectorAll('button').forEach(b=>b.remove());activeerUpdate(naam)};
  c.querySelectorAll('button')[1].onclick=e=>{e.stopPropagation();c.querySelectorAll('button').forEach(b=>b.remove());c.append(' Later: click the model (⇪ ready) to activate it.')};
  k.appendChild(c);
}
function bewaarbeleid(m){if(S.mkeep==='0')m.oud=[];else if(S.mkeep==='1')m.oud=m.oud.slice(-1)}
function activeerUpdate(naam){
  const m=zetModel(naam,m=>{m.oud=m.oud||[];m.oud.push({datum:m.datum,gb:m.gb});bewaarbeleid(m);m.datum=Date.now();m.update=null;m.klaar=false;m.gecheckt=Date.now()});
  regel('✓ '+naam+' updated. '+(S.mkeep==='0'?'Old version deleted.':'Old version moved to '+S.mmap+'/old/.'),'l-ok');
  toonLijst();if(S.model===naam){inCache.delete(naam);wisselModel(naam)}
}
function herstelOud(naam,oi){
  const m=zetModel(naam,m=>{const o=m.oud.splice(oi,1)[0];m.oud.push({datum:m.datum,gb:m.gb});m.datum=o.datum;m.gb=o.gb;m.update='newer version available (you went back to an older one)'});
  regel('⟲ '+naam+' is back to the version from '+datumTekst(m.datum)+'. The newer one is now in old/.','l-warn');
  toonLijst();if(S.model===naam){inCache.delete(naam);wisselModel(naam)}
}
function verwijderModel(naam){
  const ms=laadModellen().filter(x=>x.naam!==naam);schrijfModellen(ms);
  regel('🗑 '+naam+' removed. [preview] The real app moves the file to the trash, so you can still restore it.','l-sys');
  if(S.model===naam&&ms.length)wisselModel(ms[0].naam);
  bouwModelWissel();toonLijst();
}
function voegModelBestandToe(file){
  const m=/\.(llamafile|gguf)$/i.exec(file.name);
  if(!m){regel('⚠ '+file.name+' is not a model. Use a .llamafile or .gguf file.','l-warn');return}
  const naam=file.name.replace(/\.(llamafile|gguf)$/i,'');const ms=laadModellen();
  if(ms.some(x=>x.naam===naam)){regel('◆ '+naam+' is already in your models.','c-acc');return}
  ms.push({naam,gb:Math.max(.1,Math.round(file.size/1e8)/10),datum:Date.now(),bron:'manual',type:m[1].toLowerCase()});
  schrijfModellen(ms);regel('＋ Model added: '+file.name+' ('+grootte(Math.max(.1,file.size/1e9))+'). [preview] In the real app you just drop the file in '+S.mmap+'.','l-ok');
  S.mOpen=true;bewaar();bouwModelWissel();toonLijst();
}
function kortNaam(n){const m=/(\d+(?:\.\d+)?)B/i.exec(n);return m?m[1]+'B':n.slice(0,6)}
function zetPin(naam){const i=S.pins.indexOf(naam);if(i>=0)S.pins.splice(i,1);else S.pins.push(naam);bewaar();bouwModelWissel();toonLijst();toonModelMenu()}
// the Model list in ⚙ → AI comes from your real models folder, like the buttons at the bottom
function vulModelKeuze(){
  const sel=$('model');if(!sel)return;const ms=laadModellen();
  sel.innerHTML='';ms.slice().sort((a,b)=>(+a.gb||0)-(+b.gb||0)).forEach(m=>{const o=document.createElement('option');o.value=m.naam;
    o.textContent=m.naam+'  ·  '+grootte(+m.gb||0)+'  ·  '+(past(+m.gb||0)?'GPU ✓':'part CPU')+(m.type==='gguf'?'  ·  gguf':'');sel.appendChild(o)});
  if(S.model&&!ms.some(m=>m.naam===S.model)){const o=document.createElement('option');o.value=S.model;o.textContent=S.model+'  (not in the folder)';sel.appendChild(o)}
  sel.value=S.model||'';
}
function bouwModelWissel(){vulModelKeuze();
  const box=$('modelwissel');if(!box)return;box.innerHTML='';
  const ms=laadModellen(),namen=ms.map(m=>m.naam);
  S.pins=(S.pins||[]).filter(n=>namen.includes(n));
  let toon=S.pins.slice();
  if(!toon.includes(S.model)&&namen.includes(S.model))toon.push(S.model);
  if(!toon.length)toon=ms.slice(0,2).map(m=>m.naam);
  toon.sort((a,b)=>(ms.find(m=>m.naam===a)||{gb:0}).gb-(ms.find(m=>m.naam===b)||{gb:0}).gb);
  toon.forEach(n=>{const b=document.createElement('button');b.textContent=kortNaam(n);b.title=n+(S.pins.includes(n)?'':' (active, not pinned)');
    b.classList.toggle('act',n===S.model);b.onclick=()=>{if(S.model!==n)wisselModel(n)};box.appendChild(b)});
  if(ms.length>toon.length||ms.length>1){const m=document.createElement('button');m.className='meer';m.textContent='▾';m.title='All models ('+ms.length+')';
    m.onclick=e=>{e.stopPropagation();$('modelmenu').classList.toggle('open');toonModelMenu()};box.appendChild(m)}
}
function toonModelMenu(){
  const mm=$('modelmenu');if(!mm.classList.contains('open'))return;mm.innerHTML='<div class="kop">MODELS IN '+S.mmap.toUpperCase()+'  ·  ★ = in bottom bar</div>';
  laadModellen().forEach(m=>{
    const r=document.createElement('div');r.className='mm'+(m.naam===S.model?' act':'');
    r.innerHTML='<button class="pin"></button><span class="n"></span><span class="g"></span>';
    const p=r.querySelector('.pin');p.textContent=S.pins.includes(m.naam)?'★':'☆';p.classList.toggle('aan',S.pins.includes(m.naam));p.title='Show in bottom bar';
    p.onclick=e=>{e.stopPropagation();zetPin(m.naam)};
    r.querySelector('.n').textContent=(m.naam===S.model?'● ':'')+m.naam;
    r.querySelector('.g').textContent=m.gb+' GB · '+(past(m.gb)?'GPU ✓':'part CPU')+(m.update?' · ↑':'');
    r.onclick=()=>{mm.classList.remove('open');if(S.model!==m.naam)wisselModel(m.naam)};
    mm.appendChild(r);
  });
}
function ghInfo(url){const m=/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/releases\/download\/([^/]+)\/([^/?#]+)/.exec(url||'');return m?{o:m[1],r:m[2],tag:decodeURIComponent(m[3]),file:decodeURIComponent(m[4])}:null}
function metTijd(pr,ms){return Promise.race([pr,new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))])}
async function haalJSON(url){const r=await metTijd(fetch(url,{headers:{Accept:'application/json'}}),8000);if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}
async function modelUpdates(ms){
  let gevonden=0,gecheckt=0,fouten=0;
  if(S.mupd!=='off')try{
    const repo=await haalJSON('https://huggingface.co/api/models/'+HF_REPO);
    const gewijzigd=new Date(repo.lastModified||0).getTime();
    const bestanden=(repo.siblings||[]).map(x=>x.rfilename).filter(n=>n.endsWith('.llamafile')).map(n=>n.replace(/\.llamafile$/,''));
    ms.forEach(m=>{m.gecheckt=Date.now();
      if(m.bron==='manual'||m.klaar){if(m.bron==='manual')m.update=null;return}
      if(!bestanden.includes(m.naam))m.update='no longer in the repository (a newer version may have replaced it)';
      else if(gewijzigd>m.datum)m.update='repository updated on '+datumTekst(gewijzigd)+' (after your download)';
      else m.update=null;
      if(m.update)gevonden++;});
    gecheckt+=ms.filter(m=>m.bron!=='manual').length;
    nieuweModellen=bestanden.filter(n=>!ms.some(m=>m.naam===n)).slice(0,4).map(n=>({naam:n,gb:'?'}));
  }catch(e){fouten++}
  return{gevonden,gecheckt,fouten};
}
async function checkUpdates(stil){
  if(bezigMetCheck)return;bezigMetCheck=true;toonLijst();
  if(!stil)regel('⟳ Checking models and downloads for updates…','c-info');
  let gevonden=0,fouten=0,gecheckt=0;
  // downloads: GitHub releases
  const dls=laadDownloads();
  for(const dl of dls){
    const gh=dl.gh||ghInfo(dl.url);if(!gh)continue;dl.gh=gh;
    try{
      const rel=await haalJSON('https://api.github.com/repos/'+gh.o+'/'+gh.r+'/releases/latest');gecheckt++;dl.gecheckt=Date.now();
      if(rel.tag_name&&rel.tag_name!==gh.tag){
        const zonder=x=>x.replace(/[\d.]+/g,'#');const assets=rel.assets||[];
        const ext=(gh.file.match(/\.(tar\.\w+|\w+)$/)||[''])[0];
        const a=assets.find(x=>zonder(x.name)===zonder(gh.file))||assets.find(x=>ext&&x.name.endsWith(ext))||assets[0];
        dl.update={tag:rel.tag_name,url:a?a.browser_download_url:rel.html_url};gevonden++;
      }else dl.update=null;
    }catch(e){fouten++}
  }
  schrijfDownloads(dls);
  // models: the preview simulates this; in the app real.js checks the real file on Hugging Face
  const ms=laadModellen();const r=await modelUpdates(ms);gevonden+=r.gevonden;gecheckt+=r.gecheckt;fouten+=r.fouten;
  schrijfModellen(ms);
  bezigMetCheck=false;toonLijst();bouwModelWissel();
  if(S.mupd==='auto')laadModellen().filter(m=>m.update&&!m.klaar&&!m.bezig&&m.bron!=='manual'&&!/no longer/.test(m.update)).forEach(m=>updateModel(m.naam,true));
  if(!stil||gevonden){
    if(gevonden){const ms2=laadModellen().filter(m=>m.update),ds=laadDownloads().filter(d=>d.update);
      ms2.forEach(m=>regel('↑ Model update: '+m.naam+' · '+m.update+'. Type  models  or click it in 💬 → Models.','l-warn'));
      ds.forEach(d=>regel('↑ Download update: '+(d.bestand||d.naam||d.url)+' · '+d.update.tag,'l-warn'))}
    else if(gecheckt)regel('✓ Everything is up to date ('+gecheckt+' checked).','l-ok');
    else if(!fouten)regel('✓ Nothing to check: no models from Hugging Face and no downloads with a GitHub release.','l-ok');
    if(fouten&&!stil)regel('   '+fouten+' check'+(fouten===1?'':'s')+' failed (no internet here?). The real app retries automatically.','l-sys');
    if(nieuweModellen.length&&!stil)regel('＋ '+nieuweModellen.length+' new model'+(nieuweModellen.length===1?'':'s')+' in the llamafile repository.','c-info');
  }
}
function zoekGesprekken(q){q=(q||'').toLowerCase().trim();if(!q)return laadLijst();
  return laadLijst().filter(g=>(g.titel||'').toLowerCase().includes(q)||(g.map||'').toLowerCase().includes(q)||(g.berichten||[]).some(m=>(m.content||'').toLowerCase().includes(q)))}
const LOSICO='<svg width="14" height="12" viewBox="0 0 7 6" shape-rendering="crispEdges" fill="currentColor"><path d="M0 0h3v1H0zM0 1h7v1H0zM0 2h1v4H0zM6 2h1v4H6zM1 5h5v1H1z"/></svg>';
function toonLijst(){
  const zq=($('zoekchat')&&$('zoekchat').value.trim())||'';
  const l=zoekGesprekken(zq),mappen=laadMappen(),box=$('lijst');box.innerHTML='';
  const namen=mappen.map(m=>m.naam);
  if(zq&&!l.length){const x=document.createElement('div');x.className='leeg in';x.textContent='No conversations match "'+zq+'".';box.appendChild(x)}
  mappen.forEach((m,mi)=>{
    const kids=l.filter(g=>g.map===m.naam);
    if(zq&&!kids.length)return;
    const r=document.createElement('div');r.className='map';
    r.innerHTML='<span class="pijl"></span><span class="mapico">'+MAPICO+'</span><span class="naam"></span><span class="aantal"></span>'+
      '<button class="weg plus" title="New chat in this folder">+</button><button class="weg del" title="Delete folder">✕</button>';
    r.querySelector('.pijl').textContent=m.open?'▾':'▸';
    r.querySelector('.naam').textContent=m.naam;r.querySelector('.naam').title='Double-click to rename';
    r.querySelector('.aantal').textContent='('+kids.length+')';
    r.onclick=()=>{m.open=!m.open;schrijfMappen(mappen);toonLijst()};
    r.querySelector('.naam').ondblclick=e=>{e.stopPropagation();bewerk(e.target,m.naam,v=>{
      if(namen.includes(v))return toonLijst();
      const oud=m.naam;m.naam=v;schrijfMappen(mappen);
      const ll=laadLijst();ll.forEach(g=>{if(g.map===oud)g.map=v});schrijfLijst(ll);toonLijst();})};
    r.querySelector('.plus').onclick=e=>{e.stopPropagation();wisScherm();nieuwGesprek(m.naam);$('hpanel').classList.remove('open');inp.focus()};
    r.querySelector('.del').onclick=e=>{e.stopPropagation();
      if(!r.dataset.zeker){r.dataset.zeker=1;e.target.textContent='sure?';setTimeout(()=>toonLijst(),2500);return}
      mappen.splice(mi,1);schrijfMappen(mappen);
      const ll=laadLijst();ll.forEach(g=>{if(g.map===m.naam)g.map=''});schrijfLijst(ll);toonLijst();};
    maakDropDoel(r,m.naam);
    box.appendChild(r);
    if(m.open||zq){
      if(!kids.length){const x=document.createElement('div');x.className='leeg in';x.textContent='└─ (empty, drag a chat here)';box.appendChild(x)}
      kids.forEach((g,i)=>box.appendChild(maakItem(g,i===kids.length-1,mappen)));
    }
  });
  const los=l.filter(g=>!g.map||!namen.includes(g.map));
  const kop=document.createElement('div');kop.className='map los';
  kop.innerHTML='<span class="pijl"> </span><span class="naam">Loose chats</span><span class="aantal">('+los.length+')</span>';
  maakDropDoel(kop,'');box.appendChild(kop);
  if(!los.length&&!l.length){const x=document.createElement('div');x.className='leeg in';x.textContent='No conversations yet. Just type a question in the terminal.';box.appendChild(x)}
  los.forEach((g,i)=>box.appendChild(maakItem(g,i===los.length-1,mappen)));
  const lib=$('lib');lib.innerHTML='';
  const sep=document.createElement('div');sep.className='scheiding';sep.textContent='LIBRARY';lib.appendChild(sep);
  toonDownloadSectie(lib,zq);
  toonModelSectie(lib,zq);
  if(window.LOGKLAAR)toonLogSectie(lib,zq);
  // same layout for every folder row: name | count | actions (fixed width) so everything lines up
  [...box.querySelectorAll('.map'),...lib.querySelectorAll('.map')].forEach(r=>{
    const a=document.createElement('span');a.className='acties';
    r.querySelectorAll(':scope > .weg').forEach(b=>a.appendChild(b));
    r.appendChild(a);
    if(!r.querySelector('.mapico')){const ic=document.createElement('span');ic.className='mapico';ic.innerHTML=LOSICO;r.insertBefore(ic,r.querySelector('.naam'))}
  });
}
const MAPICO='<svg width="14" height="12" viewBox="0 0 7 6" shape-rendering="crispEdges" fill="currentColor"><path d="M0 0h3v1H0zM0 1h7v5H0z"/></svg>';
$('zoekchat').addEventListener('input',()=>toonLijst());
$('modelbestand').onchange=e=>{[...e.target.files].forEach(voegModelBestandToe);e.target.value=''};
(function(){const lib=$('lib');
  lib.addEventListener('dragover',e=>{if([...e.dataTransfer.types].includes('Files')){e.preventDefault();lib.classList.add('dropdoel')}});
  lib.addEventListener('dragleave',()=>lib.classList.remove('dropdoel'));
  lib.addEventListener('drop',e=>{if(!e.dataTransfer.files.length)return;e.preventDefault();lib.classList.remove('dropdoel');[...e.dataTransfer.files].forEach(voegModelBestandToe)});})();
$('zoekchat').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){$('zoekchat').value='';toonLijst()}});
$('g-map').onclick=()=>{
  if($('nieuwemap'))return $('nieuwemap').focus();
  const i=document.createElement('input');i.id='nieuwemap';i.className='bewerk';i.placeholder='Folder name + Enter';
  i.style.width='100%';i.style.marginTop='6px';$('g-map').parentNode.after(i);i.focus();
  let gedaan=false;
  const klaar=(bewaar=true)=>{if(gedaan)return;gedaan=true;const v=i.value.trim();i.onblur=null;i.remove();
    if(!bewaar||!v)return;const m=laadMappen();
    if(!m.some(x=>x.naam===v)){m.push({naam:v,open:true});schrijfMappen(m)}toonLijst()};
  i.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')klaar();if(e.key==='Escape')klaar(false)};
  i.onblur=klaar;
};
function wisScherm(){[...out.children].forEach(c=>{if(c!==invoerRij)c.remove()})}
function openGesprek(id){
  const g=laadLijst().find(x=>x.id===id);if(!g)return;
  wisScherm();gesprek=g.berichten.slice();huidigId=id;zetWeb(g.web);if(g.rol&&ROLLEN[g.rol]&&g.rol!==S.rol){zetRol(g.rol,true);regel('🎓 This chat uses the '+ROLLEN[g.rol].titel+' role.','l-tl')}
  regel('*** Conversation from '+datumTekst(g.datum)+' ***');
  if(gesprek.some(m=>m.samengevat))regel('   (the AI keeps a summary of the oldest '+gesprek.filter(m=>m.samengevat).length+' messages)','l-sys');
  laatsteGebruik=0;toonGeheugen(geheugenSchat());
  gesprek.forEach(m=>{
    if(m.samenvatting)return;
    if(m.role==='user'){promptRegel(m.content);if(m.web&&m.web.length){regel('[web] DuckDuckGo results:','zoek');toonBronnen(m.web)}}
    else opmaak(regel('','l-ai'),m.content,{web:!!m.web,oud:true});
  });
  $('hpanel').classList.remove('open');toonLijst();inp.focus();
}
function nieuwGesprek(map=''){gesprek=[];huidigId=null;laatsteGebruik=0;setTimeout(()=>toonGeheugen(geheugenSchat()));nieuweMap=map;zetWeb(false);regel('New conversation started'+(map?' in folder "'+map+'"':'')+'.');toonLijst()}
$('g-nieuw').onclick=()=>{wisScherm();nieuwGesprek();$('hpanel').classList.remove('open');inp.focus()};
$('g-export').onclick=()=>{
  if(!gesprek.length){regel('No conversation to export.');return}
  const txt=gesprek.map(m=>(m.role==='user'?'YOU: ':'AI:  ')+m.content).join('\n\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain'}));
  a.download='dbash-chat-'+new Date().toISOString().slice(0,10)+'.txt';a.click();
};
let wisZeker=false;
$('g-wis').onclick=()=>{
  if(!wisZeker){wisZeker=true;$('g-wis').textContent='SURE? CLICK AGAIN';setTimeout(()=>{wisZeker=false;$('g-wis').textContent='✕ CLEAR ALL'},3000);return}
  (async()=>{if(window.verwijderSnapshot){for(const g of laadLijst().filter(x=>x.snapshot)){await verwijderSnapshot(g)}}
  schrijfLijst([]);huidigId=null;wisZeker=false;$('g-wis').textContent='✕ CLEAR ALL';toonLijst()})();
};
toonLijst();
