// Smoke tests of the screen (src/) in jsdom:
//  - the browser preview loads without errors
//  - the app mode loads with a fake backend (window.__TAURI__), and a lesson runs:
//    DBash shows the step, runs what you type in the (fake) terminal, checks it and moves on
//  - the self-update finds a newer GitHub release and refuses one without checksums
// Run: npm test
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const SRC = path.join(__dirname, '../src');
function pagina() {
  // inline the local scripts and styles, skip xterm (not needed here)
  return fs.readFileSync(path.join(SRC, 'index.html'), 'utf8')
    .replace(/<script src="vendor\/[^"]+"><\/script>/g, '')
    .replace(/<link rel="stylesheet" href="[^"]+">/g, '')
    .replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, f) => '<script>' + fs.readFileSync(path.join(SRC, f), 'utf8').replace(/<\/script>/g, '<\\/script>') + '</script>');
}
const wacht = ms => new Promise(r => setTimeout(r, ms));

function maak(tauri, extra) {
  const fouten = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => fouten.push(String(e && (e.stack || e.message) || e)));
  const dom = new JSDOM(pagina(), {
    runScripts: 'dangerously', url: 'http://localhost/', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.Element.prototype.scrollIntoView = function () {};
      Object.assign(w, { ReadableStream, TextEncoder, TextDecoder, ResizeObserver: class { observe() {} disconnect() {} } });
      w.requestAnimationFrame = f => setTimeout(f, 0); w.cancelAnimationFrame = clearTimeout;
      w.localStorage.setItem('debhelp', JSON.stringify(Object.assign({ wizardKlaar: true, type: false, appupd: false, splash: false }, extra || {})));
      w.addEventListener('error', e => fouten.push(String(e.error && e.error.stack || e.message)));
      if (tauri) w.__TAURI__ = tauri(w);
    }
  });
  return { dom, w: dom.window, d: dom.window.document, fouten };
}
const tekst = d => d.getElementById('out').textContent;
async function typ(w, d, v) {
  const inp = d.getElementById('in'); inp.value = v;
  inp.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await wacht(250);
}

test('browser preview loads without errors', async () => {
  const { d, fouten } = maak(null);
  await wacht(800);
  assert.deepStrictEqual(fouten, []);
  assert.match(d.getElementById('title').textContent, /DBASH/);
  assert.ok(d.getElementById('bk'), 'the BACKUP box is in the footer');
});

test('browser preview: a lesson works without AI and without backend', async () => {
  const { w, d, fouten } = maak(null);
  await wacht(800);
  await typ(w, d, 'learn 2');
  assert.match(tekst(d), /LESSON 2 · FILES AND FOLDERS/);
  await typ(w, d, 'cd ~/DBash/Learn/l2');
  await wacht(400);
  assert.match(tekst(d), /STEP 2\/9 · MAKE A FOLDER/);
  await typ(w, d, 'ls');                              // not the exercise
  await wacht(300);
  assert.match(tekst(d), /Not the exercise of this step/);
  assert.deepStrictEqual(fouten, []);
});

