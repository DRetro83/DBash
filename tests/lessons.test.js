// Checks the lesson pack (src/js/lessons.js):
//  1. every lesson and step is complete, every regex compiles, the answer passes its own `typed` check
//  2. every step that needs no sudo/network really works: the answers run in bash with a temporary
//     HOME, and the checks of the step (ok, out, pwd, shell) must pass, exactly like in DBash.
// Run: npm test
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const window = {};
new Function('window', fs.readFileSync(process.env.DBASH_LESSONS_FILE || path.join(__dirname, '../src/js/lessons.js'), 'utf8'))(window);
const PAK = window.DBASH_LESSONS;

test('lesson pack is complete and consistent', () => {
  assert.ok(PAK && Array.isArray(PAK.lessons) && PAK.lessons.length >= 10);
  const ids = new Set();
  PAK.lessons.forEach((L, n) => {
    const w = `lesson ${n + 1}`;
    for (const k of ['id', 'title', 'topics', 'intro']) assert.ok(L[k], `${w}: ${k} missing`);
    assert.ok(!ids.has(L.id), `${w}: duplicate id`); ids.add(L.id);
    assert.ok(L.steps.length >= 5, `${w}: too few steps`);
    L.steps.forEach((s, i) => {
      const ws = `${w} step ${i + 1}`;
      for (const k of ['title', 'explain', 'task', 'answer', 'hint', 'check']) assert.ok(s[k] !== undefined && s[k] !== '', `${ws}: ${k} missing`);
      const c = s.check;
      assert.ok(c.typed || c.pwd || c.shell, `${ws}: a check needs typed, pwd or shell`);
      for (const k of ['typed', 'out', 'pwd']) if (c[k]) new RegExp(c[k]);
      if (c.typed) assert.match(s.answer, new RegExp(c.typed), `${ws}: the answer does not pass its own typed check`);
      if (c.shell) assert.ok(!/\bsudo\b/.test(c.shell), `${ws}: checks never use sudo`);
    });
    assert.ok(L.quiz.length >= 3, `${w}: quiz`);
    L.quiz.forEach((q, i) => assert.ok(q.options[q.answer] !== undefined && q.why, `${w} quiz ${i + 1}`));
    assert.ok(L.cheatsheet.length >= 4, `${w}: cheat sheet`);
    if (L.setup) assert.match(L.setup, new RegExp('\\$HOME/DBash/Learn/l' + (n + 1)), `${w}: setup must stay in its own practice folder`);
  });
});

// steps that need root, the network, a full-screen program or a desktop: not run here
const NIET_HIER = /^(sudo|apt|apt-cache|dpkg|cowsay|less|journalctl|systemctl|dmesg|lsblk|findmnt)\b|\/etc\/fstab/;
// a full-screen editor step: the test writes the file itself
const VERVANG = { 'nano greet.sh': 'printf \'#!/bin/bash\\nname="$1"\\necho "Hello, $name!"\\n\' > greet.sh' };

function shell(home) {
  const sh = spawn('bash', ['--noprofile', '--norc'], { cwd: home, env: { HOME: home, PATH: process.env.PATH, USER: 'tester', LANG: 'C.UTF-8' } });
  let buf = '', wacht = null;
  const lees = d => { buf += d; const m = /\x1e(-?\d+):([^\x1f]*)\x1f/.exec(buf); if (m && wacht) { const uit = buf.slice(0, m.index); buf = buf.slice(m.index + m[0].length); const w = wacht; wacht = null; w({ code: +m[1], pwd: m[2], out: uit }) } };
  sh.stdout.on('data', d => lees(d.toString())); sh.stderr.on('data', d => lees(d.toString()));
  sh.stdin.write('exec 2>&1\n');
  return {
    run: cmd => new Promise(r => { wacht = r; sh.stdin.write(cmd + '\n__s=$?; printf "\\036%s:%s\\037" "$__s" "$PWD"; (exit $__s)\n') }),
    stop: () => { sh.stdin.end(); sh.kill() }
  };
}

for (const [n, L] of PAK.lessons.entries()) {
  test(`lesson ${n + 1} (${L.title}) works for real`, async () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'dbash-les-'));
    const env = { HOME: home, PATH: process.env.PATH, USER: 'tester' };
    if (L.setup) { const r = spawnSync('bash', ['-c', 'mkdir -p "$HOME/DBash/Learn" && ' + L.setup], { env }); assert.strictEqual(r.status, 0, 'setup: ' + r.stderr) }
    const sh = shell(home);
    try {
      let gedaan = 0;
      for (const [i, st] of L.steps.entries()) {
        const cmd = VERVANG[st.answer] || st.answer;
        if (!VERVANG[st.answer] && NIET_HIER.test(st.answer)) continue;
        const r = await sh.run(cmd);
        const k = st.check, w = `L${n + 1} step ${i + 1} "${st.answer}"`;
        const wilOk = k.ok === undefined ? true : k.ok;
        if (wilOk === true) assert.strictEqual(r.code, 0, `${w}: exit ${r.code}: ${r.out}`);
        if (wilOk === false) assert.notStrictEqual(r.code, 0, `${w}: should fail`);
        if (k.out) assert.match(r.out, new RegExp(k.out), `${w}: output`);
        if (k.pwd) { const kort = r.pwd === home ? '~' : r.pwd.startsWith(home + '/') ? '~' + r.pwd.slice(home.length) : r.pwd; assert.match(kort, new RegExp(k.pwd), `${w}: folder ${kort}`) }
        if (k.shell) { const t = spawnSync('bash', ['-c', k.shell], { env }); assert.strictEqual(t.status, 0, `${w}: shell check failed`) }
        gedaan++;
      }
      assert.ok(gedaan >= 1 || L.steps.every(s => NIET_HIER.test(s.answer)));
    } finally { sh.stop(); spawnSync('pkill', ['-f', '^sleep 4242$']); fs.rmSync(home, { recursive: true, force: true }) }
  });
}
