/* DBash · input.js: the prompt: what you type, DBash commands, keys, Tab. Part of the shared app logic (see js/README.md). */
/* ---------- the prompt: what you type ---------- */
const invoerRij=document.createElement('div');invoerRij.className='inrow';
invoerRij.innerHTML='<span><span class="p-user">you@debian</span><span class="p-dol">:</span><span class="p-pad">~</span><span class="p-dol">$ </span></span><textarea id="in" rows="1" autocomplete="off" spellcheck="false"></textarea>';
function promptRegel(v){const d=regel('','l-me');d.innerHTML='<span class="p-user">you@debian</span><span class="p-dol">:</span><span class="p-pad">~</span><span class="p-dol">$ </span>';d.append(v);return d}
out.appendChild(invoerRij);
const inp=$('in');
inp.addEventListener('focus',()=>{requestAnimationFrame(()=>{out.scrollLeft=0;$('screen').scrollLeft=0})});
out.addEventListener('click',e=>{if(String(window.getSelection&&window.getSelection())!=='')return;if(e.target.closest&&e.target.closest('.cmd,.dl,.gevaar,button,a,input,select'))return;inp.focus()});

const HULP=`Commands:
  <question>     just type a question for the AI   (e.g.: check if bluetooth works)
  ? <question>   same, explicitly
  !<command>     run a command               (e.g.: !systemctl status bluetooth)
  !web <words>   search DuckDuckGo yourself
  !get <url>     download a file (always asks first)
  !open <site>   open a website (reader mode or browser)
  !read <site>   show a website as text inside DBash
  help           this help
  clear          clear the screen
  settings       open the settings panel
  new            new conversation
  chats          open the conversations panel
  book           open the command book · book <word> to search it
  upgrade        update, install and clean everything (asks before running)
  alias          list your aliases · alias name='command' to add one
  unalias <name> remove an alias
  <alias>        just type an alias name (e.g. heroic) to run its command
  downloads      list everything you downloaded
  log            everything DBash ran (time, risk, backup)
  explain <cmd>  let the AI explain a command part by part
  backup         save settings, chats, book and aliases to one file
  models         list your models · use <nr> to switch
  updates        check models and downloads for updates
  wizard         run the setup wizard again
  points         show the active ⟲ BACKUP
  list           list saved conversations
  open <nr>      open a saved conversation
  search <word>  search in your conversations
  history        your recent commands
  memory         how full the AI memory of this chat is (summarize, new chat)
  learn          the lessons (Teacher role) · learn <nr> starts a lesson
  hf             best models for your GPU (Hugging Face) · hf <words> to search
  role <name>    AI role: free, explain, coach or teacher

Keys:  Enter send · Shift+Enter new line (for letters and long texts) · ↑/↓ earlier commands · Tab complete · Ctrl+L clear screen\n       Tab (empty prompt) choose a command on screen: ↑/↓ move · Enter run · E explain · P put in prompt · Esc back\n       Alt+1…9 or run <nr>: run command nr in the last answer

Risk labels on commands:
  SAFE    only reads, changes nothing
  SUDO    changes your system (tick ⟲ BACKUP first to be able to undo it)
  DANGER  can destroy data, always asks extra confirmation`;

/* keyboard control of commands: Tab on an empty prompt, arrows, Enter, E, P, Esc */
function laatsteAntwoordCmds(){const a=[...out.querySelectorAll('.l-ai')].reverse().find(x=>x.querySelector('.cmd'));return a?[...a.querySelectorAll('.cmd')]:[]}
function alleKiesbaar(){return[...out.querySelectorAll('.cmd,.dl')].filter(x=>x.querySelector('button'))}
let hintGetoond=false;
function kiesCommando(idx){
  const l=alleKiesbaar();if(!l.length){regel('No commands on screen yet.','l-sys');return}
  const el=l[idx<0?l.length+idx:Math.min(idx,l.length-1)];el.tabIndex=-1;el.focus();el.scrollIntoView({block:'nearest'});
  if(!hintGetoond){hintGetoond=true;regel('⌨ ↑/↓ choose · Enter run · E explain · P put in prompt · Esc back to the prompt','toetshint')}
}
function runNr(n){const l=laatsteAntwoordCmds();const b=l[n-1];if(!b){regel('There is no command '+n+' in the last answer.','l-warn');return}
  b.focus();const k=[...b.querySelectorAll('button')].find(x=>/RUN|CONFIRM/.test(x.textContent));if(k)k.click()}
