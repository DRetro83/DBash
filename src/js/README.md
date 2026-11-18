# src/js: the screen of DBash

Plain JavaScript, no framework and no build step. The files are loaded in this order (see `../index.html`);
they share one global scope, so a later file can use what an earlier file defines.

| file | what is in it |
|------|---------------|
| `lessons.js` | the lesson pack: plain data (see `../../lessons/README.md`) |
| `core.js` | settings, storage, the terminal screen: lines, colours, copy and paste |
| `files.js` | file cards: the AI proposes a whole file, you see the difference |
| `web.js` | reader mode and web search |
| `ai.js` | the AI: prompt layers, roles, memory, asking a question |
| `input.js` | the prompt: what you type, DBash commands, keys, Tab |
| `chats.js` | conversations and their folders |
| `models.js` | downloads, the models folder, Hugging Face, model updates |
| `run.js` | running commands: risk labels, y/n questions, RUN ALL, backup, explain |
| `book.js` | log book, first-run wizard, command book, aliases |
| `start.js` | start-up |
| `demo.js` | **browser preview only**: simulated commands and demo answers |
| `real.js` | **inside the app only**: replaces the simulated parts with the real backend (`../../src-tauri/src/main.rs`) |
| `learn.js` | runs the lessons, checks what you type (Teacher, Coach, Explain) |
| `splash.js` | the loading screen |

The files up to `start.js` work on their own in a browser: that is the preview. `real.js` swaps
functions such as `voerUit` (run a command) for real ones when `window.__TAURI__` exists.

Many names are Dutch: `regel` = a line on the screen, `voerUit` = run, `vraagAI` = ask the AI,
`bewaar` = save, `laad` = load, `toon` = show, `kaart` = card, `les` = lesson, `stap` = step.
New code may use English names.
