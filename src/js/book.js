/* DBash · book.js: log book, first-run wizard, command book, aliases. Part of the shared app logic (see js/README.md). */
/* ---------- log book ---------- */
const LKEY='dbash-log';let logOpen=false;
function laadLog(){try{return JSON.parse(opslag.get(LKEY)||'[]')}catch(e){return[]}}
function logToevoegen(x){const l=laadLog();l.unshift({id:Date.now()+Math.random(),tijd:Date.now(),...x});opslag.set(LKEY,JSON.stringify(l.slice(0,500)));if(typeof toonLijst==='function')toonLijst()}
function logDetail(x){
  regel('📜 '+datumTekst(x.tijd)+'  '+x.c,'c-acc');
  regel('   result: '+(x.ok?'✓ ok':'✗ failed')+'  ·  risk: '+RISICO_NAAM[x.r]+(x.punt?'  ·  backup '+x.punt:'  ·  no backup'),x.ok?'l-ok':'l-err');
  if(x.uit)regel(x.uit,x.ok?'l-uit':'l-uitfout');
  const g=x.gesprek?laadLijst().find(y=>y.id===x.gesprek):null;
  if(g){const r=regel('   chat:   ','l-sys');const a=document.createElement('a');a.href='#';a.textContent=g.titel;a.style.color='var(--accent)';a.onclick=e=>{e.preventDefault();openGesprek(g.id)};r.appendChild(a)}
}
const LOGICO='<svg width="14" height="12" viewBox="0 0 7 6" shape-rendering="crispEdges" fill="currentColor"><path d="M0 0h6v1H0zM0 1h1v5H0zM6 1h1v5H6zM1 5h5v1H1zM2 2h3v1H2zM2 3h3v1H2z"/></svg>';
function toonLogSectie(box,zq){
  const l=laadLog().filter(x=>!zq||x.c.toLowerCase().includes(zq.toLowerCase()));
  if(zq&&!l.length)return;
  const r=document.createElement('div');r.className='map logmap';
  r.innerHTML='<span class="pijl"></span><span class="mapico">'+LOGICO+'</span><span class="naam">Log</span><span class="aantal"></span><button class="weg chk2 logexp" title="Export the log">⤓</button><button class="weg del" title="Clear the log">✕</button>';
  r.querySelector('.pijl').textContent=(logOpen||zq)?'▾':'▸';
  const fout=l.filter(x=>!x.ok).length;
  r.querySelector('.aantal').textContent='('+l.length+(fout?' · '+fout+'✗':'')+')';
  r.title='Everything DBash ran';
  r.onclick=()=>{logOpen=!logOpen;toonLijst()};
  r.querySelector('.logexp').onclick=e=>{e.stopPropagation();const t=laadLog().slice().reverse().map(x=>new Date(x.tijd).toISOString()+'  '+(x.ok?'OK  ':'FAIL')+'  '+RISICO_NAAM[x.r].padEnd(6)+'  '+(x.punt?'#'+x.punt:'  ').padEnd(4)+'  '+x.c).join('\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t+'\n'],{type:'text/plain'}));a.download='dbash-log.txt';a.click();regel('⤓ Log exported ('+laadLog().length+' lines).','l-ok')};
  r.querySelector('.del').onclick=e=>{e.stopPropagation();const t=e.target;if(!t.dataset.z){t.dataset.z=1;t.textContent='sure?';setTimeout(()=>toonLijst(),2500);return}opslag.set(LKEY,'[]');toonLijst()};
  box.appendChild(r);
  if(!(logOpen||zq))return;
  if(!l.length){const x=document.createElement('div');x.className='leeg in';x.textContent='└─ (nothing run yet)';box.appendChild(x);return}
  l.slice(0,40).forEach((x,i,a)=>{
    const d=document.createElement('div');d.className='item log-item';
    d.innerHTML='<span class="tak"></span><span class="t"></span><span class="d"></span>';
    d.querySelector('.tak').textContent=i===a.length-1?'└─':'├─';
    const t=d.querySelector('.t');t.textContent=(x.ok?'':'✗ ')+x.c;t.classList.add('r-'+x.r);if(!x.ok)t.classList.add('fout');
    d.querySelector('.d').textContent=new Date(x.tijd).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})+(x.punt?' #'+x.punt:'');
    d.onclick=()=>{$('hpanel').classList.remove('open');logDetail(x);inp.focus()};
    box.appendChild(d);
  });
}
window.LOGKLAAR=true;toonLijst();
document.querySelector('.wk.x').onclick=()=>regel('Close DBash with the window button (✕) of your desktop.','l-sys');
document.addEventListener('click',e=>{if(!e.target.closest('#modelmenu')&&!e.target.closest('#modelwissel'))$('modelmenu').classList.remove('open')});
// keep the screen from drifting sideways on phones
['screen','monitor','out'].forEach(id=>$(id).addEventListener('scroll',e=>{if(e.target.scrollLeft)e.target.scrollLeft=0}));


