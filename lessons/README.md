# The DBash lesson pack

The lessons are in [`src/js/lessons.js`](../src/js/lessons.js). They are plain data that DBash runs itself (see [`src/js/learn.js`](../src/js/learn.js)), with or without an AI.

**Why fixed lessons, and not lessons an AI makes up?** A small local AI can be confidently wrong, and a beginner cannot tell. Fixed lessons are written once, checked, and tested for real in bash by `npm test`. The AI still helps: it gets the current step as context, so it explains *that* step in other words and gives hints. It is told never to invent other exercises.

## How a lesson runs

1. `learn 3` starts lesson 3. DBash runs its `setup` (practice files in `~/DBash/Learn/l3`) and shows the `intro`.
2. For every step it shows the `title`, the `explain` text and the `task`.
3. The user types a command. DBash runs it in the real terminal, then checks it against the step's `check`:
   - a command that does not look like an attempt at this step gets a friendly "not the exercise" and does not count. It counts as an attempt when it matches `typed`, or, without `typed`, when its first word is the same as in `answer`;
   - a wrong attempt gets "Not yet" with the reason, and the `hint`. From the second try on, it also points to 👁 SHOW ME, which puts `answer` in the prompt;
   - a right attempt shows `done` and goes to the next step.
4. After the last step comes the `quiz` (type a, b or c), then the `cheatsheet`. The cheat sheet goes into the user's command book, and the lesson is marked done.

## Format

```js
{
  id: 'reading-files',                 // unique, never change it once released
  title: 'Reading files',
  topics: 'cat, head, tail, grep …',   // one line, shown as a tooltip and given to the AI
  intro: 'What this lesson is about, in 1 to 3 sentences.',
  setup: 'L=$HOME/DBash/Learn/l3; rm -rf "$L"; mkdir -p "$L"; …',   // optional, bash
  steps: [
    {
      title: 'Find lines',
      explain: '`grep` shows only the lines that contain a word …',   // `code`, **bold**, *italic*, \n
      task: 'Find the errors: `grep ERROR app.log`',
      answer: 'grep ERROR app.log',      // what 👁 SHOW ME puts in the prompt
      check: { typed: '^grep\\b.*ERROR', out: 'ERROR' },
      hint: 'grep, the word ERROR, the file name.',
      done: 'Only the ERROR lines are left.'
    }
  ],
  quiz: [ { q: 'Question?', options: ['a', 'b', 'c'], answer: 1, why: 'Short reason.' } ],
  cheatsheet: [ ['grep WORD FILE', 'only the lines with WORD'] ]
}
```

### The check

A step passes when **all** parts of its `check` pass:

| part | meaning |
|------|---------|
| `typed` | regex on the command the user typed |
| `ok` | `true` (default): exit code 0 · `false`: the command must fail · `null`: do not care |
| `out` | regex on the output (colours removed) |
| `pwd` | regex on the current folder, with your home folder written as `~` (e.g. `'^~/DBash/Learn/l1$'`) |
| `shell` | a bash test that DBash runs after the command; exit code 0 = passed. Use `$HOME`, never `~` or sudo |

Every step needs at least one of `typed`, `pwd` or `shell`. Prefer checking the **result** (`shell`, `pwd`, `out`) over the exact words (`typed`): there are often several right ways to do something.

## Rules for lessons

- **Write in plain English.** Short sentences, one new idea per step, and explain every word of a command the first time it appears.
- **Practise in `~/DBash/Learn/lN` only.** `setup` may only touch that folder, and the test checks this.
- **Avoid changing the system.** If a lesson really needs sudo, install something tiny and remove it again in the same lesson, like lesson 5 does with `cowsay`.
- **Read-only steps are the best steps** for things like services, logs and disks.
- No full-screen programs in a step's check, except to open and close them (`less`, `nano`).
- 5 to 9 steps, 3 quiz questions and 4 to 8 cheat sheet lines per lesson.

## Testing

```bash
npm test
```

`tests/lessons.test.js` checks the format. It also runs every step that needs no sudo or network in a real bash shell with a temporary home folder, and the step's checks must pass. Steps with `sudo`, `apt`, `systemctl`, `journalctl` and the like are skipped there. Try those yourself in DBash.
