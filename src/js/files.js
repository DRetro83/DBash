/* DBash · files.js: file cards: the AI proposes a whole file, you see the difference and say y/n. Part of the shared app logic (see js/README.md). */
/* ---------- file cards: the AI proposes a whole file, you see the difference ---------- */
function diffRegels(a,b){
  const n=a.length,m=b.length;
  if(n*m>4e6){return[...a.map((x,i)=>({t:'-',o:i+1,x})),...b.map((x,j)=>({t:'+',n:j+1,x}))]}
  const L=Array.from({length:n+1},()=>new Uint32Array(m+1));
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)L[i][j]=a[i]===b[j]?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
  const r=[];let i=0,j=0;
  while(i<n&&j<m){if(a[i]===b[j]){r.push({t:' ',o:i+1,n:j+1,x:a[i]});i++;j++}else if(L[i+1][j]>=L[i][j+1]){r.push({t:'-',o:i+1,x:a[i]});i++}else{r.push({t:'+',n:j+1,x:b[j]});j++}}
  while(i<n){r.push({t:'-',o:i+1,x:a[i]});i++}while(j<m){r.push({t:'+',n:j+1,x:b[j]});j++}
  return r;
}
function regelsVan(t){t=String(t||'').replace(/\r\n/g,'\n');if(t.endsWith('\n'))t=t.slice(0,-1);return t===''?[]:t.split('\n')}
function woordMarkeer(el,x,y){ // highlight only the part of x that differs from y
  let p=0;while(p<x.length&&p<y.length&&x[p]===y[p])p++;
  let s=0;while(s<x.length-p&&s<y.length-p&&x[x.length-1-s]===y[y.length-1-s])s++;
  el.append(x.slice(0,p));const w=document.createElement('span');w.className='dw';w.textContent=x.slice(p,x.length-s);el.append(w,x.slice(x.length-s));
}
function toonDiff(box,oudT,nieuwT){
  const d=diffRegels(regelsVan(oudT),regelsVan(nieuwT));box.innerHTML='';
  const toon=d.map((r,i)=>r.t!==' '||d.slice(Math.max(0,i-2),i+3).some(x=>x.t!==' '));
  let gat=false;
  d.forEach((r,i)=>{
    if(!toon[i]){if(!gat){gat=true;const g=document.createElement('span');g.className='dr d-gap';g.textContent='   ⋯';box.appendChild(g)}return}gat=false;
    const row=document.createElement('span');row.className='dr '+(r.t==='-'?'d-del':r.t==='+'?'d-add':'d-ctx');
    const nr=document.createElement('span');nr.className='dn';nr.textContent=r.t==='+'?r.n:r.o;
    const tk=document.createElement('span');tk.className='dt';tk.textContent=r.t;row.append(nr,tk);
    const paar=r.t==='-'?d.slice(i+1).find(x=>x.t!=='-'):r.t==='+'?d.slice(0,i).reverse().find(x=>x.t!=='+'):null;
    if(paar&&paar.t!==' '&&paar.x!==undefined)woordMarkeer(row,r.x,paar.x);else row.append(r.x);
    box.appendChild(row);
  });
  return{plus:d.filter(x=>x.t==='+').length,min:d.filter(x=>x.t==='-').length,oud:regelsVan(oudT).length,tekst:d.filter((r,i)=>toon[i]).map(r=>r.t+' '+r.x).join('\n')};
}
const DEMO_BESTANDEN={'/etc/fstab':'# /etc/fstab: static file system information.\nUUID=1b2c-root  /          ext4  errors=remount-ro  0 1\nUUID=7A3F-EFI   /boot/efi  vfat  umask=0077         0 1\nUUID=data-4tb   /data      ext4  defaults           0 2\nUUID=swap-01    none       swap  sw                 0 0\n'};
window.leesBestand=window.leesBestand||(async p=>DEMO_BESTANDEN[p]!==undefined?{bestaat:true,inhoud:DEMO_BESTANDEN[p],sudo:p.startsWith('/etc')}:{bestaat:false,inhoud:'',sudo:p.startsWith('/etc')});
window.schrijfBestand=window.schrijfBestand||(async(p,t,info)=>{DEMO_BESTANDEN[p]=t;return{ok:true,backup:info.bestaat?p+'.dbash-bak':null,demo:true}});
window.herstelBestand=window.herstelBestand||(async(p,info)=>({ok:true}));
window.bewerkInNano=window.bewerkInNano||null;
function spiekKaart(tekst,opts){
  const rijen=tekst.split('\n').map(l=>l.trim().replace(/^[-*•]\s+/,'').replace(/`/g,'')).filter(Boolean).map(l=>{const m=/^(.+?)\s+(—|–|-{1,2}|:)\s+(.+)$/.exec(l);return m?{c:m[1].trim(),d:m[3].trim()}:null}).filter(Boolean);
  const les=S.les&&S.les.nu?S.les.nu:0,titel=les?'Lesson '+les+' · '+LESSEN[les-1][0]:'Cheat sheet';
  const k=document.createElement('span');k.className='spiek';
  const h=document.createElement('div');h.className='sk';h.textContent='📖 CHEAT SHEET · '+titel;k.appendChild(h);
  rijen.forEach(r=>{const d=document.createElement('div');d.className='sr';const c=document.createElement('code');c.textContent=r.c;const t=document.createElement('span');t.textContent=r.d;d.append(c,t);k.appendChild(d)});
  const v=document.createElement('div');v.className='sv';k.appendChild(v);
  if(opts&&opts.oud){v.textContent='(from an earlier chat)';return k}
  // into the command book (your OS → "Learned"), and the lesson is done
  const bb=laadBoek(),os=mijnOS()||(bb[0]&&bb[0].os);const o=bb.find(x=>x.os===os);let nieuw=0;
  if(o&&rijen.length){const naam='Learned'+(les?' · L'+les:'');let cat=o.cats.find(x=>x.naam===naam);if(!cat){cat={naam,cmds:[]};o.cats.push(cat)}
    rijen.forEach(r=>{if(!cat.cmds.some(x=>x.c===r.c)){cat.cmds.push({c:r.c,d:r.d,eigen:true});nieuw++}});schrijfBoek(bb)}
  if(les&&!S.les.klaar.includes(les)){S.les.klaar.push(les);bewaar();toonRollen()}
  rijen.forEach(r=>leerKennis(r.c,true));
  v.textContent='✓ '+nieuw+' added to your 📖 command book ('+os+' › Learned'+(les?' · L'+les:'')+')'+(les?' · lesson '+les+' done ✓':'');
  return k;
}
function bestandKaart(pad,nieuw,web){
  const k=document.createElement('span');k.className='bkaart';k.dataset.pad=pad;
  const kop=document.createElement('div');kop.className='bkop';kop.textContent='✎ '+pad;
  const sub=document.createElement('div');sub.className='bsub';sub.textContent='reading the current file…';
  const dbox=document.createElement('span');dbox.className='diff';dbox.style.display='block';
  const w=document.createElement('div');w.className='bwaarsch';w.style.display='none';
  const knp=document.createElement('div');knp.className='bknp';
  k.append(kop,sub,dbox,w,knp);
  k.inhoud=nieuw.endsWith('\n')?nieuw:nieuw+'\n';k.web=web;
  k.klaar=(async()=>{
    let info;try{info=await leesBestand(pad)}catch(e){info={fout:String(e)}}
    if(!info||info.fout){sub.textContent='✗ could not read the file: '+(info&&info.fout||'?');k.info=null;return}
    k.info=info;tekenKaart(k);
  })();
  return k;
}
function tekenKaart(k){
  const info=k.info,sub=k.querySelector('.bsub'),dbox=k.querySelector('.diff'),w=k.querySelector('.bwaarsch'),knp=k.querySelector('.bknp');
  const st=toonDiff(dbox,info.inhoud,k.inhoud);k.stat=st;
  sub.textContent=(info.bestaat?(st.plus||st.min?st.plus+' added · '+st.min+' removed':'no changes'):'new file · '+st.plus+' lines')+(info.sudo?' · needs sudo':'')+(info.bestaat?' · backup first: '+k.dataset.pad+'.dbash-bak':'')+(k.web?' · from a web answer':'');
  if(info.bestaat&&st.min>3&&st.min>st.oud*0.3){w.style.display='';w.textContent='⚠ This removes '+st.min+' of '+st.oud+' lines. Check that the AI did not leave out part of the file.'}else w.style.display='none';
  knp.innerHTML='';if(k.gedaan)return;
  const b=(t,f,c)=>{const x=document.createElement('button');x.textContent=t;if(c)x.className=c;x.onclick=e=>{e.stopPropagation();f()};knp.appendChild(x)};
  if(!st.plus&&!st.min&&info.bestaat){knp.textContent='Nothing to change.';return}
  b('✓ WRITE',()=>schrijfKaart(k),'bja');b('VIEW WHOLE FILE',()=>toonHeel(k));if(window.bewerkInNano)b('✎ EDIT IN NANO',()=>bewerkKaart(k));b('CANCEL',()=>{k.gedaan=true;knp.textContent='✕ not written'});
}
function toonHeel(k){
  const r=regelsVan(k.inhoud);const d=regel('','uitvouw open');
  const kop=document.createElement('div');kop.className='ukop';kop.textContent='▾ '+k.dataset.pad+' after the change · '+r.length+' lines';
  const vol=document.createElement('div');vol.className='uvol';vol.textContent=r.map((x,i)=>String(i+1).padStart(4)+'  '+x).join('\n');
  kop.onclick=()=>d.classList.toggle('open');d.append(kop,vol);
}
async function bewerkKaart(k){
  if(!window.bewerkInNano){regel('Editing in nano works in the DBash app.','l-sys');return}
  const nieuw=await bewerkInNano(k.dataset.pad,k.inhoud);if(nieuw===null)return;
  k.inhoud=nieuw.endsWith('\n')?nieuw:nieuw+'\n';tekenKaart(k);regel('✎ Your edit is in the card. Check the red and green lines again.','l-tl');
  return true;
}
async function schrijfKaart(k){
  if(k.gedaan||!k.info)return false;k.gedaan=true;const knp=k.querySelector('.bknp');knp.textContent='writing…';
  const pad=k.dataset.pad,info=k.info;let r;
  try{r=await schrijfBestand(pad,k.inhoud,info)}catch(e){r={ok:false,fout:String(e)}}
  if(!r||!r.ok){knp.textContent='✗ not written: '+((r&&r.fout)||'cancelled');k.gedaan=false;tekenKaart(k);return false}
  knp.textContent='';
  const lijn=regel('✓ '+pad+' saved · '+k.stat.plus+' added, '+k.stat.min+' removed'+(r.backup?' · backup: '+r.backup:' · new file')+(r.demo?'  [preview]':''),'l-ok');
  const u=document.createElement('button');u.className='sudoopnieuw';u.textContent='⟲ UNDO';u.style.marginLeft='10px';
  u.onclick=async e=>{e.stopPropagation();u.remove();const h=await herstelBestand(pad,{bestond:info.bestaat,backup:r.backup});
    regel(h&&h.ok?'⟲ '+pad+' is back to how it was'+(info.bestaat?'':' (the new file was removed)')+'.':'✗ Undo failed: '+((h&&h.fout)||'?'),h&&h.ok?'l-ok':'l-err');
    logToevoegen({c:'⟲ undo '+pad,r:info.sudo?'sudo':'safe',ok:!!(h&&h.ok),gesprek:huidigId,uit:''})};
  lijn.appendChild(u);
  logToevoegen({c:'✎ '+pad,r:info.sudo?'sudo':'safe',ok:true,gesprek:huidigId,uit:(r.backup?'backup '+r.backup+'\n':'new file\n')+k.stat.tekst.slice(0,380)});
  bewaarUitvoer('(DBash wrote the file '+pad+')',{ok:true,out:'Saved. Changes (- removed, + added):\n'+k.stat.tekst});
  return true;
}
function tekstMetTabellen(el,t){
  const r=t.split('\n');let buf=[];
  const isRij=x=>/^\s*\|.*\|\s*$/.test(x),isScheid=x=>/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(x);
  const cellen=x=>x.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(c=>c.trim());
  for(let i=0;i<r.length;i++){
    if(isRij(r[i])&&i+1<r.length&&isScheid(r[i+1])){
      if(buf.length){tekstMetLinks(el,buf.join('\n')+'\n');buf=[]}
      const w=document.createElement('span');w.className='mdtab';const tb=document.createElement('table');
      const kop=document.createElement('tr');cellen(r[i]).forEach(c=>{const th=document.createElement('th');tekstMetLinks(th,c);kop.appendChild(th)});tb.appendChild(kop);
      i+=2;while(i<r.length&&isRij(r[i])){const tr=document.createElement('tr');cellen(r[i]).forEach(c=>{const td=document.createElement('td');tekstMetLinks(td,c);tr.appendChild(td)});tb.appendChild(tr);i++}
      i--;w.appendChild(tb);el.appendChild(w);
    }else buf.push(r[i]);
  }
  if(buf.length)tekstMetLinks(el,buf.join('\n'));
}
function openInBrowser(url){
  const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove();
  regel('↗ Opened in your browser: '+url,'l-ok');
}
