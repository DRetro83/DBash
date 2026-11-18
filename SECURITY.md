# Security

DBash runs commands on your computer, some of them as administrator. These are the rules it is built on:

1. **The AI never runs anything by itself.** It proposes commands; you click ▶ RUN or answer `y`.
2. **Risk labels on every command** (SAFE, SUDO, DANGER, WEB). SUDO always asks first, DANGER asks again, and commands that came from an answer that used web pages always ask.
3. **The sudo password** is typed in DBash, hidden, and kept only in memory (15 minutes by default, setting in ⚙). It reaches sudo through a private helper file in `$XDG_RUNTIME_DIR` (RAM, mode 0600) that is deleted right after the command. It is never written to the log, to a chat or to disk.
4. **File changes** proposed by the AI are shown as a diff first. They are written only after you agree, a backup (`.dbash-bak`) is kept, and ⟲ UNDO restores it.
5. **Downloads** (models, the llamafile engine, updates) only go inside your home folder and never run by themselves.
6. **Self-update** only takes files from the GitHub release of this project, checks them against the release's `SHA256SUMS`, and only installs after you answer `y`. Nothing changes when a check fails.
7. **Web content is untrusted.** Search results and pages go to the AI marked as data, with the rule never to follow instructions inside them.
8. **Lessons** practise in `~/DBash/Learn`. The only lesson that changes the system (lesson 5) installs and removes the `cowsay` package, through the normal confirmation.
9. **Do not run DBash as root** and do not give your user `NOPASSWD: ALL` in sudoers to make it "easier".

## Reporting a vulnerability

Please do not open a public issue for a security problem. Use GitHub's private vulnerability reporting (Security tab → Report a vulnerability).
