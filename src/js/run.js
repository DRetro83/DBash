/* DBash · run.js: running commands: risk labels, y/n questions, RUN ALL, backup, explain. Part of the shared app logic (see js/README.md). */
/* ---------- risk of a command: SAFE (reads) · SUDO (changes the system) · DANGER ---------- */
const WIJZIGT=/^(sudo\b|apt(-get)?\s+(install|remove|purge|upgrade|full-upgrade|dist-upgrade|autoremove)|dpkg\s+-(i|r|P)|rm\b|mv\b|cp\b|chmod\b|chown\b|ln\b|mkdir\b|tar\s+-?x|unzip\b|systemctl\s+(enable|disable|start|stop|restart|mask|unmask)|flatpak\s+(install|uninstall)|pacman\s+-(S|R|U)|yay\s+-S|snap\s+(install|remove|refresh)|do-release-upgrade|dpkg\s+--add-architecture|pip3?\s+install|update-grub|modprobe|update-initramfs|dpkg-reconfigure|grub-install|mkinitramfs|mount\b|umount\b|swapon|swapoff|usermod|useradd|userdel|groupadd|passwd|ufw\s+(enable|disable|allow|deny|reset)|sysctl\s+-w|timedatectl\s+set|hostnamectl\s+set|localectl\s+set|(e2)?fsck(\.\w+)?\s+(?!.*\s-n\b)|tee\b|truncate\b)/;
const DANGER=/(\b(e2)?fsck(\.\w+)?\b(?![^|;&]*\s-n\b)|\brm\s+(-[a-zA-Z]*\s+)*-[a-zA-Z]*[rRf]|\bdd\s+|\bmkfs|\bwipefs\b|\bfdisk\b|\bparted\b|\bshred\b|--no-preserve-root|chmod\s+-R\s+777|>\s*\/dev\/(sd|nvme|hd)|:\(\)\s*\{|(curl|wget)[^|]*\|\s*(sudo\s+)?(ba)?sh\b|\bmv\s+\/\s|apt(-get)?\s+(remove|purge)\s+.*(linux-image|systemd|plasma|kde|libc6|sudo))/;
const RISICO_NAAM={safe:'SAFE',sudo:'SUDO',danger:'DANGER'};
const RISICO_UITLEG={safe:'Only reads information, changes nothing',sudo:'Changes your system. Tick ⟲ BACKUP first to be able to undo it.',danger:'Can destroy data or break your system. Always asks extra confirmation.'};
function risico(c){const t=c.trim();if(DANGER.test(t))return'danger';
  const delen=t.split(/\n|;|&&|\|\||\||\$\(|`|\(|\{/).map(x=>x.trim().replace(/^((do|then|else|elif|while|until|if|time|!)\s+)+/,''));
  if(delen.some(x=>/^sudo\b/.test(x)||WIJZIGT.test(x)))return'sudo';return'safe'}
function simuleer(c){
  const t=c.trim(),w=t.split(/\s+/)[0]==='sudo'?t.split(/\s+/)[1]:t.split(/\s+/)[0];
  let m;
  if(/^systemctl status bluetooth/.test(t))return{ok:true,out:'● bluetooth.service - Bluetooth service\n     Active: active (running) since '+new Date().toLocaleTimeString()};
  if(/^bluetoothctl show/.test(t))return{ok:true,out:'Controller 04:68:74:9B:F1:4A (public)\n        Powered: yes\n        Pairable: yes'};
  if(/^(rfkill|hciconfig|neofetch)\b/.test(t))return{ok:false,out:'bash: '+w+': command not found'};
  if(/^apt(-get)?\s+(install|remove|upgrade|update)/.test(t))return{ok:false,out:'E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)\nE: Unable to acquire the dpkg frontend lock, are you root?'};
  if((m=t.match(/^sudo apt(-get)?\s+install\s+(-y\s+)?(\S+)/))){
    if(/xyz|doesnotexist|fake/.test(m[3]))return{ok:false,out:'Reading package lists... Done\nE: Unable to locate package '+m[3]};
    return{ok:true,out:'Reading package lists... Done\nBuilding dependency tree... Done\nSetting up '+m[3]+' ...'}}
  if(/^sudo apt update && sudo apt full-upgrade/.test(t))return{ok:true,out:'Hit:1 http://deb.debian.org/debian trixie InRelease\nReading package lists... Done\n3 packages can be upgraded.\nSetting up mesa-vulkan-drivers ...\nRemoving 2 unused packages...\nDel cached .deb files... Done\n✓ System is up to date and clean.'};
  if(/^sudo pacman -Syu/.test(t))return{ok:true,out:':: Synchronizing package databases...\n:: Starting full system upgrade...\n there is nothing to do\n==> finished: 12 packages removed from cache'};
  if(/^ls\b/.test(t))return{ok:true,out:'DBash  Desktop  Documents  Downloads  Modellen  Music  Pictures  Videos'};
  if(/^uname/.test(t))return{ok:true,out:'Linux debian 6.12.48-amd64 #1 SMP PREEMPT_DYNAMIC Debian x86_64 GNU/Linux'};
  if(/^(cat \/etc\/os-release|lsb_release)/.test(t))return{ok:true,out:'PRETTY_NAME="'+S.sys_os+'"'};
  return{ok:true,out:'(preview: no real output; the real app shows the actual output here)'};
}
let runAllBezig=false;
/* ---------- y/n questions typed in the terminal ---------- */
const JA=['y','yes','j','ja'],NEE=['n','no','nee'];
let lopendeVraag=null;
function vraagJN(tekst,o={}){
  if(lopendeVraag)lopendeVraag();
  return new Promise(klaar=>{
    const rij=document.createElement('div');rij.className='inrow vraagrij';
    const lab=document.createElement('span');lab.className='vlab';lab.textContent=tekst;
    const i=document.createElement('input');i.className='vraagveld';i.autocomplete='off';i.spellcheck=false;i.setAttribute('autocapitalize','off');
    rij.append(lab,i);out.insertBefore(rij,invoerRij);invoerRij.style.display='none';inp.disabled=false;
    const klik=e=>{if(String(window.getSelection())!=='')return;if(!e.target.closest('button,a,input,select'))i.focus()};out.addEventListener('click',klik);
    const stop=(v,toon)=>{lopendeVraag=null;out.removeEventListener('click',klik);i.remove();const a=document.createElement('span');a.style.color='var(--accent)';a.textContent=toon;lab.after(a);invoerRij.style.display='';inp.focus();onderaan();klaar(v)};
    i.onkeydown=e=>{e.stopPropagation();
      if(e.key==='Escape'||(e.ctrlKey&&(e.key==='c'||e.key==='C'))){e.preventDefault();stop(null,'^C');return}
      if(e.key!=='Enter')return;e.preventDefault();
      const ruw=i.value.trim(),v=ruw.toLowerCase();
      if(o.vrij===true){stop(v,ruw);return}
      if(!v&&o.def!==undefined){stop(o.def,'');return}
      if((o.keys||[]).includes(v)){stop(v,ruw);return}
      if(o.num&&/^\d+$/.test(v)&&+v>=1&&+v<=o.num){stop(v,ruw);return}
      if(o.anders){stop({anders:ruw},ruw);return}
      i.value='';lab.textContent='Please answer '+(o.uitleg||((o.keys||[]).includes('a')?'y, n, a (all) or q (stop)':'y or n'))+(o.num?', or a number':'')+'. '+tekst.replace(/^Please answer [^.]*\. /,'');
    };
    lopendeVraag=()=>stop(null,'(no answer)');
    setTimeout(()=>i.focus(),20);onderaan();
  });
}
async function stelRunVraag(el){
  if(el&&window.controleerPakketten)await controleerPakketten(el).catch(()=>{});
  if(el&&el.isConnected&&(S.rol==='coach'||S.rol==='teacher')&&!el.querySelector('.cmd')&&!el.querySelector('.toonmij')){
    const b=document.createElement('button');b.className='toonmij';b.textContent='👁 SHOW ME THE COMMAND';b.title='Give me the answer';
    b.onclick=async e=>{e.stopPropagation();b.remove();if(inp.disabled)return;promptRegel('👁 show me');inp.disabled=true;window.LAATSTE_ANTW=null;await vraagAI('Show me the exact command for this step.');inp.disabled=false;inp.focus();stelRunVraag(window.LAATSTE_ANTW)};
    el.appendChild(b);
  }
  if(!el||!S.runvraag||!el.isConnected)return;
  if(S.rol==='coach'||S.rol==='teacher'){if(el.querySelector('.cmd'))regel('   🎓 Type it yourself in the prompt (or click ▶ RUN).','l-sys');return}
  for(const k of el.querySelectorAll('.bkaart')){
    await k.klaar;if(!k.info||k.gedaan||!k.stat||(!k.stat.plus&&!k.stat.min&&k.info.bestaat))continue;
    while(!k.gedaan){
      const a=await vraagJN('Write '+k.dataset.pad+'? [y/N/v/e] (v = view whole file, e = edit in nano) ',{keys:[...JA,...NEE,'v','view','e','edit'],def:'n',anders:true});
      if(a===null||NEE.includes(a)){if(!k.gedaan){k.gedaan=true;k.querySelector('.bknp').textContent='✕ not written'}break}
      if(typeof a==='object'){if(a.anders){inp.value=a.anders;inp.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}))}return}
      if(a==='v'||a==='view'){toonHeel(k);continue}
      if(a==='e'||a==='edit'){if(!window.bewerkInNano){regel('   Editing in nano works in the DBash app.','l-sys');continue}await bewerkKaart(k);continue}
      if(JA.includes(a)){await schrijfKaart(k);break}
    }
  }
  const cmds=[...el.querySelectorAll('.cmd')];if(!cmds.length)return;
  const n=cmds.length,risk=cmds.some(b=>risico(b.dataset.cmd)!=='safe'||b.classList.contains('vanweb'));
  const k=risk?'[y/N]':'[Y/n]';
  const a=await vraagJN(n===1?'Run this command? '+k+' ':'Run all '+n+' commands? '+k+' (or a number 1-'+n+') ',{keys:[...JA,...NEE],num:n>1?n:0,def:risk?'n':'y',anders:true});
  if(a===null)return;
  if(typeof a==='object'){if(a.anders){inp.value=a.anders;inp.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}))}return}
  if(/^\d+$/.test(a))return runTekst([cmds[+a-1]],false,true);
  if(JA.includes(a))return runTekst(cmds,n>1,true);
  regel('   ok, nothing run. You can still click ▶ RUN, or press Tab to choose a command.','l-sys');
}
async function runTekst(lijst,alles,alGevraagd){
  if(runAllBezig)return;window.BRON='run';runAllBezig=true;
  const klaar=[];let allesJa=false,bkGevraagd=false,gestopt=false;const n=lijst.length;
  if(alles)regel('▶ RUN ALL: '+n+' commands · SUDO asks [Y/n/a/q] · DANGER asks you to type yes','l-tl');
  for(let i=0;i<n;i++){
    const b=lijst[i],c=b.dataset.cmd,r=risico(c),web=b.classList.contains('vanweb'),nr=alles?'['+(i+1)+'/'+n+'] ':'';
    if(plekhouder(c)){regel('⏸ '+nr+'"'+c+'" needs you to fill something in first. It is in the prompt'+(i<n-1?'; the rest is stopped.':'.'),'l-warn');runAllBezig=false;voerUit(c,true);gestopt=true;break}
    if(r!=='safe'||web){
      if(r!=='safe'&&!bkGevraagd&&window.heeftBackup&&!heeftBackup()){bkGevraagd=true;
        const bk=await vraagJN('⟲ No backup active. Make a Timeshift backup first? [y/N] ',{keys:[...JA,...NEE],def:'n'});
        if(bk===null){regel('■ stopped','l-sys');gestopt=true;break}
        if(JA.includes(bk)){const ok=await maakBackupNu();if(!ok){const door=await vraagJN('⟲ The backup did not work. Continue without a backup? [y/N] ',{keys:[...JA,...NEE],def:'n'});if(!door||!JA.includes(door)){regel('■ stopped: nothing more is run.','l-sys');gestopt=true;break}}}}
      if(r==='danger'){
        const d=await vraagJN('⚠ '+nr+'DANGER: '+c+'\n   This can destroy data. Type yes to run it: ',{vrij:true});
        if(d!=='yes'){regel('   skipped','l-sys');continue}
      }else if(!allesJa&&(alles||!alGevraagd||web)){
        const d=await vraagJN(nr+c+'   · '+RISICO_NAAM[r]+(web?' · from a web answer':'')+' · run it? [Y/n/a/q] ',{keys:[...JA,...NEE,'a','all','q','quit'],def:'y'});
        if(d===null||d==='q'||d==='quit'){regel('■ stopped','l-sys');gestopt=true;break}
        if(NEE.includes(d)){regel('   skipped','l-sys');continue}
        if(d==='a'||d==='all')allesJa=true;
      }
      const res=await voerUit(c,true,true);if(res&&res.out!==undefined)klaar.push({c,ok:res.ok,out:res.out});
    }else{const res=await voerUit(c,true);if(res&&res.out!==undefined)klaar.push({c,ok:res.ok,out:res.out})}
    const laatst=klaar[klaar.length-1];
    if(alles&&i<n-1&&laatst&&laatst.c===c&&!laatst.ok){
      const d=await vraagJN('✗ '+nr+'failed. The next commands may depend on it. Continue with the rest? [y/N] ',{keys:[...JA,...NEE],def:'n'});
      if(!d||!JA.includes(d)){regel('■ stopped after the error. Ask the AI about it: just type your question.','l-sys');gestopt=true;break}
    }
  }
  runAllBezig=false;
  if(alles&&!gestopt||alles&&klaar.length){const fout=klaar.filter(x=>!x.ok).length;regel((gestopt?'■ RUN ALL stopped: ':'✓ RUN ALL done: ')+klaar.length+' run'+(fout?', '+fout+' failed':klaar.length?', all ok':''),fout?'l-warn':'l-ok')}
  if(!klaar.length)return;
  if(S.deeluit==='always'&&aiKlaar&&alles){uitBuf=uitBuf.filter(x=>!klaar.some(k=>k.c===x.c&&k.out===x.out));await vraagOverUitvoer(klaar)}
  else uitvoerKnop(klaar);
}
function uitvoerKnop(lijst){
  if(S.deeluit==='never')return;
  const k=regel('','l-ai');const b=document.createElement('button');b.className='aiuit';
  b.textContent='◆ ASK AI ABOUT '+(lijst.length>1?'THESE '+lijst.length+' RESULTS':'THIS');
  b.onclick=e=>{e.stopPropagation();b.remove();uitBuf=uitBuf.filter(x=>!lijst.some(k=>k.c===x.c&&k.out===x.out));vraagOverUitvoer(lijst)};
  k.appendChild(b);
}
const SBIN=/^(smartctl|fsck(\.\w+)?|e2fsck|update-initramfs|dpkg-reconfigure|fdisk|parted|update-grub|grub-install|iptables|nft|modprobe|rmmod|lshw|dmidecode|nvme|hdparm|blkid|sfdisk|mkinitramfs|ufw|reboot|shutdown|iotop|dmesg|sensors-detect|ip6tables|ethtool)$/;
function sudoNodig(c,res){if(/^(sudo\b|\.\/)/.test(c.trim()))return false;const w=c.trim().split(/\s+/)[0];
  if(res.ok)return /Operation not permitted|Permission denied|read kernel buffer failed|must be (run as )?root|are you root/i.test(res.out);
  return /Permission denied|Operation not permitted|must be (run as )?root|are you root|need to be root|only root|requires root|superuser|read kernel buffer failed/i.test(res.out)||(/command not found/.test(res.out)&&SBIN.test(w))}
function plekhouder(c){let m=/<[a-zA-Z][\w-]*>/.exec(c)||/\/dev\/(sd[a-z]?X|sdX|hdX|nvme\d*n?\d*p?X|nvmeX\w*|sd\?\w*)\b|\b(sdaX|sdX)\b|\byour[-_](disk|drive|partition|device)\b/.exec(c);return m?[m.index,m.index+m[0].length]:null}
function toonUitvoer(c,res){
  bewaarUitvoer(c,res);
  const kaal=schoonTerm(zonderAnsi(res.out||'')),regels=kaal.split('\n');
  let d;
  if(regels.length>15){
    d=regel('','uitvouw'+(res.ok?'':' fout'));
    const fr=regels.filter(l=>FOUTREGEL.test(l)&&!/\b0 errors?\b/i.test(l));
    const kop=document.createElement('div');kop.className='ukop';
    kop.innerHTML='<span class="pijl">▸</span> '+regels.length+' lines'+(fr.length?' · <span class="ufouten">'+fr.length+' with error/warning</span>':' · no errors found')+'  <span style="color:var(--dim)">(click to open)</span>';
    const voor=document.createElement('div');voor.className='uvoor';
    const toon=fr.length?fr.slice(-6):regels.slice(-4);
    if(fr.length&&fr.length>6)voor.append('… '+(fr.length-6)+' more error lines\n');
    toon.forEach((l,i)=>{const s=document.createElement('span');if(fr.length)s.className='ur';s.textContent=l+(i<toon.length-1?'\n':'');voor.appendChild(s)});
    if(!fr.length)voor.prepend('… last lines:\n');
    const vol=document.createElement('div');vol.className='uvol';
    if(regels.length>4000)vol.textContent='… (first '+(regels.length-4000)+' lines not shown)\n'+regels.slice(-4000).join('\n');else ansiDom(vol,res.out);
    kop.onclick=e=>{e.stopPropagation();d.classList.toggle('open');kop.querySelector('.pijl').textContent=d.classList.contains('open')?'▾':'▸'};
    d.append(kop,voor,vol);
  }else{d=regel('',res.ok?'l-uit':'l-uitfout');ansiDom(d,res.out)}
  if(sudoNodig(c,{ok:res.ok,out:kaal})){
    const b=document.createElement('button');b.className='sudoopnieuw';b.textContent='↻ RETRY WITH SUDO';b.title='This command needs administrator rights';
    b.onclick=e=>{e.stopPropagation();b.remove();voerUit('sudo '+c.trim(),true)};
    d.appendChild(document.createElement('br'));d.appendChild(b);
  }
  if(window.BRON==='typed'&&(S.rol==='coach'||S.rol==='teacher'))return;   // learn.js checks typed commands (coach, teacher)
  if(res.ok&&!runAllBezig&&S.deeluit==='ask'&&regels.length>2&&!/still running in the background/.test(kaal)&&!res.scherm){
    const b=document.createElement('button');b.className='aiuit';b.textContent='◆ ASK AI ABOUT THIS';
    b.onclick=e=>{e.stopPropagation();b.remove();const x={c,ok:res.ok,out:kaal};uitBuf=uitBuf.filter(y=>!(y.c===c&&y.out===kaal));vraagOverUitvoer([x])};
    d.appendChild(document.createElement('br'));d.appendChild(b);
  }
  if(!res.ok){
    const b=document.createElement('button');b.className='askai';b.textContent='◆ ASK AI';b.title='Let the AI explain this error and suggest a fix';
    b.onclick=async e=>{e.stopPropagation();b.remove();if(inp.disabled)return;
      const vraag='The command `'+c+'` failed. '+neemUitvoer([{c,ok:false,out:kaal}])+'\nExplain briefly what went wrong and how to fix it on my system.';
      promptRegel('◆ explain error: '+c);inp.disabled=true;await vraagAI(vraag);inp.disabled=false;inp.focus()};
    d.appendChild(document.createElement('br'));d.appendChild(b);
  }
}
function voerUit(c,bevestigd=false){
  if(!c)return;
  {const ex=expandAlias(c);if(ex&&ex.cmd!==c){regel('⚡ '+ex.a.n+' → '+ex.cmd,'l-tl');c=ex.cmd}}
  {const ph=plekhouder(c);if(ph){inp.value='!'+c;inp.focus();inp.setSelectionRange(ph[0]+1,ph[1]+1);regel('✎ Fill in the selected part first (your real disk or name). The command is in the prompt for you.','l-warn');return}}
  const r=risico(c);
  if(r==='danger'&&!bevestigd){
    const k=regel('','l-ai');const g=document.createElement('span');g.className='gevaar';
    g.textContent='⚠ DANGER: "'+c+'" can destroy data or break your system.';
    const ja=document.createElement('button');ja.className='ja2';ja.textContent='RUN ANYWAY';
    const nee=document.createElement('button');nee.textContent='CANCEL';
    ja.onclick=()=>{g.querySelectorAll('button').forEach(x=>x.remove());voerUit(c,true)};
    nee.onclick=()=>{g.querySelectorAll('button').forEach(x=>x.remove());g.append('  ✕ cancelled')};
    g.append(document.createElement('br'),ja,nee);k.appendChild(g);g.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();nee.click();inp.focus()}});setTimeout(()=>ja.focus(),20);return;
  }
  regel('▶ '+c+'   ['+RISICO_NAAM[r]+(r==='safe'?' · read-only':'')+']',r==='safe'?'l-ok':r==='danger'?'l-err':'l-warn');
  const res=simuleer(c);toonUitvoer(c,res);
  logToevoegen({c,r,ok:res.ok,punt:null,gesprek:huidigId,uit:(res.out||'').slice(0,400)});
  return res;
}
/* ---------- backup ---------- */
const BACKUP_SLEUTELS=['debhelp','debhelp-gesprekken','debhelp-mappen','dbash-downloads','dbash-modellen','dbash-cmdhist','dbash-boek','dbash-aliassen','dbash-log'];
function maakBackup(){
  const data={app:'DBash',versie:1,datum:new Date().toISOString(),data:{}};
  BACKUP_SLEUTELS.forEach(k=>{const v=opslag.get(k);if(v!==null)data.data[k]=v});
  const t=JSON.stringify(data,null,1);
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'application/json'}));a.download='dbash-backup-'+data.datum.slice(0,10)+'.json';a.click();
  const n=laadLijst().length,al=laadAlias().length;
  regel('⤓ Backup saved: dbash-backup-'+data.datum.slice(0,10)+'.json ('+Math.round(t.length/1024)+' KB · '+n+' chats · '+al+' aliases). [real app: ~/DBash/Backups/]','l-ok');
  if($('bk-msg'))$('bk-msg').textContent='✓ Exported '+Math.round(t.length/1024)+' KB';
}
function herstelBackup(file){
  const rd=new FileReader();
  rd.onload=()=>{
    let d;try{d=JSON.parse(rd.result)}catch(e){$('bk-msg').textContent='✗ Not a valid backup file.';return}
    if(!d||d.app!=='DBash'||!d.data){$('bk-msg').textContent='✗ This is not a DBash backup.';return}
    const m=$('bk-msg');m.innerHTML='';m.append('Backup from '+(d.datum||'?').slice(0,16).replace('T',' ')+'. This replaces your current DBash data. ');
    const ja=document.createElement('button');ja.className='btn';ja.textContent='✓ YES, RESTORE';
    ja.onclick=()=>{Object.entries(d.data).forEach(([k,v])=>{if(BACKUP_SLEUTELS.includes(k))opslag.set(k,v)});m.textContent='✓ Restored. Reloading…';regel('⤒ Backup restored. DBash restarts.','l-ok');setTimeout(()=>location.reload(),900)};
    m.appendChild(ja);
  };
  rd.readAsText(file);
}
$('bk-export').onclick=maakBackup;
$('bk-import').onclick=()=>$('bk-bestand').click();
$('bk-bestand').onchange=e=>{if(e.target.files[0])herstelBackup(e.target.files[0]);e.target.value=''};
/* ---------- explain ---------- */
const UITLEG={'sudo':'run as administrator (asks your password)','apt':'Debian package manager','apt-get':'Debian package manager (older tool)','update':'refresh the list of available packages',
 'upgrade':'install available updates','full-upgrade':'install updates, also when packages must be added or removed','install':'install packages','remove':'remove packages','purge':'remove packages and their settings',
 'autoremove':'remove packages nobody needs anymore','autoclean':'delete old downloaded package files','search':'search','show':'show details','list':'list',
 '-y':'answer "yes" to all questions automatically','&&':'only run the next command if the previous one succeeded','||':'run the next command only if the previous one failed',';':'run the next command anyway','|':'send the output to the next command',
 'systemctl':'controls services (systemd)','status':'show the state','restart':'stop and start again','enable':'start automatically at boot','--now':'…and also start it right now','disable':'do not start at boot',
 'journalctl':'read the system log','-b':'since this boot','-p':'only messages of this priority','err':'errors','-u':'only this service','-n':'number of lines',
 'tar':'pack or unpack archives','-x':'extract','-xf':'extract (x) from this file (f)','-f':'use this file','-C':'unpack into this folder','-c':'create',
 'rm':'delete files','-r':'recursive: also folders and everything in them','-rf':'delete folders and everything in them, without asking','mkdir':'make a folder','-p':'also make parent folders, no error if it exists',
 'cp':'copy','mv':'move or rename','chmod':'change permissions','chown':'change owner','ls':'list files','cat':'show a file','grep':'filter lines that contain a word','-i':'ignore upper/lower case',
 'flatpak':'Flatpak app manager','run':'start an app','pacman':'Arch package manager','-S':'install','-Syu':'sync and update the whole system','-Rns':'remove with unused dependencies and settings','yay':'AUR helper for Arch',
 'snap':'Snap app manager','refresh':'update','dpkg':'low-level Debian package tool','--add-architecture':'allow packages for another architecture','i386':'32-bit','bluetoothctl':'bluetooth control tool',
 'df':'disk space','-h':'human readable sizes (GB, MB)','free':'memory use','ip':'network tool','a':'addresses','ping':'test if a computer answers','-c':'count','lspci':'list PCI devices (graphics card…)','lscpu':'processor info',
 'dmesg':'kernel messages','tail':'show the last lines','head':'show the first lines','uname':'system info','-a':'all','echo':'print text','dd':'copy raw data to/from disks (dangerous)','mkfs':'format a disk (erases everything)'};
async function legUit(c){
  promptRegel('? explain: '+c);
  if(aiKlaar){await vraagAI('Explain this Linux command part by part, briefly, for a beginner. Say clearly if it is risky:\n`'+c+'`');return}
  regel('◆ AI · demo','ai-kop');
  const r=risico(c);const box=regel('','l-ai');
  box.append('Command: ');const code=document.createElement('code');code.textContent=c;box.append(code,'\n\n');
  c.match(/'[^']*'|"[^"]*"|\S+/g).forEach(t=>{
    const u=UITLEG[t]||(/^~?\/|^\.\//.test(t)?'a path (file or folder)':/^<.*>$/.test(t)?'fill this in yourself':/^-/.test(t)?'an option for the command':/^https?:/.test(t)?'a web address':/^\$\(/.test(t)?'the output of another command':null);
    const k=document.createElement('code');k.textContent=t;box.append('  ',k,'  ');box.append(u?'→ '+u:'→ (a name, package or value)');box.append('\n');
  });
  const s2=document.createElement('strong');s2.textContent=r==='safe'?'SAFE: it only reads, nothing changes.':r==='sudo'?'SUDO: it changes your system. Tick ⟲ BACKUP first if you want to be able to undo it.':'DANGER: this can destroy data. Check it very carefully.';
  box.append('\n',s2);
  regel('[preview] With a loaded AI you get a full explanation in your language.','l-sys');
}
