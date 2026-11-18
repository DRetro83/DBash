/* DBash: the lesson engine (runs the lesson pack of lessons.js) and the checks of typed commands.
   Loaded last, after real.js. Works with and without AI, in the app and in the browser preview.
   - Teacher role + a lesson: DBash shows each step, checks what you type, then a quiz and a cheat sheet.
   - Coach role: the AI checks what you type. Explain role: the AI explains it in one line.  */
(function () {
  const PAK = window.DBASH_LESSONS || { lessons: [] };
  const LES = PAK.lessons;
  const ECHT = !!window.__TAURI__;

  S.les = Object.assign({ nu: 0, stap: 0, klaar: [], fout: 0, actief: false }, S.les || {});
  const lesActief = () => !!(S.les.actief && S.rol === 'teacher' && LES[S.les.nu - 1]);
  const huidige = () => LES[S.les.nu - 1];
  const stapNu = () => { const L = huidige(); return L && L.steps[S.les.stap] };
  window.lesActief = lesActief;

  /* ---------- small helpers ---------- */
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // `code`, **bold**, *italic*, new lines; nothing inside `code` is touched (so *.txt stays *.txt)
  const opmaakLes = t => String(t).split(/(`[^`]+`)/).map(d => /^`[^`]+`$/.test(d) ? '<code>' + esc(d.slice(1, -1)) + '</code>'
    : esc(d).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>')).join('').replace(/\n/g, '<br>');
  const regelOpmaak = (t, cls) => { const r = regel('', cls); r.innerHTML = opmaakLes(t); return r };
  const kaal = t => String(t).replace(/[`*]/g, '');
  const kortMap = () => { const m = window.HUIDIGE_MAP || '', h = window.THUIS || ''; return h && (m === h || m.startsWith(h + '/')) ? '~' + m.slice(h.length) : m };
  const eersteWoord = s => String(s).trim().split(/\s+/)[0];
  const regex = r => { try { return new RegExp(r) } catch (e) { return /$^/ } };
  const knop = (tekst, f, titel) => { const b = document.createElement('button'); b.className = 'lesknop'; b.textContent = tekst; if (titel) b.title = titel; b.onclick = e => { e.stopPropagation(); f(b) }; return b };

  /* ---------- what the AI gets to know about the lesson ---------- */
  window.lesContext = function () {
    if (!lesActief()) return '';
    const L = huidige(), st = stapNu();
    if (!st) return ' DBash is running lesson ' + S.les.nu + ' "' + L.title + '" and the user is at the quiz of this lesson: do not give the answers away, explain the idea instead.';
    return ' DBash runs a fixed lesson from its lesson pack and checks the exercises itself. Lesson ' + S.les.nu + ' "' + L.title + '", step ' + (S.les.stap + 1) + ' of ' + L.steps.length + ' "' + st.title + '". The step teaches: ' + kaal(st.explain) + ' The exercise: ' + kaal(st.task) + ' The right command is `' + st.answer + '`: give it only when the user asks for the answer. Help with this step only: explain, give a hint, answer questions. Never invent other exercises and never move on to the next step; DBash does that when its check passes. Practice files are in ~/DBash/Learn/l' + S.les.nu + '.';
  };

  /* ---------- lesson mode: practice-folder commands without sudo need no confirmation card ---------- */
  window.lesOefenOk = function (c, r) {
    if (!lesActief() || r !== 'sudo' || /\bsudo\b/.test(c)) return false;
    if (!/^~\/DBash\/Learn(\/|$)/.test(kortMap())) return false;
    return !/(^|[\s=<>|;&])(\/|~)|\.\./.test(c);       // only paths inside the folder you are in
  };

  /* ---------- the list of lessons ---------- */
  window.toonLessen = function () {
    regel('📚 DBash course · ' + LES.length + ' lessons · practice folder ' + PAK.folder + ' · works without AI', 'c-info');
    LES.forEach((L, i) => {
      const n = i + 1, klaar = S.les.klaar.includes(n), bezig = S.les.nu === n && S.les.actief;
      const k = regel('', 'l-sys'), r = document.createElement('div'); r.className = 'lesrij';
      const tt = document.createElement('span'); tt.className = 'lt' + (klaar ? ' klaar' : bezig ? ' nu' : '');
      tt.textContent = (klaar ? '✓ ' : bezig ? '▸ ' : '  ') + String(n).padStart(2) + '. ' + L.title + '  (' + L.steps.length + ' steps)'; tt.title = L.topics;
      const st = knop(bezig ? '▶ CONTINUE' : klaar ? '↻ AGAIN' : '▶ START', () => startLes(n));
      const kl = knop(klaar ? '✗ NOT DONE' : '✓ DONE', b => {
        S.les.klaar = klaar ? S.les.klaar.filter(y => y !== n) : S.les.klaar.concat(n); bewaar(); toonRollen();
        b.textContent = S.les.klaar.includes(n) ? '✗ NOT DONE' : '✓ DONE'; tt.textContent = (S.les.klaar.includes(n) ? '✓ ' : '  ') + String(n).padStart(2) + '. ' + L.title + '  (' + L.steps.length + ' steps)' }, 'Mark the lesson as done or not done');
      r.append(tt, st, kl); k.appendChild(r);
    });
    regel('   ' + S.les.klaar.length + ' of ' + LES.length + ' done. Type  learn N  to start lesson N,  learn stop  to pause. In a lesson you type the commands yourself; DBash checks them.', 'l-sys');
  };

  /* ---------- start, show a step, stop ---------- */
  window.startLes = async function (n, opnieuw) {
    const L = LES[n - 1]; if (!L) { regel('There is no lesson ' + n + '. Type learn for the list.', 'l-warn'); return }
    const doorgaan = !opnieuw && S.les.nu === n && S.les.actief && S.les.stap > 0 && S.les.stap <= L.steps.length;
    if (S.rol !== 'teacher') zetRol('teacher', true);
    S.les.nu = n; S.les.actief = true; S.les.fout = 0; if (!doorgaan) S.les.stap = 0; bewaar(); toonRollen();
    promptRegel('📚 lesson ' + n + ': ' + L.title);
    regel('📚 LESSON ' + n + ' · ' + L.title.toUpperCase() + (doorgaan ? '  ·  continuing at step ' + (S.les.stap + 1) : ''), 'c-acc');
    if (!doorgaan) {
      regel(L.intro, 'l-uit');
      if (L.setup && window.shellStil) {
        const o = await shellStil('mkdir -p "$HOME/DBash/Learn" && ' + L.setup).catch(e => ({ code: 1, stderr: String(e) }));
        regel(o.code === 0 ? '   📁 Practice files are ready in ' + PAK.folder + '/l' + n + (/rm -rf/.test(L.setup) ? ' (made fresh for this lesson)' : '') : '   ⚠ Could not prepare the practice files: ' + (o.stderr || '').trim(), o.code === 0 ? 'l-sys' : 'l-warn');
      } else if (L.setup) regel('   [preview] The app makes practice files in ' + PAK.folder + '/l' + n + '.', 'l-sys');
      regel('   Type each command yourself in the prompt and press Enter. 💡 HINT and 👁 SHOW ME help when you are stuck.' + (aiKlaar ? ' Ask the AI anything in between.' : ''), 'l-sys');
    }
    if (S.les.stap >= L.steps.length) return quiz();
    toonStap();
  };
  window.stopLes = function () {
    if (!S.les.actief) { regel('No lesson is running.', 'l-sys'); return }
    S.les.actief = false; bewaar(); toonRollen();
    regel('⏸ Lesson ' + S.les.nu + ' paused at step ' + (S.les.stap + 1) + '. Type  learn ' + S.les.nu + '  to continue.', 'l-sys');
  };
  function toonStap() {
    const L = huidige(), st = stapNu(); if (!st) return quiz();
    const kop = regel('', 'leskop'); kop.textContent = 'L' + S.les.nu + ' · STEP ' + (S.les.stap + 1) + '/' + L.steps.length + ' · ' + st.title.toUpperCase();
    const k = regel('', 'l-ai lesstap'); const u = document.createElement('div'); u.innerHTML = opmaakLes(st.explain); k.appendChild(u);
    const t = document.createElement('div'); t.className = 'lestaak'; t.innerHTML = '▸ ' + opmaakLes(st.task); k.appendChild(t);
    const rij = document.createElement('div'); rij.className = 'lesknoppen';
    rij.append(
      knop('💡 HINT', () => regelOpmaak('💡 ' + st.hint, 'l-tl'), 'A small hint'),
      knop('👁 SHOW ME', () => { inp.value = st.answer; inp.focus(); regel('👁 The command is in the prompt. Read it, then press Enter to run it.', 'l-sys') }, 'Put the answer in the prompt'),
      knop('◆ ASK AI', () => vraagOverStap(), 'Let the AI explain this step in other words'),
      knop('⏭ SKIP', () => { S.les.stap++; S.les.fout = 0; bewaar(); toonStap() }, 'Go to the next step'),
      knop('⏸ PAUSE', () => stopLes(), 'Pause the lesson (learn ' + S.les.nu + ' continues)'));
    k.appendChild(rij); inp.focus(); onderaan();
  }
  async function vraagOverStap() {
    if (!aiKlaar && !window.DEMO_AI) { regel('◆ Load the AI first (⚙ → AI → LOAD AI). The lesson itself works without AI.', 'l-warn'); return }
    const st = stapNu(); if (!st || inp.disabled) return;
    promptRegel('◆ explain this step: ' + st.title); inp.disabled = true; window.LAATSTE_ANTW = null;
    await vraagAI('Explain this step of my lesson in other words, with a small everyday example: "' + st.title + '". Do not give me the full command.');
    inp.disabled = false; inp.focus();
  }

  /* ---------- the check after a typed command ---------- */
  async function lesCheck(c, res, uit) {
    const st = stapNu(); if (!st) return;
    const k = st.check || {}; c = c.trim();
    const poging = k.typed ? regex(k.typed).test(c) : eersteWoord(c) === eersteWoord(st.answer);
    if (!poging) { regel('   ↳ Not the exercise of this step (trying things is fine). The exercise: ' + kaal(st.task), 'l-sys'); return }
    let reden = null;
    const wilOk = k.ok === undefined ? true : k.ok;
    if (!ECHT) { /* preview: only the typed command is checked */ if (!window.LES_PREVIEW_GEMELD) { window.LES_PREVIEW_GEMELD = true; regel('   [preview] Here only the typed command is checked; the app also checks the real result.', 'l-sys') } }
    else if (res.scherm && wilOk === true && !res.ok) reden = 'the program did not close normally.';
    else if (!res.scherm && wilOk === true && !res.ok) reden = 'the command failed. Read the error above: the last part usually says why.';
    else if (wilOk === false && res.ok) reden = 'this command was supposed to fail, to show you the error.';
    else if (k.out && !regex(k.out).test(uit)) reden = 'the output is not what this step expects.';
    else if (k.pwd && !regex(k.pwd).test(kortMap())) reden = 'you are in ' + (kortMap() || '?') + ', and this step wants you somewhere else.';
    else if (k.shell && window.shellStil) {
      const o = await shellStil(k.shell).catch(() => ({ code: 1 }));
      if (o.code !== 0) reden = 'DBash looked, and the result is not there yet.';
    }
    if (reden) {
      S.les.fout = (S.les.fout || 0) + 1; bewaar();
      regel('✗ Not yet: ' + reden, 'l-warn');
      regelOpmaak(S.les.fout >= 2 ? '💡 ' + st.hint + '   (👁 SHOW ME puts the answer in the prompt)' : '💡 ' + st.hint, 'l-tl');
      return;
    }
    leerKennis(c, true);
    regelOpmaak('✓ ' + (st.done || 'Right!'), 'l-ok');
    S.les.stap++; S.les.fout = 0; bewaar();
    setTimeout(() => S.les.stap < huidige().steps.length ? toonStap() : quiz(), 250);
  }

  /* ---------- quiz and cheat sheet ---------- */
  async function quiz() {
    const L = huidige(), n = S.les.nu, vragen = L.quiz || [];
    regel('🧠 QUIZ · lesson ' + n + ' · ' + vragen.length + ' questions. Type the letter of your answer.', 'leskop');
    let goed = 0;
    for (let i = 0; i < vragen.length; i++) {
      const v = vragen[i], letters = v.options.map((_, j) => String.fromCharCode(97 + j));
      const k = regel('', 'l-ai lesstap'); const q = document.createElement('div'); q.innerHTML = '<b>' + (i + 1) + '/' + vragen.length + '</b> ' + opmaakLes(v.q); k.appendChild(q);
      v.options.forEach((o, j) => { const d = document.createElement('div'); d.innerHTML = '&nbsp;&nbsp;<b>' + letters[j] + '</b>) ' + opmaakLes(o); k.appendChild(d) });
      const a = await vraagJN('Your answer (' + letters.join('/') + '): ', { keys: letters, uitleg: letters.join(', ') });
      if (a === null) { regel('⏸ Quiz stopped. Type  learn ' + n + '  to do it again.', 'l-sys'); return }
      const ok = letters.indexOf(a) === v.answer; if (ok) goed++;
      regelOpmaak((ok ? '✓ Right. ' : '✗ It is ' + letters[v.answer] + ') ' + v.options[v.answer] + '. ') + v.why, ok ? 'l-ok' : 'l-warn');
    }
    regel('🧠 ' + goed + ' of ' + vragen.length + ' right' + (goed === vragen.length ? '. Perfect!' : '.'), goed === vragen.length ? 'l-ok' : 'l-tl');
    const el = regel('', 'l-ai');
    el.appendChild(spiekKaart((L.cheatsheet || []).map(([c, d]) => c + ' — ' + d).join('\n')));
    S.les.actief = false; S.les.stap = 0; bewaar(); toonRollen();
    regel('🎉 Lesson ' + n + ' done!' + (LES[n] ? '  Next: type  learn ' + (n + 1) + '  (' + LES[n].title + ').' : '  That was the last lesson. Well done!'), 'c-acc');
    onderaan();
  }

  /* ---------- after every command you typed yourself ---------- */
  const oudVoerUit = window.voerUit;
  const wachtGetypt = new Set();
  window.voerUit = async function (c, ...rest) {
    const getypt = window.BRON === 'typed' || wachtGetypt.has(c);
    if (getypt) window.BRON = 'typed';
    const res = await oudVoerUit(c, ...rest);
    if (!getypt) return res;
    window.BRON = null;
    if (res && res.wacht) { wachtGetypt.add(c); return res }   // a confirmation card: the run comes later
    wachtGetypt.delete(c);
    if (!res || typeof res !== 'object') return res;           // cancelled
    const uit = schoonTerm(zonderAnsi(res.out || ''));
    if (lesActief()) setTimeout(() => lesCheck(c, res, uit), 30);
    else if (res.scherm) { /* full-screen program: nothing to check */ }
    else if (S.rol === 'coach' || S.rol === 'teacher') setTimeout(() => coachCheck(c, uit, res.ok), 50);
    else if (S.rol === 'explain') setTimeout(() => uitlegGetypt(c, uit, res.ok), 50);
    return res;
  };

  // in a lesson, what you type for the exercise is always run as a command (also name=World, ./hello.sh, for …)
  const oudVraag = window.vraagAI;
  window.vraagAI = async function (q, ...rest) {
    if (window.VAN_INVOER && !window.EXPLICIET_AI && lesActief()) {
      const st = stapNu(), t = q.trim();
      if (st && !/\n/.test(t) && ((st.check && st.check.typed && regex(st.check.typed).test(t)) || eersteWoord(t) === eersteWoord(st.answer))) {
        window.VAN_INVOER = false; window.BRON = 'typed'; return voerUit(t);
      }
    }
    return oudVraag(q, ...rest);
  };

  /* ---------- styles ---------- */
  const css = document.createElement('style');
  css.textContent = '.leskop{color:var(--accent);letter-spacing:1px;margin-top:6px}.lesstap{border-left:2px solid var(--accent);padding-left:10px}.lestaak{margin-top:6px;color:var(--fg)}.lestaak code,.lesstap code{color:var(--accent)}' +
    '.lesknoppen{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.lesknop{font:inherit;font-size:.85em;background:none;color:var(--fg);border:1px solid var(--dim);padding:1px 8px;cursor:pointer}.lesknop:hover{border-color:var(--accent);color:var(--accent)}';
  document.head.appendChild(css);

  // a lesson that was running when DBash closed
  if (lesActief()) setTimeout(() => regel('📚 Lesson ' + S.les.nu + ' is still open (step ' + (S.les.stap + 1) + '). Type  learn ' + S.les.nu + '  to continue, or  learn stop.', 'l-tl'), 3000);
})();
