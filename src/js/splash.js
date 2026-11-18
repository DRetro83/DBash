/* DBash: the loading screen. A big pixel logo and a short list of real checks
   (terminal, AI engine, model, backup, lessons, updates), about 2 seconds at start.
   Any key or click skips it. Off: ⚙ → LOOK → "Loading screen at start". Loaded last. */
(function () {
  if (S.splash === false) return;
  const ECHT = !!window.__TAURI__;
  const t0 = Date.now();

  /* ---------- the pixel logo (8 rows, strokes 2 pixels wide) ---------- */
  const LETTERS = {
    D: ['1111100', '1111110', '1100111', '1100011', '1100011', '1100111', '1111110', '1111100'],
    B: ['1111110', '1111111', '1100011', '1111110', '1111110', '1100011', '1111111', '1111110'],
    A: ['0111110', '1111111', '1100011', '1100011', '1111111', '1111111', '1100011', '1100011'],
    S: ['0111111', '1111111', '1100000', '1111110', '0111111', '0000011', '1111111', '1111110'],
    H: ['1100011', '1100011', '1100011', '1111111', '1111111', '1100011', '1100011', '1100011']
  };
  function logoSvg(woord) {
    const P = 10, px = []; let x0 = 0;
    for (const ch of woord) { LETTERS[ch].forEach((rij, r) => [...rij].forEach((v, c) => { if (v === '1') px.push([x0 + c * P, r * P]) })); x0 += 8 * P }
    const w = x0 - P, h = 8 * P;
    const rects = (dx, dy, g) => px.map(([x, y]) => `<rect x="${x + dx - g}" y="${y + dy - g}" width="${P + 2 * g}" height="${P + 2 * g}"/>`).join('');
    return `<svg class="splogo" viewBox="-6 -6 ${w + 18} ${h + 18}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-label="DBASH">` +
      `<defs><linearGradient id="splg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${h}"><stop offset="0" stop-color="#f6d468"/><stop offset=".5" stop-color="#e0b030"/><stop offset="1" stop-color="#b8841a"/></linearGradient></defs>` +
      `<g fill="#120e09">${rects(6, 6, 2)}</g><g fill="#6b4a14">${rects(6, 6, 0)}</g><g fill="#120e09">${rects(0, 0, 2)}</g><g fill="url(#splg)">${rects(0, 0, 0)}</g></svg>`;
  }

  /* ---------- the screen ---------- */
  const el = document.createElement('div'); el.id = 'splash';
  const thuis = () => window.THUIS ? '/home/' + (S.sys_user || 'you') : '/home/you';
  el.innerHTML = logoSvg('DBASH') + `<div class="spver">version ${DBASH_VERSIE} · <span id="sppad">${ECHT ? '' : '/home/you'}</span></div><div class="splijst"></div><div class="spbalk"><i></i></div><div class="spvoet"><span class="spstat">checking<span class="spknip">_</span></span><span>Press any key to skip</span></div>`;
  const lijst = el.querySelector('.splijst'), balk = el.querySelector('.spbalk i'), stat = el.querySelector('.spstat');
  (document.querySelector('.screen') || document.body).appendChild(el);

  let weg = false;
  function sluit() {
    if (weg) return; weg = true;
    document.removeEventListener('keydown', toets, true);
    el.classList.add('weg'); setTimeout(() => el.remove(), 350);
    try { inp.focus() } catch (e) {}
  }
  function toets(e) { e.preventDefault(); e.stopPropagation(); sluit() }
  document.addEventListener('keydown', toets, true);
  el.addEventListener('click', sluit);

  /* ---------- the checks: [name, check] → [ok, text] ---------- */
  const kort = p => { const h = window.THUIS || ''; return h && (p === h || p.startsWith(h + '/')) ? '~' + p.slice(h.length) : p };
  const metTijd = (p, ms) => Promise.race([p, new Promise(r => setTimeout(() => r(null), ms))]);
  const wacht = ms => new Promise(r => setTimeout(r, ms));
  const DEMO = { Terminal: [true, 'bash 5.2 · ~'], 'AI engine': [true, 'llamafile 0.10.2'], Model: [true, 'Gemma 4 26B-A4B · GPU ✓'] };
  const CHECKS = [
    ['Terminal', async () => {
      if (!ECHT) return DEMO.Terminal;
      const o = await metTijd(shellStil('echo "$BASH_VERSION"'), 2500);
      const v = o && o.code === 0 ? (o.stdout || '').trim().replace(/\(.*$/, '') : '';
      return v ? [true, 'bash ' + v + ' · ' + (kort(window.HUIDIGE_MAP || '') || '~')] : [false, 'bash did not answer'];
    }],
    ['AI engine', async () => {
      if (!ECHT || !window.engineInfo) return DEMO['AI engine'];
      const e = await metTijd(engineInfo(), 2500);
      const heeftLf = laadModellen().some(m => /\.llamafile$/i.test(m.naam) || m.type === 'llamafile');
      if (e && e.heeft) return [true, 'llamafile' + (e.versie ? ' ' + e.versie : '')];
      return heeftLf ? [true, 'built into your .llamafile models'] : [false, 'not found · type hf to get it'];
    }],
    ['Model', async () => {
      if (!ECHT) return DEMO.Model;
      await wacht(400);                                    // the model list is read at start
      const ms = laadModellen(); const m = ms.find(x => x.naam === S.model) || ms[0];
      if (!m) return [false, 'no model yet · type hf'];
      return [true, m.naam.replace(/\.(gguf|llamafile)$/i, '').slice(0, 34) + ' · ' + (past(m.gb) ? 'GPU ✓' : 'part CPU')];
    }],
    ['Backup', async () => {
      if (window.heeftBackup && heeftBackup()) return [true, 'backup active · ⟲ ROLL BACK possible'];
      if (!ECHT) return [true, 'Timeshift ready'];
      const o = await metTijd(shellStil('command -v timeshift'), 2500);
      return o && o.code === 0 ? [true, 'Timeshift ready'] : [false, 'Timeshift not installed (optional)'];
    }],
    ['Lessons', async () => {
      const N = ((window.DBASH_LESSONS || {}).lessons || []).length, l = S.les || {};
      if (l.actief && l.nu) return [true, 'lesson ' + l.nu + ' still open · learn ' + l.nu];
      return [true, (l.klaar || []).length + ' of ' + N + ' done'];
    }],
    ['Updates', async () => [true, S.appupd === false ? 'off' : 'checked at every start']]
  ];

  (async function () {
    for (let i = 0; i < CHECKS.length && !weg; i++) {
      const [naam, f] = CHECKS[i];
      let r; try { r = await f() } catch (e) { r = [false, 'could not check'] }
      if (!r) r = [false, 'no answer'];
      const minTijd = 300 + i * 260 - (Date.now() - t0); if (minTijd > 0) await wacht(minTijd);   // a calm rhythm
      if (weg) return;
      if (i === 0) { const p = el.querySelector('#sppad'); if (ECHT) p.textContent = window.THUIS || thuis() }
      const rij = document.createElement('div'); rij.className = 'sprij';
      rij.innerHTML = `<span class="spt ${r[0] ? 'ok' : 'ww'}">${r[0] ? '[ OK ]' : '[ !! ]'}</span><span class="spn"></span><span class="spw ${r[0] ? '' : 'ww'}"></span>`;
      rij.querySelector('.spn').textContent = naam; rij.querySelector('.spw').textContent = r[1];
      lijst.appendChild(rij); requestAnimationFrame(() => rij.classList.add('zie'));
      balk.style.width = ((i + 1) / CHECKS.length * 100) + '%';
    }
    if (weg) return;
    stat.textContent = 'ready';
    await wacht(900); sluit();
  })();
})();
