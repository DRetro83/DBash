/* DBash · start.js: start-up. Part of the shared app logic (see js/README.md). */
/* ---------- start-up ---------- */
(async()=>{
  pasToe();
  await typ('DBASH v'+DBASH_VERSIE+' // SMART TERMINAL','c-acc');
  await typ('(c) 2026 DBash  //  '+(S.sys_gpu||'').replace(/^AMD Radeon /,'').replace(/\s*\(.*\)/,'').toUpperCase()+'  //  '+(S.sys_cpu||'').replace(/^AMD /,'').toUpperCase(),'l-sys');
  await typ('SYSTEM OK ... AI: NOT LOADED','l-sys');
  {const b=out.children[out.children.length-2];b.innerHTML='SYSTEM <span class="c-ok">OK</span> ... AI: <span class="c-warn">NOT LOADED</span>';}
  regel('');
  regel('Just type a question for the AI (Shift+Enter = new line). Type "help" for commands, "!command" to run a command.','l-sys');
  regel('Top right: ⚙ for settings, the speech bubble for your conversations.','l-sys');
  inp.focus();
  bouwModelWissel();toonGeheugen(geheugenSchat());
  if(!S.wizardKlaar)setTimeout(()=>wizard(0),400);
  if(S.updstart)setTimeout(()=>checkUpdates(true),1500);
})();
