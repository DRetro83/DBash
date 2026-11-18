/* ---------- preview mode (a normal browser, no DBash app): simulated backups and demo answers ---------- */
if(!window.__TAURI__){
/* ---------- phone preview: ⟲ BACKUP box (simulated Timeshift) ---------- */
(function(){
  S.wizardKlaar=true;bewaar();$('wizard').classList.remove('open');
  let BK=null;try{BK=JSON.parse(opslag.get('dbash-demo-backup')||'null')}catch(e){}
  const bewaarBk=()=>opslag.set('dbash-demo-backup',JSON.stringify(BK));
  const wacht=ms=>new Promise(r=>setTimeout(r,ms));
  const naamNu=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'_'+p(d.getHours())+'-'+p(d.getMinutes())+'-'+p(d.getSeconds())};
  function sudoDemo(){return new Promise(res=>{
    const r=regel('','l-me');r.innerHTML='<span class="c-warn">[sudo] password for you: </span>';
    const v=document.createElement('input');v.type='password';v.className='pwveld';v.style.cssText='background:none;border:0;outline:0;color:var(--fg);font:inherit;width:12em';
    r.appendChild(v);setTimeout(()=>v.focus(),30);
    v.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter'){v.remove();r.append('••••••');res(true)}if(e.key==='Escape'){v.remove();r.append('^C');res(false)}};
    const ok=document.createElement('button');ok.textContent='OK';ok.className='openknop';ok.style.marginLeft='6px';ok.onclick=()=>{ok.remove();v.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}))};r.appendChild(ok);
  })}
  let sudoTot=0;
  async function sudo(){if(Date.now()<sudoTot){sudoTot=Date.now()+9e5;return true}const ok=await sudoDemo();if(ok)sudoTot=Date.now()+9e5;return ok}
  async function maak(){
    if(BK)return true;zet('making');
    if(!await sudo()){regel('✕ Backup cancelled.','l-sys');zet();return false}
    const l=regel('','l-tl');const t0=Date.now();
    for(let i=0;i<=24;i++){const s=(Date.now()-t0)/1000;l.textContent='⟲ Making a backup (Timeshift, rsync)…  '+s.toFixed(0)+' s';$('bkinfo').textContent=' '+s.toFixed(0)+' s';await wacht(100)}
    BK={naam:naamNu(),datum:Date.now()};bewaarBk();
    l.textContent='✓ Backup '+BK.naam+' made. Do your thing. Everything OK? Untick ⟲ BACKUP to delete it. Not OK? ⟲ ROLL BACK.';l.className='l-ok';
    regel('[preview] The real app runs: sudo timeshift --create --scripted --rsync','l-sys');
    zet();return true;
  }
  async function verwijder(){
    if(!await sudo()){regel('✕ Backup kept (cancelled).','l-sys');zet();return}
    const l=regel('⟲ Deleting backup '+BK.naam+'…','l-sys');await wacht(700);
    l.textContent='✓ Backup '+BK.naam+' deleted. Your changes stay.';l.className='l-ok';BK=null;bewaarBk();zet();
  }
  function kaart(tekst,knoppen,kleur){
    const k=regel('','l-ai');const c=document.createElement('span');c.className='gevaar';c.style.whiteSpace='pre-wrap';
    if(kleur){c.style.borderColor='var(--info)';c.style.color='var(--fg)'}c.textContent=tekst;c.append(document.createElement('br'));
    const weg=()=>c.querySelectorAll('button').forEach(x=>x.remove());
    knoppen.forEach(([t,f,cls,stijl])=>{const b=document.createElement('button');b.textContent=t;if(cls)b.className=cls;if(stijl)b.style.cssText=stijl;b.onclick=e=>{e.stopPropagation();if(f(b,weg,c)!==false)weg()};c.append(b)});
    k.appendChild(c);out.scrollTop=1e9;return c;
  }
  function terug(){
    const b=BK;
    kaart('⟲ ROLL BACK to backup '+b.naam+' ('+datumTekst(b.datum)+')?\nYour system files go back to how they were then; everything changed since is undone. Your personal files in /home are not touched.\nTimeshift restarts your PC when it is done.',[
      ['⟲ ROLL BACK + RESTART',(btn)=>{if(!btn.dataset.z){btn.dataset.z=1;btn.textContent='SURE? PRESS AGAIN';return false}
        (async()=>{if(!await sudo()){regel('✕ Roll back cancelled.','l-sys');return}const l=regel('⟲ Rolling back to '+b.naam+'… do not turn off your PC.','l-warn');await wacht(1500);
          l.textContent='✓ Roll back done. [preview] The real app restarts your PC now.';l.className='l-ok';BK=null;bewaarBk();zet()})()},'ja2'],
      ['CANCEL',(b2,w,c)=>{c.append('\n✕ cancelled')}]]);
  }
  function uitvink(){
    kaart('⟲ Is everything OK?\nBackup '+BK.naam+' ('+datumTekst(BK.datum)+') will be deleted and your changes stay.',[
      ['✓ ALL GOOD, DELETE BACKUP',()=>{verwijder()},'ja2','background:var(--ok);border-color:var(--ok)'],
      ['⟲ ROLL BACK INSTEAD',()=>{terug()}],
      ['KEEP BACKUP',(b,w,c)=>{c.append('\n✓ Backup kept.')}]],true);
  }
  function zet(stand){
    const v=$('bk');v.checked=!!BK||stand==='making';v.disabled=stand==='making';
    $('bklabel').classList.toggle('aan',!!BK);
    $('bkinfo').textContent=stand==='making'?' …':BK?' '+new Date(BK.datum).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}):'';
    $('bkterug').style.display=BK?'':'none';
  }
  // footer
  const rb=$('bkterug');
  $('bk').addEventListener('change',()=>{if($('bk').checked)maak();else{$('bk').checked=true;uitvink()}});
  rb.onclick=e=>{e.stopPropagation();if(BK)terug()};
  const st=document.createElement('style');
  st.textContent='@media(max-width:700px){.voet{gap:8px;padding:0 8px;overflow-x:auto}.tl-knop{padding:2px 6px}.gevaar button{padding:6px 10px;margin-top:8px}#out{font-size:15px}}';
  document.head.appendChild(st);zet();
  // settings text
  const ta=$('ts_aan');if(ta){const ch=ta.closest('.chk');const info=ch.nextElementSibling;ch.remove();
    info.innerHTML='Use the <b>⟲ BACKUP</b> box at the bottom, like the WEB box: tick it before you change something = DBash makes a Timeshift backup. Everything OK? Untick it = the backup is deleted. Not OK? ⟲ ROLL BACK. Your files in /home are never touched.'}
  $('ts_status').textContent='[preview] Timeshift is simulated on this page.';
  // commands: no automatic restore points anymore, confirmation offers BACKUP FIRST
  window.voerUit=function(c,bevestigd,echtOk){
    if(!c)return;{const ex=expandAlias(c);if(ex&&ex.cmd!==c){regel('⚡ '+ex.a.n+' → '+ex.cmd,'l-tl');c=ex.cmd}}
    {const ph=plekhouder(c);if(ph){inp.value='!'+c;inp.focus();inp.setSelectionRange(ph[0]+1,ph[1]+1);regel('✎ Fill in the selected part first. The command is in the prompt for you.','l-warn');return null}}
    {const zp=c.replace(/\s*\|\s*(less|more)\s*$/,'');if(zp!==c){regel('   (removed the pager: DBash shows long output in a fold)','l-sys');c=zp}}
    const r=risico(c);
    if(r!=='safe'&&!echtOk){
      kaart((r==='danger'?'⚠ DANGER: "'+c+'" can destroy data or break your system.':'⚠ "'+c+'" changes your system.')+
        (BK?'\n⟲ Backup active since '+datumTekst(BK.datum)+': you can roll back.':'\nNo backup active, so this cannot be undone automatically. Tick ⟲ BACKUP below first, or use the button.'),[
        ...(BK?[]:[['⟲ BACKUP FIRST, THEN RUN',()=>{(async()=>{if(await maak())voerUit(c,true,true)})()}]]),
        ['▶ RUN',()=>{voerUit(c,true,true)},'ja2'],['CANCEL',(b,w,k)=>{k.append('  ✕ cancelled')}]]);return {wacht:true};
    }
    regel('▶ '+c+'   ['+RISICO_NAAM[r]+(r==='safe'?' · read-only':BK?' · backup '+BK.naam+' active':' · no backup')+']',r==='safe'?'l-ok':r==='danger'?'l-err':'l-warn');
    const res=simuleer(c.replace(/^sudo apt(-get)? (install|upgrade|update)/,'sudo apt $2'));toonUitvoer(c,res);
    logToevoegen({c,r,ok:res.ok,punt:BK?BK.naam:null,gesprek:huidigId,uit:(res.out||'').slice(0,400)});
    return res;
  };
  window.DEMO_AI=true;
  {const echt=window.hfJSON;const VB={'gemma':[{id:'unsloth/gemma-4-26B-A4B-it-GGUF',downloads:812345,gated:false},{id:'bartowski/google_gemma-4-26B-A4B-it-GGUF',downloads:401223,gated:false},{id:'google/gemma-4-26b-a4b-it-qat-q4_0-gguf',downloads:350002,gated:'auto'}]};
   const BOOM=[{type:'file',path:'gemma-4-26B-A4B-it-Q8_0.gguf',lfs:{size:27.4e9}},{type:'file',path:'gemma-4-26B-A4B-it-Q5_K_M.gguf',lfs:{size:18.9e9}},{type:'file',path:'gemma-4-26B-A4B-it-Q4_K_M.gguf',lfs:{size:16.1e9}},{type:'file',path:'gemma-4-26B-A4B-it-IQ4_XS.gguf',lfs:{size:13.9e9}},{type:'file',path:'mmproj-F16.gguf',lfs:{size:1.1e9}}];
   window.hfJSON=async u=>{try{return await echt(u)}catch(e){if(/api\/models\/[^?]+\/tree/.test(u))return BOOM;if(/api\/models/.test(u))return VB.gemma;if(/github/.test(u))return{tag_name:'0.10.6',assets:[{name:'llamafile-0.10.6',size:62e6,browser_download_url:'#'}]};throw e}};
   window.downloadModel=(url,naam,onp)=>{let stop=false;const tot=naam==='llamafile'?62e6:13.9e9;return{stop:()=>{stop=true},klaar:new Promise((ok,nee)=>{let d=0;const t=setInterval(()=>{if(stop){clearInterval(t);nee(new Error('stopped (run it again to continue)'));return}d=Math.min(tot,d+tot/25);onp(d,tot);if(d>=tot){clearInterval(t);ok('~/DBash/Models/'+naam+'  [preview]')}},120)})}};
   window.engineInfo=async()=>({heeft:false,versie:null});}
  window.demoUitleg=(c,ok)=>/^pwd/.test(c)?'pwd = print working directory: it shows the folder you are in, here your home folder /home/you.':/^ls/.test(c)?'ls lists what is in the current folder; folders are shown in blue.':/^df/.test(c)?'df -h shows how full your disks are; -h means sizes in GB and MB.':/apt search/.test(c)?'apt search looks for packages by name and description; each result shows the package name and version.':ok?'That command worked; the lines above are what it printed.':'That command failed: read the last line of the error, it says why.';
  {const o2=window.simuleer;window.simuleer=c=>/^pwd\b/.test(c)?{ok:true,out:'/home/you'}:/^sudo apt instal\s/.test(c)?{ok:false,out:'E: Invalid operation instal'}:/^apt search vlc/.test(c)?{ok:true,out:'vlc/stable 3.0.21 amd64\n  multimedia player and streamer\nvlc-bin/stable 3.0.21 amd64\n  binaries from VLC'}:o2(c)}
  window.heeftBackup=()=>!!BK;window.maakBackupNu=()=>maak();
  window.toonPunten=function(){regel(BK?'⟲ Backup '+BK.naam+' made '+datumTekst(BK.datum)+'. Untick ⟲ BACKUP to delete it, or ⟲ ROLL BACK.':'No backup active. Tick ⟲ BACKUP at the bottom to make one.',BK?'l-tl':'l-sys')};
  setTimeout(()=>{regel('');regel('📱 Preview of DBash '+DBASH_VERSIE+' · AI roles. Click 🎓 FREE at the bottom to switch role (Free → Explain → Coach → Teacher), then ask: how do I install vlc  (or in Dutch: hoe installeer ik vlc). In COACH, type the command yourself. Type  learn  for the lessons. Also: demo2, demo, demo1. Any password works.','c-info');
    if(BK)regel('⟲ Backup '+BK.naam+' is still active. Untick ⟲ BACKUP when everything is OK.','l-tl')},2500);
})();