out.addEventListener('keydown',e=>{
  const el=e.target.closest&&e.target.closest('.cmd,.dl');if(!el||e.target.tagName==='INPUT')return;
  const l=alleKiesbaar(),i=l.indexOf(el);
  if(e.key==='ArrowUp'||(e.key==='Tab'&&e.shiftKey)){e.preventDefault();if(i>0){l[i-1].tabIndex=-1;l[i-1].focus();l[i-1].scrollIntoView({block:'nearest'})}}
  else if(e.key==='ArrowDown'||e.key==='Tab'){e.preventDefault();if(i<l.length-1){l[i+1].tabIndex=-1;l[i+1].focus();l[i+1].scrollIntoView({block:'nearest'})}else inp.focus()}
  else if(e.key==='Enter'&&e.target===el){e.preventDefault();const k=[...el.querySelectorAll('button')].find(x=>/RUN|CONFIRM|DOWNLOAD|OPEN IN BROWSER/.test(x.textContent))||el.querySelector('button');if(k)k.click()}
  else if((e.key==='e'||e.key==='E')&&el.classList.contains('cmd')){e.preventDefault();const k=el.querySelector('.uitleg');if(k)k.click()}
  else if((e.key==='p'||e.key==='P')&&el.dataset.cmd){e.preventDefault();inp.value='!'+el.dataset.cmd;inp.focus()}
  else if(e.key==='Escape'){e.preventDefault();inp.focus()}
});
/* command history, tab completion, Ctrl+L */
const CKEY='dbash-cmdhist';
let cmdHist=[];try{cmdHist=JSON.parse(opslag.get(CKEY)||'[]')}catch(e){}
let histPos=-1,histConcept='';
const AANVUL=['hf ','hf best','learn','role coach','role free','role explain','role teacher','memory','run ','log','backup','explain ','alias','unalias ','upgrade','book','book ','!read ','!open ','wizard','models','updates','use ','help','clear','settings','new','chats','list','history','downloads','points','open ','search ','?','!web ','!get ',
  '!systemctl status ','!sudo systemctl restart ','!sudo apt install ','!sudo apt update','!sudo apt upgrade','!apt search ','!bluetoothctl show','!ls','!uname -a','!cat /etc/os-release','!journalctl -b -p err'];