/* ---------- first-run setup wizard ---------- */
let wizStap=0;
const WIZ_STAPPEN=5;
function wizard(start=0){wizStap=start;$('wizard').classList.add('open');toonWizard()}
function sluitWizard(klaar){$('wizard').classList.remove('open');if(klaar){S.wizardKlaar=true;bewaar()}inp.focus()}
function toonWizard(){
  const d=$('wizdoos');d.innerHTML='';
  const st=document.createElement('div');st.className='stappen';
  for(let i=0;i<WIZ_STAPPEN;i++){const x=document.createElement('span');if(i<=wizStap)x.className='klaar';st.appendChild(x)}
  d.appendChild(st);
  const kop=(nr,t)=>{const a=document.createElement('div');a.className='stap';a.textContent='STEP '+nr+' OF '+WIZ_STAPPEN;d.appendChild(a);const h=document.createElement('h3');h.textContent=t;d.appendChild(h)};
  const p=(t,cls)=>{const x=document.createElement('p');if(cls)x.className=cls;x.textContent=t;d.appendChild(x);return x};
  const knoppen=(terug,verder,verderTekst)=>{
    const k=document.createElement('div');k.className='knp';
    const l=document.createElement('span');
    if(terug){const b=document.createElement('button');b.textContent='◂ BACK';b.onclick=()=>{wizStap--;toonWizard()};l.appendChild(b)}
    else{const b=document.createElement('button');b.textContent='SKIP';b.onclick=()=>{sluitWizard(true);regel('Setup skipped. Type "wizard" to run it later.','l-sys')};l.appendChild(b)}
    const v=document.createElement('button');v.className='volgende';v.textContent=verderTekst||'NEXT ▸';v.onclick=verder;
    k.append(l,v);d.appendChild(k);
  };
  const volgende=()=>{wizStap++;toonWizard()};
  if(wizStap===0){
    kop(1,'WELCOME TO DBASH');
    p('DBash is your smart Debian terminal: a local AI that helps with commands, a real terminal, and a ⟲ BACKUP box so you can always go back.');
    p('This setup takes about one minute. You can change everything later in ⚙.','klein');
    knoppen(false,volgende);
  }else if(wizStap===1){
    kop(2,'WHERE ARE YOUR MODELS?');
    p('DBash looks for .llamafile models in this folder:');
    const l=document.createElement('label');l.textContent='Models folder';d.appendChild(l);
    const i=document.createElement('input');i.type='text';i.value=S.mmap;i.oninput=()=>{S.mmap=i.value;$('mmap').value=i.value;bewaar()};d.appendChild(i);
    const ms=laadModellen();const lj=document.createElement('div');lj.className='lijstje';
    lj.textContent='Found '+ms.length+' model'+(ms.length===1?'':'s')+':\n';lj.style.whiteSpace='pre-wrap';
    ms.forEach(m=>lj.append((m.naam===S.model?'● ':'  ')+m.naam+'  '+m.gb+' GB  '+(past(m.gb)?'GPU ✓':'part CPU')+'\n'));
    d.appendChild(lj);
    p('DBash also finds models in ~/Downloads.','klein');
    const gm=document.createElement('button');gm.textContent='★ GET THE BEST MODELS FOR YOUR GPU';gm.style.marginTop='6px';
    gm.onclick=()=>{sluitWizard(true);regel('Setup closed. You can run it again later with: wizard','l-sys');hfBeste()};d.appendChild(gm);
    p('Finds the newest models on Hugging Face that fit your GPU, and downloads the one you pick.','klein');
    knoppen(true,volgende);
  }else if(wizStap===2){
    kop(3,'TEST THE AI AND GPU');
    const c=document.createElement('label');c.className='chk';c.style.display='flex';c.style.gap='8px';
    const cb=document.createElement('input');cb.type='checkbox';cb.checked=S.gpu;cb.onchange=()=>{S.gpu=cb.checked;$('gpu').checked=cb.checked;bewaar();cmd.textContent=startCmd()};
    c.append(cb,' Use my GPU ('+(S.sys_gpu||'unknown')+')');d.appendChild(c);
    p('Start your AI in a terminal with:','klein');
    const cmd=document.createElement('div');cmd.className='lijstje';cmd.textContent=startCmd();d.appendChild(cmd);
    const t=document.createElement('button');t.textContent='▶ TEST AI';t.style.marginTop='6px';d.appendChild(t);
    const u=document.createElement('div');u.className='uitslag';d.appendChild(u);
    t.onclick=async()=>{u.textContent='Testing…';u.style.color='var(--dim)';await laadAI();
      if(aiKlaar){u.textContent='✓ The AI answers'+(S.gpu?' and runs on your GPU.':' (CPU mode).');u.style.color='var(--ok)'}
      else{u.textContent='✗ No AI found yet. Start it with the command above and test again. You can also continue: DBash then runs in demo mode.';u.style.color='var(--warn)'}};
    p('DBash starts the llamafile for you.','klein');
    knoppen(true,volgende);
  }else if(wizStap===3){
    kop(4,'BACKUPS');
    p('Before you change something, tick ⟲ BACKUP at the bottom. DBash then makes a Timeshift backup of your system.');
    p('Everything OK afterwards? Untick it and the backup is deleted. Not OK? Press ⟲ ROLL BACK.');
    p('Your personal files in /home are never touched. Commands that change your system always ask first, and also offer: back up first.','klein');
    p('Timeshift must be installed. Check it in ⚙ → SAFETY → TIMESHIFT (DBash can install it for you).','klein');
    knoppen(true,volgende);
  }else{
    kop(5,'ALL SET!');
    const lj=document.createElement('div');lj.className='lijstje';lj.style.whiteSpace='pre-wrap';
    lj.textContent='Models:          '+S.mmap+'\nActive model:    '+S.model+'\nGPU:             '+(S.gpu?'on':'off')+'\nBackups:         ⟲ BACKUP box (Timeshift)'+'\nDownloads:       '+S.dlmap;
    d.appendChild(lj);
    p('Tip: just type a question. Type "help" for all commands.','klein');
    knoppen(true,()=>{sluitWizard(true);regel('✓ Setup complete. Welcome to DBash!','l-ok')},'✓ FINISH');
  }
}
$('wizknop').onclick=()=>{$('panel').classList.remove('open');wizard(0)};