// a fake backend: one bash-like terminal with a current folder and a few files
function nepBackend(log) {
  return w => {
    const L = {}; const emit = (n, p) => (L[n] || []).forEach(f => f({ payload: p }));
    let map = '/home/tester'; const bestanden = new Set();
    const pty = cmd => {
      let uit = '', code = 0;
      const c = cmd.trim();
      if (/^cd\s*$|^cd ~\/?$/.test(c)) map = '/home/tester';
      else if (/^cd\s+~\//.test(c)) map = '/home/tester/' + c.replace(/^cd\s+~\//, '').replace(/\/$/, '');
      else if (/^cd\s+\.\.$/.test(c)) map = map.replace(/\/[^/]+$/, '');
      else if (/^cd\s+/.test(c)) map = map + '/' + c.replace(/^cd\s+/, '');
      else if (c === 'pwd') uit = map + '\r\n';
      else if (/^ls\s+-la/.test(c)) uit = '.\r\n..\r\n.secret\r\ndocs\r\nphotos\r\nreadme.txt\r\n';
      else if (/^ls\b/.test(c)) uit = 'docs  photos  readme.txt\r\n';
      else if (/^mkdir\s+(\S+)/.test(c)) bestanden.add(c.split(/\s+/)[1]);
      else { uit = 'bash: ' + c.split(' ')[0] + ': command not found\r\n'; code = 127 }
      setTimeout(() => emit('pty-data', { data: uit + '\x1eDBASH:' + code + ':' + map + '\x1f' }), 10);
    };
    return {
      event: { listen: async (n, f) => { (L[n] = L[n] || []).push(f); return () => {} } },
      core: { invoke: async (cmd, a) => {
        log.push([cmd, a]);
        switch (cmd) {
          case 'system_info': return { user: 'tester', host: 'debian', home: '/home/tester', os: 'Debian GNU/Linux 13 (trixie)', desktop: 'KDE Plasma', gpu: 'AMD Radeon RX 9070 XT', vram_gb: 16, cpu: 'Ryzen', ram_gb: 31, root_fs: 'ext4', version: '0.4.0', sh_path: '/home/tester/dbash-0.4.0.sh' };
          case 'pty_start': setTimeout(() => emit('pty-data', { data: '\x1eDBASH:0:/home/tester\x1f' }), 20); return null;
          case 'pty_run': pty(a.cmd); return null;
          case 'is_command': return ['pwd', 'ls', 'cd', 'mkdir'].includes(a.word);
          case 'is_gui': return false;
          case 'list_models': return w.NEP_MODELLEN || [];
          case 'detect_browsers': return [];
          case 'sudo_needs_password': return true;
          case 'model_status': return { running: false, ready: false, log_tail: '' };
          case 'fetch_url': {
            if (/\/api\/models\/me\/model\/tree/.test(a.url)) return { status: 200, url: a.url, content_type: 'application/json', body: JSON.stringify([{ type: 'file', path: 'Good-Model-Q4.gguf', size: 135, lfs: { size: w.NEP_GROOTTE || 1000 } }]) };
            if (/releases\/latest/.test(a.url)) return { status: 200, url: a.url, content_type: 'application/json', body: JSON.stringify(w.NEP_RELEASE || { tag_name: 'v0.4.0', assets: [] }) };
            return { status: 404, url: a.url, content_type: '', body: '' };
          }
          case 'run_command': {
            const c = a.cmd;
            if (/test -d "\$HOME\/DBash\/Learn\/l2\/notes"/.test(c)) return { code: bestanden.has('notes') ? 0 : 1, stdout: '', stderr: '' };
            return { code: 0, stdout: '', stderr: '' };
          }
          default: return null;
        }
      } }
    };
  };
}

test('app mode: a lesson runs and checks what you type', async () => {
  const log = [];
  const { w, d, fouten } = maak(nepBackend(log));
  await wacht(1200);
  assert.deepStrictEqual(fouten, []);
  await typ(w, d, 'learn 1');
  await wacht(300);
  assert.match(tekst(d), /LESSON 1 · MOVING AROUND/);
  assert.ok(log.some(([c, a]) => c === 'run_command' && /DBash\/Learn\/l1/.test(a.cmd)), 'practice files are made');
  assert.match(tekst(d), /STEP 1\/7 · WHERE AM I\?/);

  await typ(w, d, 'pwd');                         // right
  await wacht(400);
  assert.match(tekst(d), /That is your current folder/);
  assert.match(tekst(d), /STEP 2\/7/);

  await typ(w, d, 'ls ~/DBash/Learn/l1');           // right (output has docs)
  await wacht(400);
  assert.match(tekst(d), /STEP 3\/7/);

  await typ(w, d, 'cd ~/DBash');                    // wrong folder
  await wacht(400);
  assert.match(tekst(d), /Not yet: you are in ~\/DBash/);
  await typ(w, d, 'cd ~/DBash/Learn/l1');           // right
  await wacht(400);
  assert.match(tekst(d), /STEP 4\/7/);
  assert.match(d.getElementById('rolknop').textContent, /TEACHER/);
  assert.match(w.eval('lesContext()'), /step 4 of 7/, 'the AI knows the step');

  await typ(w, d, 'learn stop');
  assert.match(tekst(d), /paused at step 4/);
  assert.deepStrictEqual(fouten, []);
});

test('app mode: update check finds a newer release, but needs checksums', async () => {
  const log = [];
  const { w, d, fouten } = maak(nepBackend(log));
  await wacht(1200);
  w.NEP_RELEASE = { tag_name: 'v9.9.9', body: '- better lessons', assets: [{ name: 'dbash-9.9.9.sh', browser_download_url: 'https://github.com/x/y/releases/download/v9.9.9/dbash-9.9.9.sh' }] };
  await typ(w, d, 'update');
  await wacht(400);
  assert.match(tekst(d), /DBash 9\.9\.9 is available/);
  assert.match(tekst(d), /no dbash-9\.9\.9\.sh with a SHA256SUMS file/);
  assert.ok(!log.some(([c]) => c === 'app_update'), 'nothing is downloaded without checksums');
  w.NEP_RELEASE = { tag_name: 'v0.3.9', assets: [] };
  await typ(w, d, 'update');
  await wacht(300);
  assert.match(tekst(d), /is the newest version/);
  assert.deepStrictEqual(fouten, []);
});

test('loading screen: shows the checks, then goes away; a key skips it', async () => {
  const { w, d, fouten } = maak(null, { splash: true });
  await wacht(300);
  assert.ok(d.getElementById('splash'), 'the loading screen is there');
  assert.match(d.querySelector('#splash .spver').textContent, /version 0\.4\.\d/);
  await wacht(2200);
  const rijen = [...d.querySelectorAll('#splash .sprij')].map(r => r.textContent);
  assert.strictEqual(rijen.length, 6, rijen.join(' | '));
  assert.match(rijen[0], /\[ OK \]Terminal/);
  assert.match(rijen[4], /Lessons0 of \d+ done/);
  await wacht(1400);
  assert.ok(!d.getElementById('splash'), 'it closes by itself');

  const b = maak(null, { splash: true });
  await wacht(300);
  b.d.dispatchEvent(new b.w.KeyboardEvent('keydown', { key: 'x', bubbles: true }));
  await wacht(500);
  assert.ok(!b.d.getElementById('splash'), 'a key closes it');
  assert.strictEqual(b.d.getElementById('in').value, '', 'the key does not land in the prompt');
  assert.deepStrictEqual(fouten.concat(b.fouten), []);
});

test('app mode: a model update is only reported when the file on Hugging Face is really different', async () => {
  const log = [];
  const { w, d, fouten } = maak(nepBackend(log), { modelBron: { 'Good-Model-Q4': { repo: 'me/model', pad: 'Good-Model-Q4.gguf' } }, updstart: false });
  w.NEP_MODELLEN = [{ naam: 'Good-Model-Q4', pad: '/home/tester/DBash/Models/Good-Model-Q4.gguf', gb: 0, bytes: 1000, soort: 'gguf', map: '~/DBash/Models' },
                    { naam: 'My-Own-Model', pad: '/home/tester/DBash/Models/My-Own-Model.gguf', gb: 0, bytes: 5, soort: 'gguf', map: '~/DBash/Models' }];
  await wacht(1200);
  await typ(w, d, 'updates'); await wacht(600);
  assert.match(tekst(d), /Everything is up to date \(1 checked\)/, 'same size: no update, and your own model is not checked');
  w.NEP_GROOTTE = 2000;
  await typ(w, d, 'updates'); await wacht(600);
  assert.match(tekst(d), /Model update: Good-Model-Q4 · a different file on Hugging Face/);
  assert.ok(!/My-Own-Model ·/.test(tekst(d)));
  assert.deepStrictEqual(fouten, []);
});