inp.addEventListener('keydown',e=>{
  if((e.key==='ArrowUp'||e.key==='ArrowDown')&&!inp.value.includes('\n')){
    if(!cmdHist.length)return;e.preventDefault();
    if(histPos===-1)histConcept=inp.value;
    histPos=e.key==='ArrowUp'?Math.min(histPos+1,cmdHist.length-1):histPos-1;
    if(histPos<0){histPos=-1;inp.value=histConcept}else inp.value=cmdHist[cmdHist.length-1-histPos];
    setTimeout(()=>inp.setSelectionRange(inp.value.length,inp.value.length));return;
  }
  if(e.altKey&&/^[1-9]$/.test(e.key)){e.preventDefault();runNr(+e.key);return}
  if(e.key==='Tab'&&!inp.value){e.preventDefault();kiesCommando(e.shiftKey?0:-1);return}
  if(e.key==='Tab'){
    e.preventDefault();const v=inp.value;if(!v)return;
    // file and folder names (in the app): after the first word, or when the word looks like a path
    if(window.tabBestanden&&(/\s/.test(v)||/^[~./]/.test(v))){tabBestanden(v).then(ok=>{if(!ok)tabUitHistorie(v)});return}
    tabUitHistorie(v);
    return;
  }
  if(e.key==='l'&&e.ctrlKey){e.preventDefault();wisScherm();return}
},true);
// Tab without file names: DBash commands, your aliases and your history
function tabUitHistorie(v){
  const pool=[...new Set([...AANVUL,...laadAlias().map(x=>x.n),...Object.keys(window.BASH_ALIASSEN||{}),...cmdHist.slice().reverse()])];
  const m=pool.filter(x=>x.startsWith(v)&&x!==v);
  tabKies(v,'',m);
}
// complete v with the matches m of its last word w: one match = fill in, more = common start, or show the list
function tabKies(v,w,m,toon){
  const basis=v.slice(0,v.length-w.length);
  if(m.length===1){inp.value=basis+m[0];return true}
  if(m.length>1){
    let pre=m[0];m.forEach(x=>{while(!x.startsWith(pre))pre=pre.slice(0,-1)});
    if(pre.length>w.length&&w!==''||(w===''&&pre.length)){inp.value=basis+pre;return true}
    regel((toon||m).slice(0,40).join('    ')+(m.length>40?'    … '+(m.length-40)+' more':''),'tabopties');return true;
  }
  return false;
}
function groei(){inp.style.height='auto';inp.style.height=Math.min(inp.scrollHeight,window.innerHeight*0.4)+'px';inp.style.overflowY=inp.scrollHeight>window.innerHeight*0.4?'auto':'hidden'}
inp.addEventListener('input',groei);
inp.addEventListener('keydown',async e=>{
  if(e.key!=='Enter'||e.shiftKey){if(e.key==='Enter')setTimeout(groei);return}
  e.preventDefault();
  const v=inp.value.trim();inp.value='';groei();histPos=-1;
  if(v&&cmdHist[cmdHist.length-1]!==v){cmdHist.push(v);cmdHist=cmdHist.slice(-200);opslag.set(CKEY,JSON.stringify(cmdHist))}
  promptRegel(v);
  if(!v)return;
  if(v==='alias'){const a=laadAlias();if(!a.length)regel('No aliases yet. Example: alias heroic=\'flatpak run com.heroicgameslauncher.hgl\'');a.forEach(x=>regel("alias "+x.n+"='"+x.c+"'"+(x.d?'   # '+x.d:''),'l-uit'));return}
  {const m=/^alias\s+([^=\s]+)=(['"]?)(.+)\2$/.exec(v);if(m){const fout=zetAlias(m[1],m[3].trim(),'');regel(fout?'⚠ '+fout:'⚡ Alias saved: '+m[1]+' → '+m[3].trim(),fout?'l-warn':'l-ok');return}}
  {const m=/^unalias\s+(\S+)$/.exec(v);if(m){const a=laadAlias();if(!a.some(x=>x.n===m[1])){regel('unalias: '+m[1]+': not found','l-err');return}schrijfAlias(a.filter(x=>x.n!==m[1]));regel('⚡ Alias removed: '+m[1],'l-sys');return}}
  {const ex=!v.startsWith('!')&&!v.startsWith('?')&&!INGEBOUWD.includes(v.split(/\s+/)[0])?expandAlias(v):null;if(ex){regel('⚡ '+ex.a.n+' → '+ex.cmd,'l-tl');voerUit(ex.cmd);return}}
  if(v==='help')regel(HULP);
  else if(v==='clear')wisScherm();
  else if(v==='settings')paneel('panel');
  else if(v==='new')nieuwGesprek();
  else if(v==='chats')paneel('hpanel');
  else if(v==='book'){paneel('bpanel');toonBoek()}
  else if(v==='upgrade'){const os=mijnOS()||'Debian';const o=laadBoek().find(x=>x.os===os);const c=o&&o.cats.find(x=>x.naam==='Updates');const cmd=c&&c.cmds.find(x=>/ALL-IN-ONE/.test(x.d||''));
    if(cmd)boekKaart(os,'Updates',cmd);else regel('No all-in-one update command in the book for '+os+'.','l-warn')}
  else if(/^book\s+/.test(v)){$('zoekboek').value=v.replace(/^book\s+/,'');['panel','hpanel'].forEach(p=>$(p).classList.remove('open'));$('bpanel').classList.add('open');toonBoek()}
  else if(v==='downloads'){const d=laadDownloads();if(!d.length)regel('No downloads yet.');else{regel('Downloads in '+S.dlmap+':','c-info');
    d.forEach((x,i)=>regel(String(i+1).padStart(2)+'. '+(x.vertrouwd?'  ':'⚠ ')+x.naam+'  ('+x.bron+', '+datumTekst(x.datum)+')'))}}
  else if(v==='history'){cmdHist.slice(-30).forEach((x,i,a)=>regel(String(cmdHist.length-a.length+i+1).padStart(4)+'  '+x))}
  else if(/^search\s+/.test(v)){const q=v.replace(/^search\s+/,'');$('zoekchat').value=q;toonLijst();$('panel').classList.remove('open');$('hpanel').classList.add('open');
    const n=zoekGesprekken(q).length;regel(n+' conversation'+(n===1?'':'s')+' found for "'+q+'".','c-info')}
  else if(/^run\s+\d+$/.test(v))runNr(+v.split(/\s+/)[1]);
  else if(v==='memory')geheugenInfo();
  else if(v==='hf'||v==='models best'||v==='hf best')hfBeste();
  else if(/^hf\s+\S/.test(v))hfZoek(v.replace(/^hf\s+/,''));
  else if(v==='learn'||v==='lessons')toonLessen();
  else if(v==='learn stop'&&window.stopLes)stopLes();
  else if(v==='update'||v==='update dbash'){if(window.dbashUpdate)dbashUpdate(true);else regel('[preview] In the app this checks GitHub for a new DBash version.','l-sys')}
  else if(/^learn\s+\d+$/.test(v)&&+v.split(/\s+/)[1]>=1&&+v.split(/\s+/)[1]<=LESSEN.length)startLes(+v.split(/\s+/)[1]);
  else if(/^role\s+(free|explain|coach|teacher)$/.test(v))zetRol(v.split(/\s+/)[1]);
  else if(v==='log'){const l=laadLog();if(!l.length)regel('Nothing run yet.');l.slice(0,25).reverse().forEach(x=>regel(datumTekst(x.tijd)+'  '+(x.ok?'✓':'✗')+'  '+RISICO_NAAM[x.r].padEnd(6)+' '+(x.punt?('#'+x.punt).padEnd(4):'    ')+x.c,x.ok?(x.r==='safe'?'l-sys':'l-warn'):'l-err'))}
  else if(v==='backup'){maakBackup()}
  else if(/^explain\s+/.test(v)){const c=v.replace(/^explain\s+/,'').replace(/^!/,'');inp.disabled=true;await legUit(c);inp.disabled=false;inp.focus()}
  else if(v==='models'){regel('Models in '+S.mmap+':','c-info');laadModellen().forEach((m,i)=>regel(String(i+1).padStart(2)+'. '+(m.naam===S.model?'● ':'  ')+bestand(m)+'  '+grootte(m.gb)+'  '+(past(m.gb)?'GPU ✓':'part CPU')+(m.bron==='manual'?'  manual':'')+(m.klaar?'  ⇪ ready':m.update?'  ↑ update':''),m.naam===S.model?'c-acc':'l-sys'))}
  else if(/^use\s+\d+$/.test(v)){const m=laadModellen()[+v.split(/\s+/)[1]-1];m?wisselModel(m.naam):regel('Model not found.','l-err')}
  else if(v==='wizard')wizard(0);
  else if(v==='updates'){inp.disabled=true;await checkUpdates(false);inp.disabled=false;inp.focus()}
  else if(v==='list'){const g=laadLijst();if(!g.length)regel('No saved conversations yet.');
    g.forEach((x,i)=>regel(String(i+1).padStart(2)+'. '+(x.map?'['+x.map+'] ':'')+x.titel+'  ('+datumTekst(x.datum)+')'));}
  else if(/^open \d+$/.test(v)){const g=laadLijst()[+v.split(' ')[1]-1];g?openGesprek(g.id):regel('Conversation not found.','l-err');}
  else if(/^!web\s+/.test(v)){inp.disabled=true;await zoekWeb(v.replace(/^!web\s+/,''));inp.disabled=false;inp.focus();}
  else if(/^!read\s+\S+/.test(v)){let u=v.replace(/^!read\s+/,'');if(!/^https?:\/\//.test(u))u='https://'+u;await leesModus(u)}
  else if(/^!open\s+\S+/.test(v)){let u=v.replace(/^!open\s+/,'');if(!/^https?:\/\//.test(u))u='https://'+u;const k=regel('','l-ai');k.appendChild(siteKaart(u))}
  else if(/^!get\s+https?:\/\//.test(v)){const k=regel('','l-ai');k.appendChild(downloadKaart(v.replace(/^!get\s+/,'')));}
  else if(v==='points'){if(window.toonPunten)toonPunten();else regel('No backup active.','l-sys')}
  else if(v.startsWith('!')){window.BRON='typed';voerUit(v.slice(1).trim())}
  else{const q=v.startsWith('?')?v.slice(1).trim():v;if(!q)return;window.VAN_INVOER=true;window.EXPLICIET_AI=v.startsWith('?');inp.disabled=true;window.LAATSTE_ANTW=null;await vraagAI(q);window.VAN_INVOER=false;inp.disabled=false;inp.focus();stelRunVraag(window.LAATSTE_ANTW);}
});