/* ---------- command book ---------- */
const BKEY='dbash-boek';
const STD_BOEK=[{"os": "Debian", "cats": [{"naam": "System", "cmds": [{"c": "hostnamectl", "d": "Computer name, OS and kernel in one overview"}, {"c": "uname -a", "d": "Kernel version"}, {"c": "uptime", "d": "How long the PC has been running"}, {"c": "free -h", "d": "Memory use (RAM and swap)"}, {"c": "df -h", "d": "Free disk space per drive"}, {"c": "cat /etc/os-release", "d": "Which Linux version you run"}]}, {"naam": "Packages (apt)", "cmds": [{"c": "apt list --installed", "d": "All installed packages"}, {"c": "apt search <name>", "d": "Search for a package"}, {"c": "apt show <package>", "d": "Info about a package"}, {"c": "sudo apt install <package>", "d": "Install a package"}, {"c": "sudo apt remove <package>", "d": "Remove a package"}, {"c": "sudo apt autoremove", "d": "Remove packages nobody needs anymore"}]}, {"naam": "Updates", "cmds": [{"c": "sudo apt update", "d": "Refresh the package lists"}, {"c": "apt list --upgradable", "d": "Which updates are waiting"}, {"c": "sudo apt upgrade", "d": "Install all updates"}, {"c": "sudo apt full-upgrade", "d": "Updates that also add/remove packages"}, {"c": "sudo apt update && sudo apt full-upgrade -y && sudo apt autoremove -y && sudo apt autoclean", "d": "ALL-IN-ONE: refresh, install all updates, remove unused packages, clean the cache"}]}, {"naam": "Services", "cmds": [{"c": "systemctl --failed", "d": "Services that crashed or failed"}, {"c": "systemctl status <service>", "d": "Status of one service, e.g. bluetooth"}, {"c": "sudo systemctl restart <service>", "d": "Restart a service"}, {"c": "sudo systemctl enable --now <service>", "d": "Start a service now and at every boot"}]}, {"naam": "Network", "cmds": [{"c": "ip a", "d": "Your network cards and IP addresses"}, {"c": "ping -c 4 debian.org", "d": "Test if the internet works"}, {"c": "nmcli device status", "d": "Wi-Fi and network status (NetworkManager)"}, {"c": "ss -tulpn", "d": "Which programs listen on which ports"}]}, {"naam": "Hardware & GPU", "cmds": [{"c": "lspci | grep -i vga", "d": "Which graphics card you have"}, {"c": "lscpu", "d": "Processor details"}, {"c": "vulkaninfo --summary", "d": "Check that Vulkan (GPU) works"}, {"c": "sensors", "d": "Temperatures (needs lm-sensors)"}, {"c": "lsusb", "d": "Connected USB devices"}]}, {"naam": "Bluetooth", "cmds": [{"c": "bluetoothctl show", "d": "Is bluetooth on and powered?"}, {"c": "bluetoothctl devices", "d": "Known bluetooth devices"}, {"c": "sudo systemctl restart bluetooth", "d": "Restart bluetooth when it hangs"}, {"c": "sudo rfkill list", "d": "Is bluetooth or Wi-Fi blocked?"}]}, {"naam": "Logs", "cmds": [{"c": "journalctl -b -p err", "d": "Errors since the last boot"}, {"c": "journalctl -u <service> -n 50", "d": "Last 50 log lines of one service"}, {"c": "sudo dmesg | tail -n 30", "d": "Latest kernel messages (hardware problems)"}]}, {"naam": "Gaming (Steam)", "cmds": [{"c": "sudo dpkg --add-architecture i386", "d": "Allow 32-bit packages (needed for Steam)"}, {"c": "sudo apt install steam-installer", "d": "Install Steam (contrib/non-free on)"}, {"c": "ls ~/.steam/root/compatibilitytools.d", "d": "Which extra Proton versions you have"}]}]}, {"os": "Ubuntu", "cats": [{"naam": "System", "cmds": [{"c": "hostnamectl", "d": "Computer name, OS and kernel in one overview"}, {"c": "uname -a", "d": "Kernel version"}, {"c": "uptime", "d": "How long the PC has been running"}, {"c": "free -h", "d": "Memory use (RAM and swap)"}, {"c": "df -h", "d": "Free disk space per drive"}, {"c": "cat /etc/os-release", "d": "Which Linux version you run"}]}, {"naam": "Packages (apt & snap)", "cmds": [{"c": "apt list --installed", "d": "All installed apt packages"}, {"c": "apt search <name>", "d": "Search for a package"}, {"c": "sudo apt install <package>", "d": "Install a package"}, {"c": "sudo apt remove <package>", "d": "Remove a package"}, {"c": "snap list", "d": "Installed snap apps"}, {"c": "sudo snap install <name>", "d": "Install a snap app"}]}, {"naam": "Updates", "cmds": [{"c": "sudo apt update", "d": "Refresh the package lists"}, {"c": "sudo apt upgrade", "d": "Install all updates"}, {"c": "sudo snap refresh", "d": "Update all snap apps"}, {"c": "sudo do-release-upgrade", "d": "Upgrade to the next Ubuntu version"}, {"c": "sudo apt update && sudo apt full-upgrade -y && sudo apt autoremove -y && sudo apt autoclean && sudo snap refresh", "d": "ALL-IN-ONE: apt updates + snap updates + clean up"}]}, {"naam": "Services", "cmds": [{"c": "systemctl --failed", "d": "Services that crashed or failed"}, {"c": "systemctl status <service>", "d": "Status of one service, e.g. bluetooth"}, {"c": "sudo systemctl restart <service>", "d": "Restart a service"}, {"c": "sudo systemctl enable --now <service>", "d": "Start a service now and at every boot"}]}, {"naam": "Network", "cmds": [{"c": "ip a", "d": "Your network cards and IP addresses"}, {"c": "ping -c 4 debian.org", "d": "Test if the internet works"}, {"c": "nmcli device status", "d": "Wi-Fi and network status (NetworkManager)"}, {"c": "ss -tulpn", "d": "Which programs listen on which ports"}]}, {"naam": "Hardware & GPU", "cmds": [{"c": "lspci | grep -i vga", "d": "Which graphics card you have"}, {"c": "lscpu", "d": "Processor details"}, {"c": "vulkaninfo --summary", "d": "Check that Vulkan (GPU) works"}, {"c": "sensors", "d": "Temperatures (needs lm-sensors)"}, {"c": "lsusb", "d": "Connected USB devices"}]}, {"naam": "Bluetooth", "cmds": [{"c": "bluetoothctl show", "d": "Is bluetooth on and powered?"}, {"c": "bluetoothctl devices", "d": "Known bluetooth devices"}, {"c": "sudo systemctl restart bluetooth", "d": "Restart bluetooth when it hangs"}, {"c": "sudo rfkill list", "d": "Is bluetooth or Wi-Fi blocked?"}]}, {"naam": "Logs", "cmds": [{"c": "journalctl -b -p err", "d": "Errors since the last boot"}, {"c": "journalctl -u <service> -n 50", "d": "Last 50 log lines of one service"}, {"c": "sudo dmesg | tail -n 30", "d": "Latest kernel messages (hardware problems)"}]}, {"naam": "Gaming (Steam)", "cmds": [{"c": "sudo apt install steam", "d": "Install Steam"}, {"c": "ls ~/.steam/root/compatibilitytools.d", "d": "Which extra Proton versions you have"}]}]}, {"os": "Arch", "cats": [{"naam": "System", "cmds": [{"c": "hostnamectl", "d": "Computer name, OS and kernel in one overview"}, {"c": "uname -a", "d": "Kernel version"}, {"c": "uptime", "d": "How long the PC has been running"}, {"c": "free -h", "d": "Memory use (RAM and swap)"}, {"c": "df -h", "d": "Free disk space per drive"}, {"c": "cat /etc/os-release", "d": "Which Linux version you run"}]}, {"naam": "Packages (pacman)", "cmds": [{"c": "pacman -Q", "d": "All installed packages"}, {"c": "pacman -Ss <name>", "d": "Search for a package"}, {"c": "pacman -Si <package>", "d": "Info about a package"}, {"c": "sudo pacman -S <package>", "d": "Install a package"}, {"c": "sudo pacman -Rns <package>", "d": "Remove a package with its unused dependencies"}, {"c": "pacman -Qdt", "d": "Orphans: packages nobody needs"}]}, {"naam": "Updates", "cmds": [{"c": "sudo pacman -Syu", "d": "Update the whole system"}, {"c": "checkupdates", "d": "Which updates are waiting (pacman-contrib)"}, {"c": "yay -Syu", "d": "Update including AUR packages (yay)"}, {"c": "sudo pacman -Syu && (orphans=$(pacman -Qdtq); [ -n \"$orphans\" ] && sudo pacman -Rns $orphans; true) && sudo paccache -rk2", "d": "ALL-IN-ONE: update everything, remove orphan packages, keep only 2 old versions in the cache (pacman-contrib)"}]}, {"naam": "Services", "cmds": [{"c": "systemctl --failed", "d": "Services that crashed or failed"}, {"c": "systemctl status <service>", "d": "Status of one service, e.g. bluetooth"}, {"c": "sudo systemctl restart <service>", "d": "Restart a service"}, {"c": "sudo systemctl enable --now <service>", "d": "Start a service now and at every boot"}]}, {"naam": "Network", "cmds": [{"c": "ip a", "d": "Your network cards and IP addresses"}, {"c": "ping -c 4 debian.org", "d": "Test if the internet works"}, {"c": "nmcli device status", "d": "Wi-Fi and network status (NetworkManager)"}, {"c": "ss -tulpn", "d": "Which programs listen on which ports"}]}, {"naam": "Hardware & GPU", "cmds": [{"c": "lspci | grep -i vga", "d": "Which graphics card you have"}, {"c": "lscpu", "d": "Processor details"}, {"c": "vulkaninfo --summary", "d": "Check that Vulkan (GPU) works"}, {"c": "sensors", "d": "Temperatures (needs lm-sensors)"}, {"c": "lsusb", "d": "Connected USB devices"}]}, {"naam": "Bluetooth", "cmds": [{"c": "bluetoothctl show", "d": "Is bluetooth on and powered?"}, {"c": "bluetoothctl devices", "d": "Known bluetooth devices"}, {"c": "sudo systemctl restart bluetooth", "d": "Restart bluetooth when it hangs"}, {"c": "sudo rfkill list", "d": "Is bluetooth or Wi-Fi blocked?"}]}, {"naam": "Logs", "cmds": [{"c": "journalctl -b -p err", "d": "Errors since the last boot"}, {"c": "journalctl -u <service> -n 50", "d": "Last 50 log lines of one service"}, {"c": "sudo dmesg | tail -n 30", "d": "Latest kernel messages (hardware problems)"}]}, {"naam": "Gaming (Steam)", "cmds": [{"c": "sudo pacman -S steam", "d": "Install Steam (enable [multilib] first)"}, {"c": "ls ~/.steam/root/compatibilitytools.d", "d": "Which extra Proton versions you have"}]}]}];
let boekOpen={};
const BOEK_VERSIE=3;
function laadBoek(){
  let b=null;try{b=JSON.parse(opslag.get(BKEY))}catch(e){}
  if(!Array.isArray(b))return JSON.parse(JSON.stringify(STD_BOEK));
  if((S.boekVersie||1)<BOEK_VERSIE){ // add new standard commands to a book that was saved earlier
    STD_BOEK.forEach(so=>{const o=b.find(x=>x.os===so.os);if(!o)return;
      so.cats.forEach(sc=>{let c=o.cats.find(x=>x.naam===sc.naam);if(!c){c={naam:sc.naam,cmds:[]};o.cats.push(c)}
        sc.cmds.forEach((cmd,i)=>{if(!c.cmds.some(x=>x.c===cmd.c))c.cmds.splice(Math.min(i,c.cmds.length),0,{...cmd})})})});
    // v3: the all-in-one update goes to the bottom of Updates, and Arch gets the improved version
    b.forEach(o=>o.cats.filter(c=>c.naam==='Updates').forEach(c=>{
      const std=(STD_BOEK.find(x=>x.os===o.os)||{cats:[]}).cats.find(x=>x.naam==='Updates');
      const stdCombo=std&&std.cmds.find(x=>/ALL-IN-ONE/.test(x.d||''));
      const combo=c.cmds.filter(x=>/ALL-IN-ONE/.test(x.d||''));
      c.cmds=c.cmds.filter(x=>!/ALL-IN-ONE/.test(x.d||''));
      c.cmds.push(...(stdCombo?[{...stdCombo}]:combo));
    }));
    S.boekVersie=BOEK_VERSIE;bewaar();opslag.set(BKEY,JSON.stringify(b));
  }
  return b}