(function(){const ANTW="Let us look at the previous boot.\n```bash\n# 1. Errors of the previous boot\njournalctl -b -1 -p err --no-pager\n# 2. Services that failed\nsystemctl --failed --no-pager\nsudo smartctl -a /dev/nvme0n1\nsudo update-initramfs -u -k all\n```\nRun them, then ask me about the output.";
 const LOG=Array.from({length:180},(_,i)=>i==60?'Nov 15 14:26:23 debian kernel: amdgpu 0000:03:00.0: firmware load failed (-2)':i==130?'Nov 15 14:26:25 debian systemd[1]: Failed to start lm-sensors.service':'Nov 15 14:26:2'+(i%10)+' debian systemd[1427]: normal line '+i).join('\n');
 const oud=simuleer;window.simuleer=function(c){if(/^journalctl/.test(c))return{ok:true,out:LOG};if(/systemctl --failed/.test(c))return{ok:true,out:'  UNIT                LOAD   ACTIVE SUB    DESCRIPTION\n● lm-sensors.service  loaded failed failed Initialize hardware monitoring sensors\n\n1 loaded units listed.'};if(/smartctl/.test(c))return{ok:true,out:'SMART overall-health self-assessment test result: PASSED\nTemperature: 38 Celsius\nPercentage Used: 2%'};return oud(c)};
 const ov=window.vraagAI;window.vraagAI=async function(q,o){if(/^demo$/i.test(q.trim())){regel('◆ AI · demo','ai-kop');const el=regel('','l-ai');window.LAATSTE_ANTW=el;opmaak(el,ANTW);return}
   {const nl=/\b(hoe|installeer|ik|wat|waarom|maak|een|mijn|het)\b/i.test(q);const t=q.trim();
    const zeg=(txt)=>{regel('◆ AI · demo · '+ROLLEN[S.rol].naam,'ai-kop');const el=regel('','l-ai');window.LAATSTE_ANTW=el;opmaak(el,txt)};
    if(/^COACH CHECK/.test(t)){const c=(t.match(/`([^`]+)`/)||[])[1]||'';const fout=o&&o.term&&/FAILED/.test(o.term);
      if(/\binstal\b/.test(c))zeg(nl?'Bijna! Kijk nog eens naar het woord na `apt`: daar ontbreekt één letter. Probeer opnieuw.':'Almost! Look at the word after `apt` again: one letter is missing. Try again.');
      else if(fout&&/^apt\b/.test(c))zeg(nl?'Goed commando, maar apt mag alleen als beheerder iets installeren: zet er het woord ervoor dat "als beheerder" betekent.':'Right command, but apt may only install as administrator: put the word in front that means "as administrator".');
      else if(/install vlc/.test(c))zeg(nl?'✓ Goed gedaan! `sudo` = als beheerder, `apt install` = installeer, `vlc` = het pakket. Tip: met `apt show vlc` zie je eerst wat een pakket is.':'✓ Well done! `sudo` = as administrator, `apt install` = install, `vlc` = the package. Tip: `apt show vlc` tells you what a package is before you install it.');
      else if(/^pwd/.test(c))zeg('✓ Right: `pwd` (print working directory) shows the folder you are in: your home folder.');
      else if(/^ls/.test(c))zeg('✓ Good: `ls` lists the files and folders here. Folders are shown in colour.');
      else zeg(fout?(nl?'Dat lukte niet. Lees de laatste regel van de foutmelding: die zegt meestal wat er mis is. Hint: kijk naar de spelling.':'That did not work. Read the last line of the error: it usually says what is wrong. Hint: check the spelling.'):(nl?'✓ Dat werkte. Goed bezig!':'✓ That worked. Nice!'));return}
    if(/^Show me the exact command/.test(t)){zeg('Here it is:\n```bash\nsudo apt install vlc\n```');return}
    if(window.DEMO_TYPED!==false&&/^(sudo\s+)?(apt|ls|pwd|cd|mkdir|cat|echo|df|free|uname)\b/.test(t)&&S.rol!=='free'){window.BRON='typed';voerUit(t);return}
    if(/install|installeer|vlc/i.test(t)){
      if(S.rol==='free')zeg(nl?'VLC zit in de Debian-pakketten:\n```bash\nsudo apt install vlc\n```':'VLC is in the Debian repositories:\n```bash\nsudo apt install vlc\n```');
      else if(S.rol==='explain')zeg((nl?'VLC zit in de Debian-pakketten:':'VLC is in the Debian repositories:')+'\n```bash\nsudo apt install vlc\n```\n'+(nl?'- `sudo`: voer uit als beheerder (vraagt je wachtwoord)\n- `apt`: de pakketbeheerder van Debian\n- `install`: installeer een pakket\n- `vlc`: de naam van het pakket\nLet in de uitvoer op **Setting up vlc**: dan is het gelukt.':'- `sudo`: run as administrator (asks your password)\n- `apt`: Debian\'s package manager\n- `install`: install a package\n- `vlc`: the name of the package\nIn the output, look for **Setting up vlc**: that means it worked.'));
      else if(S.rol==='coach')zeg(nl?'Programma\'s installeer je op Debian met de pakketbeheerder **apt**, als beheerder (**sudo**). Het pakket heet gewoon `vlc`.\nTyp het nu zelf in de prompt: `sudo apt ________ vlc`\nHint: het ontbrekende woord is Engels voor "installeren".':'On Debian you install programs with the package manager **apt**, as administrator (**sudo**). The package is simply called `vlc`.\nNow type it yourself in the prompt: `sudo apt ________ vlc`\nHint: the missing word means "install".');
      else zeg('Programs on Debian come in *packages*; the tool for them is **apt**. Before you install, look the package up: type `apt search vlc` yourself (no sudo needed: you only read). Lesson 5 (type learn 5) teaches packages step by step.');
      return}
   }
   if(/^demo2$/i.test(q.trim())){regel('◆ AI · demo','ai-kop');const el=regel('','l-ai');window.LAATSTE_ANTW=el;opmaak(el,'Add **nofail** to the data disk, so your PC still boots when that disk is missing:\n```file:/etc/fstab\n# /etc/fstab: static file system information.\nUUID=1b2c-root  /          ext4  errors=remount-ro  0 1\nUUID=7A3F-EFI   /boot/efi  vfat  umask=0077         0 1\nUUID=data-4tb   /data      ext4  defaults,nofail    0 2\nUUID=swap-01    none       swap  sw                 0 0\n```\nThen test it without rebooting:\n```bash\nsudo mount -a\n```');return}
   if(/^demo1$/i.test(q.trim())){regel('◆ AI · demo','ai-kop');const el=regel('','l-ai');window.LAATSTE_ANTW=el;opmaak(el,'VLC is in the Debian repositories:\n```bash\nsudo apt install vlc\n```');return}
   if(o&&o.term){regel('◆ AI · demo','ai-kop');const el=regel('','l-ai');window.LAATSTE_ANTW=el;opmaak(el,'[DEMO] I read the output. The previous boot had a **firmware load failed** error for amdgpu and **lm-sensors** failed to start. The disk is healthy (SMART PASSED). Next step: check the firmware package:\n```bash\napt policy firmware-amd-graphics\n```');return}
   return ov(q,o)};})();

}
