# Changelog

The release workflow uses the section of a version as its release notes, and DBash shows the first lines when it offers an update. Keep them short.

## 0.4.1

- **Loading screen:** a big pixel logo and a short list of real checks at start (terminal, AI engine, model, backup, lessons, updates). Things that are missing show [ !! ], such as no model yet. Any key skips it, and ⚙ → LOOK turns it off.

## 0.4.0

- **Fixed, checked lessons.** The 10 lessons are now a lesson pack. DBash shows each step, checks your exercise itself (exit code, output, folder, files) and moves on. Then comes a quiz and a cheat sheet. They work without AI. The AI gets the current step, so it explains that step and never invents other exercises.
- **Updates itself.** Once a day DBash checks GitHub for a new version. It installs it only after you answer y, and only if the sha256 checksum matches (type `update` to check now).
- **Nothing loads from the internet to draw the screen.** The fonts are built in.
- Coach and Explain now also react to commands that print nothing (`cd`, `mkdir`).
- In a lesson, plain changes in the practice folder (`mkdir`, `touch`, `mv`…) do not ask for confirmation. sudo and DANGER still do.
- Clean-up: the code is split into files, the old restore-point timeline is removed, and tests were added (`npm test`, `cargo test`).

## 0.3.9
- The Model list in the settings shows your real models.

## 0.3.8
- `hf` picks the best file of a model across trusted uploaders. Chats icon before the command book.

## 0.3.7
- Find and download models from Hugging Face inside DBash (`hf`, `hf best`), with a progress bar and resume.

## 0.3.6
- AI roles: Free, Explain, Coach and Teacher. What you already know, cheat sheets into the command book.

## 0.3.5
- Progress bar for apt, a package check before installing, only recent output goes to the AI.

## 0.3.4
- Cleaner apt output and a smarter RUN ALL.

## 0.3.3
- Fix: Timeshift 24.x refused `--tags`.

## 0.3.2
- Copy and paste (Ctrl+C / Ctrl+V, right-click menu), and commands over several lines.

## 0.3.1
- AI memory: MEM %, old output trimmed first, older messages summarized.

## 0.3.0
- A real terminal: one bash session in a PTY, `cd` remembered, live output, Ctrl+C. nano, htop, less and ssh inside DBash. File changes shown as a coloured diff, with backup and UNDO.

## 0.2.x
- ⟲ BACKUP box with Timeshift, the AI reads command output, y/n questions in the terminal.

## 0.1.x
- First real app: local AI with llamafile, real commands with risk labels, sudo in the terminal, command book, keyboard control.