function schrijfBoek(b){opslag.set(BKEY,JSON.stringify(b));toonBoek()}
function mijnOS(){const o=(S.sys_os||'').toLowerCase();const b=laadBoek();return(b.find(x=>o.includes(x.os.toLowerCase()))||{}).os}
function boekKaart(os,cat,cmd){
  const k=regel('','l-ai');const d=document.createElement('span');d.className='boekkaart';
  const p=document.createElement('div');p.className='pad';p.textContent='📖 '+os+' › '+cat;
  const u=document.createElement('div');u.className='uitleg';u.textContent=cmd.d||'';
  const c=document.createElement('span');opmaak(c,'```bash\n'+cmd.c+'\n```');
  const ins=document.createElement('button');ins.className='insert';ins.textContent='⇣ PUT IN PROMPT';ins.title='Put the command in the prompt so you can edit it';
  ins.onclick=e=>{e.stopPropagation();inp.value='!'+cmd.c;inp.focus();const i=inp.value.indexOf('<');if(i>0)inp.setSelectionRange(i,inp.value.indexOf('>',i)+1)};
  const ma=document.createElement('button');ma.className='maakalias';ma.textContent='⚡ MAKE ALIAS';ma.title='Give this command a short name';
  ma.onclick=e=>{e.stopPropagation();paneel('bpanel');aliasForm({c:cmd.c,d:cmd.d})};
  d.append(p,u,c,ins,ma);k.appendChild(d);
}
/* ---------- aliases (short names) ---------- */
const AKEY='dbash-aliassen';
const STD_ALIAS=[{n:'heroic',c:'flatpak run com.heroicgameslauncher.hgl',d:'Heroic Games Launcher'},{n:'btfix',c:'sudo systemctl restart bluetooth',d:'Restart bluetooth'}];
const INGEBOUWD=['hf','learn','lessons','role','memory','help','clear','settings','new','chats','book','list','open','search','history','downloads','models','use','updates','upgrade','points','wizard','alias','unalias'];
function laadAlias(){try{const a=JSON.parse(opslag.get(AKEY));if(Array.isArray(a))return a}catch(e){}return JSON.parse(JSON.stringify(STD_ALIAS))}
function schrijfAlias(a){opslag.set(AKEY,JSON.stringify(a));toonBoek()}
function geldigeNaam(n){return /^[a-zA-Z0-9][\w.-]{0,30}$/.test(n)}
function zetAlias(n,c,d,oud){
  if(!geldigeNaam(n))return 'Use only letters, numbers, - _ . (no spaces)';
  if(INGEBOUWD.includes(n))return '"'+n+'" is a DBash command, pick another name';
  const a=laadAlias().filter(x=>x.n!==(oud||n));
  if(a.some(x=>x.n===n))return 'An alias "'+n+'" already exists';
  a.push({n,c,d:d||''});a.sort((x,y)=>x.n.localeCompare(y.n));schrijfAlias(a);return null;
}
function expandAlias(v){const w=v.trim().split(/\s+/);const a=laadAlias().find(x=>x.n===w[0]);return a?{a,cmd:(a.c+' '+w.slice(1).join(' ')).trim()}:null}
function aliasForm(pre){
  const f=$('bform');f.innerHTML='';const d=document.createElement('div');d.className='bform';
  d.innerHTML='<b></b><label>Short name</label><input class="an" placeholder="e.g. heroic"><label>Command</label><input class="ac" placeholder="e.g. flatpak run com.heroicgameslauncher.hgl"><label>What it does (optional)</label><input class="ad"><div class="knp"><button class="opslaan">✓ SAVE</button><button class="annul">CANCEL</button></div>';
  d.querySelector('b').textContent=pre&&pre.n?'EDIT ALIAS':'NEW ALIAS';
  if(pre){d.querySelector('.an').value=pre.n||'';d.querySelector('.ac').value=pre.c||'';d.querySelector('.ad').value=pre.d||''}
  d.querySelectorAll('input').forEach(i=>i.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')d.querySelector('.opslaan').click()});
  d.querySelector('.annul').onclick=()=>f.innerHTML='';
  d.querySelector('.opslaan').onclick=()=>{
    const n=d.querySelector('.an').value.trim(),c=d.querySelector('.ac').value.trim();
    if(!n||!c){d.querySelector('b').textContent='⚠ Fill in a name and a command';return}
    const fout=zetAlias(n,c,d.querySelector('.ad').value.trim(),pre&&pre.n);
    if(fout){d.querySelector('b').textContent='⚠ '+fout;return}
    f.innerHTML='';aliasOpen=true;toonBoek();regel('⚡ Alias saved: '+n+' → '+c,'l-ok');
  };
  f.appendChild(d);(pre&&pre.c&&!pre.n?d.querySelector('.an'):d.querySelector(pre?'.ac':'.an')).focus();
}
let aliasOpen=true;
function toonAliasSectie(box,zq){
  const a=laadAlias().filter(x=>!zq||x.n.toLowerCase().includes(zq)||x.c.toLowerCase().includes(zq)||(x.d||'').toLowerCase().includes(zq));
  if(zq&&!a.length)return;
  const r=document.createElement('div');r.className='map alias';
  r.innerHTML='<span class="pijl"></span><span class="mapico">⚡</span><span class="naam">Aliases</span><span class="aantal"></span><span class="acties"></span>';
  r.querySelector('.pijl').textContent=(aliasOpen||zq)?'▾':'▸';r.querySelector('.aantal').textContent='('+a.length+')';
  r.title='Short names for long commands. Type the name in DBash to run it.';
  r.onclick=()=>{aliasOpen=!aliasOpen;toonBoek()};box.appendChild(r);
  if(!(aliasOpen||zq))return;
  if(!a.length){const x=document.createElement('div');x.className='leeg in';x.textContent='└─ (no aliases yet, click + ALIAS)';box.appendChild(x)}
  a.forEach(x=>{
    const d=document.createElement('div');d.className='item al-item';
    d.innerHTML='<span class="t"><span class="an"></span> → <span class="ac"></span><span class="ds"></span></span><button class="weg ed" title="Edit">✎</button><button class="weg del" title="Delete">✕</button>';
    d.querySelector('.an').textContent=x.n;d.querySelector('.ac').textContent=x.c;d.querySelector('.ds').textContent=x.d||'';
    d.onclick=()=>{$('bpanel').classList.remove('open');inp.value=x.n;inp.focus();regel('⚡ '+x.n+' → '+x.c+'   (press Enter to run it)','l-sys')};
    d.querySelector('.ed').onclick=e=>{e.stopPropagation();aliasForm(x)};
    d.querySelector('.del').onclick=e=>{e.stopPropagation();schrijfAlias(laadAlias().filter(y=>y.n!==x.n));regel('⚡ Alias removed: '+x.n,'l-sys')};
    box.appendChild(d);
  });
}
function bashAliasTekst(){return '# >>> DBash aliases >>>\n'+laadAlias().map(x=>"alias "+x.n+"='"+x.c.replace(/'/g,"'\\''")+"'"+(x.d?'   # '+x.d:'')).join('\n')+'\n# <<< DBash aliases <<<'}
function toonBoek(){
  const box=$('boeklijst');if(!box)return;box.innerHTML='';
  const b=laadBoek(),zq=($('zoekboek').value||'').toLowerCase().trim(),eigenOS=mijnOS();
  if(!Object.keys(boekOpen).length&&eigenOS)boekOpen[eigenOS]=true;
  let gevonden=0;
  toonAliasSectie(box,zq);
  b.forEach((os,oi)=>{
    const treffers=os.cats.map(c=>({c,cmds:c.cmds.filter(x=>!zq||x.c.toLowerCase().includes(zq)||(x.d||'').toLowerCase().includes(zq)||c.naam.toLowerCase().includes(zq))})).filter(x=>x.cmds.length);
    if(zq&&!treffers.length)return;
    const n=os.cats.reduce((a,c)=>a+c.cmds.length,0);
    const r=document.createElement('div');r.className='map os'+(os.os===eigenOS?' actief-os':'');
    r.innerHTML='<span class="pijl"></span><span class="mapico">'+BOEKMAPICO+'</span><span class="naam"></span><span class="aantal"></span><span class="acties"><button class="weg del" title="Delete this OS">✕</button></span>';
    const open=zq||boekOpen[os.os];
    r.querySelector('.pijl').textContent=open?'▾':'▸';r.querySelector('.naam').textContent=os.os;r.querySelector('.aantal').textContent='('+n+')';
    r.onclick=()=>{boekOpen[os.os]=!boekOpen[os.os];toonBoek()};
    r.querySelector('.del').onclick=e=>{e.stopPropagation();const t=e.target;if(!t.dataset.z){t.dataset.z=1;t.textContent='sure?';setTimeout(()=>toonBoek(),2500);return}
      const bb=laadBoek();bb.splice(oi,1);schrijfBoek(bb)};
    box.appendChild(r);
    if(!open)return;
    treffers.forEach(({c,cmds})=>{
      const ck=os.os+'/'+c.naam;const copen=zq||boekOpen[ck];
      const cr=document.createElement('div');cr.className='map cat';
      cr.innerHTML='<span class="pijl"></span><span class="naam"></span><span class="aantal"></span><span class="acties"></span>';
      cr.querySelector('.pijl').textContent=copen?'▾':'▸';cr.querySelector('.naam').textContent=c.naam;cr.querySelector('.aantal').textContent='('+cmds.length+')';
      cr.onclick=()=>{boekOpen[ck]=!boekOpen[ck];toonBoek()};box.appendChild(cr);
      if(!copen)return;
      cmds.forEach(cmd=>{gevonden++;
        const d=document.createElement('div');d.className='item bcmd';
        d.innerHTML='<span class="t"><span class="cc"></span><span class="ds"></span></span><button class="weg ed" title="Edit">✎</button><button class="weg del" title="Delete">✕</button>';
        d.querySelector('.cc').textContent=cmd.c;d.querySelector('.ds').textContent=cmd.d||'';
        if(cmd.eigen){const e=document.createElement('span');e.className='eigen';e.textContent=' ★ own';d.querySelector('.ds').appendChild(e)}
        d.onclick=()=>{boekKaart(os.os,c.naam,cmd);$('bpanel').classList.remove('open')};
        d.querySelector('.ed').onclick=e=>{e.stopPropagation();boekForm({os:os.os,cat:c.naam,cmd})};
        d.querySelector('.del').onclick=e=>{e.stopPropagation();const bb=laadBoek();const cc=bb.find(x=>x.os===os.os).cats.find(x=>x.naam===c.naam);
          cc.cmds=cc.cmds.filter(x=>!(x.c===cmd.c&&x.d===cmd.d));if(!cc.cmds.length)bb.find(x=>x.os===os.os).cats=bb.find(x=>x.os===os.os).cats.filter(x=>x!==cc);schrijfBoek(bb)};
        box.appendChild(d);
      });
    });
  });
  if(zq&&!box.children.length){const x=document.createElement('div');x.className='leeg in';x.textContent='No commands match "'+zq+'".';box.appendChild(x)}
}
const BOEKMAPICO='<svg width="14" height="12" viewBox="0 0 7 6" shape-rendering="crispEdges" fill="currentColor"><path d="M0 0h3v6H0zM4 0h3v6H4z"/><path d="M1 1h1v1H1zM5 1h1v1H5zM1 3h1v1H1zM5 3h1v1H5z" fill="var(--bg)"/></svg>';
function boekForm(bewerk){
  const f=$('bform');f.innerHTML='';const b=laadBoek();
  const d=document.createElement('div');d.className='bform';
  const osOpties=b.map(x=>x.os);
  d.innerHTML='<b></b><label>OS</label><select class="fos"></select><label>Category</label><select class="fcat"></select><input class="fnc" placeholder="New category name" style="display:none;margin-top:4px"><label>Command</label><input class="fc" placeholder="e.g. sudo apt install <package>"><label>What it does</label><input class="fd" placeholder="Short explanation"><div class="knp"><button class="opslaan">✓ SAVE</button><button class="annul">CANCEL</button></div>';
  d.querySelector('b').textContent=bewerk&&bewerk.cmd?'EDIT COMMAND':'NEW COMMAND';
  const fos=d.querySelector('.fos'),fcat=d.querySelector('.fcat'),fnc=d.querySelector('.fnc');
  osOpties.forEach(o=>{const op=document.createElement('option');op.value=o;op.textContent=o;fos.appendChild(op)});
  fos.value=(bewerk&&bewerk.os)||mijnOS()||osOpties[0];
  const vulCat=()=>{fcat.innerHTML='';const os=b.find(x=>x.os===fos.value);(os?os.cats:[]).forEach(c=>{const op=document.createElement('option');op.value=c.naam;op.textContent=c.naam;fcat.appendChild(op)});
    const n=document.createElement('option');n.value='__nieuw';n.textContent='+ new category…';fcat.appendChild(n);fnc.style.display=fcat.value==='__nieuw'?'block':'none'};
  vulCat();fos.onchange=vulCat;fcat.onchange=()=>fnc.style.display=fcat.value==='__nieuw'?'block':'none';
  if(bewerk&&bewerk.cat){fcat.value=bewerk.cat}
  if(bewerk&&bewerk.cmd){d.querySelector('.fc').value=bewerk.cmd.c;d.querySelector('.fd').value=bewerk.cmd.d||''}
  d.querySelectorAll('input').forEach(i=>i.onkeydown=e=>e.stopPropagation());
  d.querySelector('.annul').onclick=()=>f.innerHTML='';
  d.querySelector('.opslaan').onclick=()=>{
    const c=d.querySelector('.fc').value.trim(),ds=d.querySelector('.fd').value.trim();
    let catNaam=fcat.value==='__nieuw'?fnc.value.trim():fcat.value;
    if(!c||!catNaam){d.querySelector('b').textContent='⚠ Fill in a command and a category';return}
    const bb=laadBoek();const os=bb.find(x=>x.os===fos.value);
    if(bewerk&&bewerk.cmd){const oc=bb.find(x=>x.os===bewerk.os).cats.find(x=>x.naam===bewerk.cat);oc.cmds=oc.cmds.filter(x=>!(x.c===bewerk.cmd.c&&x.d===bewerk.cmd.d))}
    let cat=os.cats.find(x=>x.naam===catNaam);if(!cat){cat={naam:catNaam,cmds:[]};os.cats.push(cat)}
    cat.cmds.push({c,d:ds,eigen:true});
    bb.forEach(o=>o.cats=o.cats.filter(x=>x.cmds.length));
    boekOpen[os.os]=true;boekOpen[os.os+'/'+catNaam]=true;
    schrijfBoek(bb);f.innerHTML='';regel('📖 Saved in the book: '+os.os+' › '+catNaam+' › '+c,'l-ok');
  };
  f.appendChild(d);d.querySelector('.fc').focus();
}
function osForm(){
  const f=$('bform');f.innerHTML='';const b=laadBoek();
  const d=document.createElement('div');d.className='bform';
  d.innerHTML='<b>NEW OS</b><label>Name</label><input class="fn" placeholder="e.g. Fedora, Linux Mint, openSUSE"><label>Start from</label><select class="fv"><option value="">Empty book</option></select><div class="knp"><button class="opslaan">✓ CREATE</button><button class="annul">CANCEL</button></div>';
  const fv=d.querySelector('.fv');b.forEach(o=>{const op=document.createElement('option');op.value=o.os;op.textContent='Copy of '+o.os;fv.appendChild(op)});
  d.querySelector('.fn').onkeydown=e=>e.stopPropagation();
  d.querySelector('.annul').onclick=()=>f.innerHTML='';
  d.querySelector('.opslaan').onclick=()=>{
    const n=d.querySelector('.fn').value.trim();if(!n){d.querySelector('b').textContent='⚠ Give the OS a name';return}
    const bb=laadBoek();if(bb.some(x=>x.os.toLowerCase()===n.toLowerCase())){d.querySelector('b').textContent='⚠ That OS already exists';return}
    const bron=bb.find(x=>x.os===fv.value);
    bb.push({os:n,cats:bron?JSON.parse(JSON.stringify(bron.cats)):[]});boekOpen[n]=true;schrijfBoek(bb);f.innerHTML='';
    regel('📖 New OS in the book: '+n+(bron?' (copied from '+bron.os+')':''),'l-ok');
  };
  f.appendChild(d);d.querySelector('.fn').focus();
}
$('b-cmd').onclick=()=>boekForm(null);
$('b-alias').onclick=()=>aliasForm(null);
$('b-export').onclick=()=>{
  const t=bashAliasTekst();regel('⤓ These lines go into ~/.bash_aliases, so your aliases also work in a normal terminal:','c-info');
  t.split('\n').forEach(l=>regel('   '+l,'l-uit'));
  regel('[preview] The real app writes this block into ~/.bash_aliases (and only replaces its own block). Here it is downloaded as a file.','l-sys');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t+'\n'],{type:'text/plain'}));a.download='bash_aliases';a.click();
  $('bpanel').classList.remove('open');
};
$('b-os').onclick=osForm;
$('b-reset').onclick=e=>{const t=e.target;if(!t.dataset.z){t.dataset.z=1;t.textContent='SURE? CLICK AGAIN';setTimeout(()=>{delete t.dataset.z;t.textContent='↺ RESET'},3000);return}
  delete t.dataset.z;t.textContent='↺ RESET';opslag.set(BKEY,JSON.stringify(STD_BOEK));boekOpen={};toonBoek();regel('📖 Command book reset to the standard Debian, Ubuntu and Arch commands.','l-sys')};
$('zoekboek').addEventListener('input',toonBoek);
$('zoekboek').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){$('zoekboek').value='';toonBoek()}});
toonBoek();
