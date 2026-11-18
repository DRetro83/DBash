# Contributing to DBash

Thank you! The most useful thing you can add is **a better lesson**: a clearer step, a better hint, a check that catches more mistakes, or a whole new lesson. See [lessons/README.md](lessons/README.md).

## Before you start

```bash
npm ci
npm test                                        # lesson pack + screen
(cd src-tauri && cargo test -- --test-threads=1)
python3 scripts/build-preview.py                # dist/DBash-preview.html, open it in a browser
npm run dev                                     # the real app, with hot reload of src/
```

## Rules of the house

- **Safety first.** DBash never runs a command by itself, never saves the sudo password, and asks before every change to the system. Pull requests that weaken this are not merged.
- **Plain English** in the screen and in the lessons: short sentences, one idea at a time, no jargon without an explanation. The people who use DBash are often new to Linux.
- **No new network traffic** without a setting for it. DBash must work offline.
- **Small pull requests**, one thing at a time, with a line in [CHANGELOG.md](CHANGELOG.md).
- The code has no framework and no build step on purpose: plain HTML, CSS and JavaScript in `src/`, Rust in `src-tauri/`. Many names are Dutch; new code may use English names.

## Reporting a bug

Use the issue template. Include the lines DBash showed (or a screenshot), your Linux version and your desktop. Do **not** paste passwords or personal files.
