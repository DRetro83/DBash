/* DBash lesson pack: fixed, hand-checked Linux lessons.
   DBash itself shows every step and checks the exercises (no AI needed). The AI gets the
   current step as context, so it explains the same thing and never invents other exercises.
   Format: see lessons/README.md in the repository. Practice files live in ~/DBash/Learn/lN.

   A check passes when ALL of its parts pass:
     typed: regex that the typed command must match
     ok:    true = exit code 0 (default) · false = the command must fail · null = do not care
     out:   regex on the output (colours removed)
     pwd:   regex on the current folder, written with ~ for your home folder
     shell: a bash test that DBash runs after the command (exit code 0 = passed)          */
window.DBASH_LESSONS = {
  version: 1,
  folder: '~/DBash/Learn',
  lessons: [
  /* ------------------------------------------------------------------ 1 */
  {
    id: 'moving-around',
    title: 'Moving around',
    topics: 'pwd, ls, ls -la, cd, cd .., cd ~, absolute and relative paths, hidden files',
    intro: 'In the terminal you are always inside one folder, just like a window of your file manager. In this lesson you learn to see where you are, look around and move between folders.',
    setup: 'L=$HOME/DBash/Learn/l1; rm -rf "$L"; mkdir -p "$L/photos/2024" "$L/photos/2025" "$L/docs"; printf "Welcome to lesson 1!\\n" > "$L/readme.txt"; printf "You found the hidden file.\\n" > "$L/.secret"; touch "$L/photos/2024/beach.jpg" "$L/photos/2024/snow.jpg" "$L/docs/letter.txt"',
    steps: [
      { title: 'Where am I?',
        explain: 'The folder you are in is called the **current folder** (or working directory). `pwd` means *print working directory*.',
        task: 'Type `pwd` and press Enter.',
        answer: 'pwd', check: { typed: '^pwd$' },
        hint: 'Just the three letters p, w, d.',
        done: 'That is your current folder. Your home folder is /home/ plus your user name. Its short name is `~`.' },
      { title: 'Look around',
        explain: '`ls` (*list*) shows the files and folders in the current folder. You can also give it another folder to look into.',
        task: 'Look into the practice folder: `ls ~/DBash/Learn/l1`',
        answer: 'ls ~/DBash/Learn/l1', check: { typed: '^ls\\b.*DBash/Learn/l1/?$', out: 'docs' },
        hint: 'Type ls, a space, then the folder ~/DBash/Learn/l1',
        done: 'You see 2 folders (docs, photos) and 1 file (readme.txt). Folders are shown in colour.' },
      { title: 'Go into a folder',
        explain: '`cd` means *change directory*: it moves you into another folder.',
        task: 'Go into the practice folder: `cd ~/DBash/Learn/l1`',
        answer: 'cd ~/DBash/Learn/l1', check: { pwd: '^~/DBash/Learn/l1$' },
        hint: 'cd, a space, then the same folder as in the last step.',
        done: 'Look at the prompt: it now shows ~/DBash/Learn/l1. That is always your current folder.' },
      { title: 'Hidden files',
        explain: 'Files whose name starts with a dot are **hidden**: plain `ls` does not show them. Option `-a` shows *all* files, and `-l` shows a *long* list with size, date and permissions. You can put options together: `-la`.',
        task: 'Show everything here, with details: `ls -la`',
        answer: 'ls -la', check: { typed: '^ls\\s+-\\w*a', out: '\\.secret' },
        hint: 'ls, a space, a minus sign, then the letters l and a.',
        done: 'Now you see .secret too. The `.` and `..` lines are this folder and the folder above it.' },
      { title: 'A relative path',
        explain: 'A path that does not start with `/` or `~` is **relative**: it starts from the folder you are in now.',
        task: 'Go into the 2024 folder that is inside photos: `cd photos/2024`',
        answer: 'cd photos/2024', check: { pwd: '/l1/photos/2024$' },
        hint: 'From ~/DBash/Learn/l1 you only need: cd photos/2024',
        done: 'You went two folders deeper in one step.' },
      { title: 'One folder up',
        explain: '`..` always means *the folder above this one*.',
        task: 'Go one folder up: `cd ..`',
        answer: 'cd ..', check: { typed: '^cd\\s+\\.\\./?$', pwd: '/l1/photos$' },
        hint: 'cd, a space and two dots.',
        done: 'You are in photos now. `cd ../..` would go two folders up.' },
      { title: 'Back home',
        explain: 'A path that starts with `/` is **absolute**: it starts at the top of the disk, like /etc or /home. `~` is your home folder. Plain `cd` or `cd ~` takes you home from anywhere.',
        task: 'Go back to your home folder: `cd ~`',
        answer: 'cd ~', check: { typed: '^cd(\\s+~/?)?$', pwd: '^~$' },
        hint: 'cd, a space and the tilde ~ (or just cd).',
        done: 'Home again. Wherever you get lost, `cd` brings you back.' }
    ],
    quiz: [
      { q: 'Which command shows the folder you are in?', options: ['ls', 'pwd', 'cd'], answer: 1, why: 'pwd = print working directory.' },
      { q: 'What does `cd ..` do?', options: ['go to your home folder', 'go one folder up', 'show hidden files'], answer: 1, why: '.. is the folder above the current one.' },
      { q: 'Which of these files is hidden?', options: ['readme.txt', '.secret', 'photos'], answer: 1, why: 'Names that start with a dot are hidden; ls -a shows them.' }
    ],
    cheatsheet: [['pwd', 'show the folder you are in'], ['ls', 'list the files and folders here'], ['ls -la', 'list all files, also hidden ones, with details'], ['cd FOLDER', 'go into a folder'], ['cd ..', 'go one folder up'], ['cd ~', 'go back to your home folder']]
  },
  /* ------------------------------------------------------------------ 2 */
  {
    id: 'files-and-folders',
    title: 'Files and folders',
    topics: 'mkdir, touch, echo >, >>, cp, mv, rm, rm -r, wildcards like *.txt',
    intro: 'Now you make, copy, move, rename and delete files yourself. Everything happens in the practice folder, so nothing important can break. One warning up front: rm has no recycle bin.',
    setup: 'L=$HOME/DBash/Learn/l2; rm -rf "$L"; mkdir -p "$L"',
    steps: [
      { title: 'Into the practice folder',
        explain: 'Every lesson has its own practice folder.',
        task: 'Go to it: `cd ~/DBash/Learn/l2`',
        answer: 'cd ~/DBash/Learn/l2', check: { pwd: '^~/DBash/Learn/l2$' },
        hint: 'cd ~/DBash/Learn/l2', done: 'The folder is still empty.' },
      { title: 'Make a folder',
        explain: '`mkdir` (*make directory*) creates a new folder. With `-p` it also makes the folders above it, and gives no error when it exists already.',
        task: 'Make a folder called notes: `mkdir notes`',
        answer: 'mkdir notes', check: { shell: 'test -d "$HOME/DBash/Learn/l2/notes"' },
        hint: 'mkdir, a space, notes', done: 'The folder notes exists now. Check it with ls if you like.' },
      { title: 'Make an empty file',
        explain: '`touch` creates an empty file (or, if the file exists, only updates its date).',
        task: 'Make the file todo.txt inside notes: `touch notes/todo.txt`',
        answer: 'touch notes/todo.txt', check: { shell: 'test -f "$HOME/DBash/Learn/l2/notes/todo.txt"' },
        hint: 'touch notes/todo.txt', done: 'An empty file. Next you put text in it.' },
      { title: 'Write into a file',
        explain: '`echo` prints text. `>` sends that text into a file instead of the screen. Careful: `>` **replaces** the whole file. `>>` **adds** a line at the end.',
        task: 'Put a line in the file: `echo "buy milk" > notes/todo.txt`',
        answer: 'echo "buy milk" > notes/todo.txt', check: { typed: '>', shell: 'grep -q . "$HOME/DBash/Learn/l2/notes/todo.txt"' },
        hint: 'echo, the text in quotes, then > and the file name.', done: 'Look at it with cat notes/todo.txt. Try >> to add a second line.' },
      { title: 'Copy',
        explain: '`cp` (*copy*) needs two things: what you copy, and where the copy goes.',
        task: 'Copy the file: `cp notes/todo.txt notes/todo-copy.txt`',
        answer: 'cp notes/todo.txt notes/todo-copy.txt', check: { shell: 'test -f "$HOME/DBash/Learn/l2/notes/todo-copy.txt"' },
        hint: 'cp, the old name, the new name.', done: 'Now there are two files with the same text.' },
      { title: 'Move or rename',
        explain: '`mv` (*move*) moves a file. Moving it to a new name in the same folder is how you **rename** in the terminal.',
        task: 'Rename the copy: `mv notes/todo-copy.txt notes/done.txt`',
        answer: 'mv notes/todo-copy.txt notes/done.txt', check: { shell: 'test -f "$HOME/DBash/Learn/l2/notes/done.txt" && test ! -e "$HOME/DBash/Learn/l2/notes/todo-copy.txt"' },
        hint: 'mv, the old name, the new name.', done: 'todo-copy.txt is gone, done.txt is there.' },
      { title: 'Several files at once',
        explain: 'Most commands take several names at once.',
        task: 'Make three files in one go: `touch a.txt b.txt c.log`',
        answer: 'touch a.txt b.txt c.log', check: { shell: 'cd "$HOME/DBash/Learn/l2" && test -f a.txt && test -f b.txt && test -f c.log' },
        hint: 'touch and the three names, with spaces between them.', done: 'Three files, two of them end in .txt.' },
      { title: 'Wildcards',
        explain: '`*` means *any text*. So `*.txt` means every name that ends in .txt. `rm` (*remove*) deletes files **for good**: there is no recycle bin.',
        task: 'Delete only the .txt files here: `rm *.txt`',
        answer: 'rm *.txt', check: { shell: 'cd "$HOME/DBash/Learn/l2" && test ! -e a.txt && test ! -e b.txt && test -f c.log' },
        hint: 'rm, a space, *.txt', done: 'a.txt and b.txt are gone; c.log stayed because it does not end in .txt. Tip: try ls *.txt first to see what a wildcard matches.' },
      { title: 'Delete a folder',
        explain: 'A folder with files in it needs `rm -r` (*recursive*: the folder and everything in it). DBash marks this as DANGER and asks you first. That is right: `rm -r` on the wrong folder can wipe a lot.',
        task: 'Delete the notes folder: `rm -r notes`',
        answer: 'rm -r notes', check: { shell: 'test ! -e "$HOME/DBash/Learn/l2/notes"' },
        hint: 'rm -r notes', done: 'The folder and both files are gone.' }
    ],
    quiz: [
      { q: 'What is the difference between `>` and `>>`?', options: ['> adds a line, >> replaces the file', '> replaces the file, >> adds at the end', 'there is no difference'], answer: 1, why: '> overwrites, >> appends.' },
      { q: 'How do you rename old.txt to new.txt?', options: ['cp old.txt new.txt', 'rename old.txt', 'mv old.txt new.txt'], answer: 2, why: 'mv moves; to a new name in the same folder = rename. cp would keep the old file too.' },
      { q: 'Which files does `rm *.log` delete?', options: ['every file that ends in .log', 'only a file called *.log', 'all files'], answer: 0, why: '* matches any text, so *.log matches every name ending in .log.' }
    ],
    cheatsheet: [['mkdir FOLDER', 'make a folder (-p: also the folders above it)'], ['touch FILE', 'make an empty file'], ['echo "text" > FILE', 'write text into a file (replaces it)'], ['echo "text" >> FILE', 'add a line at the end of a file'], ['cp FROM TO', 'copy a file'], ['mv FROM TO', 'move or rename'], ['rm FILE', 'delete a file for good (no recycle bin)'], ['rm -r FOLDER', 'delete a folder and everything in it'], ['*.txt', 'wildcard: every name that ends in .txt']]
  },
  /* ------------------------------------------------------------------ 3 */
  {
    id: 'reading-files',
    title: 'Reading files',
    topics: 'cat, head, tail, grep, wc, pipes with |, sort, uniq, less',
    intro: 'Linux keeps almost everything in text files: settings, logs, lists. Here you learn to read them fast, find lines in them and chain commands together with a pipe.',
    setup: 'L=$HOME/DBash/Learn/l3; rm -rf "$L"; mkdir -p "$L"; printf "banana\\napple\\ncherry\\napple\\nkiwi\\nbanana\\napple\\n" > "$L/fruit.txt"; for i in $(seq 1 60); do m=$(printf %02d $((i-1))); if [ $((i % 15)) -eq 0 ]; then echo "2026-11-18 10:$m ERROR disk is almost full"; else echo "2026-11-18 10:$m INFO all good (check $i)"; fi; done > "$L/app.log"',
    steps: [
      { title: 'Into the practice folder', explain: 'There are two files waiting: fruit.txt and app.log (a log with 60 lines).',
        task: '`cd ~/DBash/Learn/l3`', answer: 'cd ~/DBash/Learn/l3', check: { pwd: '^~/DBash/Learn/l3$' }, hint: 'cd ~/DBash/Learn/l3', done: 'Ready.' },
      { title: 'Show a whole file', explain: '`cat` prints a whole file on the screen. Fine for short files.',
        task: '`cat fruit.txt`', answer: 'cat fruit.txt', check: { typed: '^cat\\s+fruit\\.txt$', out: 'banana' }, hint: 'cat fruit.txt', done: 'Seven lines of fruit, some of them twice.' },
      { title: 'The first lines', explain: '`head` shows the start of a file; `-n 5` means 5 lines.',
        task: '`head -n 5 app.log`', answer: 'head -n 5 app.log', check: { typed: '^head\\b.*app\\.log', out: 'INFO' }, hint: 'head -n 5 app.log', done: 'The oldest lines of the log.' },
      { title: 'The last lines', explain: '`tail` shows the end of a file. Logs grow at the bottom, so the newest news is there. `tail -f` keeps following a file while it grows (Ctrl+C stops it).',
        task: '`tail -n 3 app.log`', answer: 'tail -n 3 app.log', check: { typed: '^tail\\b.*app\\.log', out: 'ERROR' }, hint: 'tail -n 3 app.log', done: 'The very last line is an ERROR.' },
      { title: 'Find lines', explain: '`grep` shows only the lines that contain a word. It is the most useful tool for logs. Add `-i` to ignore upper and lower case.',
        task: 'Find the errors: `grep ERROR app.log`', answer: 'grep ERROR app.log', check: { typed: '^grep\\b.*ERROR.*app\\.log', out: 'ERROR' }, hint: 'grep, the word ERROR, the file name.', done: 'Only the ERROR lines are left.' },
      { title: 'A pipe', explain: 'The pipe `|` sends the output of one command into the next one. `wc -l` counts lines. Together: grep finds the lines, wc counts them.',
        task: 'Count the errors: `grep ERROR app.log | wc -l`', answer: 'grep ERROR app.log | wc -l', check: { typed: '\\|\\s*wc\\s+-l', out: '(^|\\n)\\s*4\\s*($|\\n)' }, hint: 'The same grep as before, then | wc -l', done: '4 errors. Pipes let you build big answers from small tools.' },
      { title: 'Sort and count', explain: '`sort` puts lines in order, `uniq -c` counts lines that are the same and next to each other. That is why you sort first.',
        task: 'Which fruit is most common? `sort fruit.txt | uniq -c`', answer: 'sort fruit.txt | uniq -c', check: { typed: 'sort\\b.*\\|\\s*uniq', out: '3\\s+apple' }, hint: 'sort fruit.txt | uniq -c', done: 'apple wins with 3. Add | sort -n to sort by the count.' },
      { title: 'Page through a long file', explain: '`less` shows a long file one screen at a time. Inside less: arrows or Space to scroll, `/word` to search, **q** to quit.',
        task: 'Open the log: `less app.log`, look around, then press q', answer: 'less app.log', check: { typed: '^less\\b.*app\\.log' }, hint: 'less app.log, and q closes it again.', done: 'less is also what man (the manual pages) uses.' }
    ],
    quiz: [
      { q: 'You want the newest lines of a log. Which command?', options: ['head', 'tail', 'cat'], answer: 1, why: 'Logs grow at the bottom; tail shows the end.' },
      { q: 'What does `|` do?', options: ['it sends the output of a command into the next command', 'it runs two commands at the same time', 'it writes into a file'], answer: 0, why: 'That is the pipe. Writing into a file is >.' },
      { q: 'How do you show only lines with the word "fail" in log.txt?', options: ['cat fail log.txt', 'grep fail log.txt', 'tail fail log.txt'], answer: 1, why: 'grep WORD FILE filters lines.' }
    ],
    cheatsheet: [['cat FILE', 'show a whole file'], ['head -n 5 FILE', 'the first 5 lines'], ['tail -n 3 FILE', 'the last 3 lines (tail -f keeps following)'], ['grep WORD FILE', 'only the lines with WORD (-i: ignore case)'], ['CMD | wc -l', 'count the lines of the output'], ['sort FILE | uniq -c', 'count lines that are the same'], ['less FILE', 'page through a file (q quits, / searches)']]
  },
  /* ------------------------------------------------------------------ 4 */
  {
    id: 'permissions',
    title: 'Users, permissions and sudo',
    topics: 'whoami, groups, ls -l, rwx, chmod +x, chmod 600, ./program, sudo',
    intro: 'Every file has an owner and permissions: who may read (r), write (w) and run (x) it. Here you learn to read them, change them, and what sudo really does.',
    setup: 'L=$HOME/DBash/Learn/l4; rm -rf "$L"; mkdir -p "$L"; printf "#!/bin/bash\\necho \\"Hello from your first program, \\$USER!\\"\\n" > "$L/hello.sh"; chmod 644 "$L/hello.sh"; printf "my secret notes\\n" > "$L/diary.txt"; chmod 644 "$L/diary.txt"',
    steps: [
      { title: 'Who am I?', explain: 'Linux has users. You are logged in as a normal user, not as the administrator (root).',
        task: '`whoami`', answer: 'whoami', check: { typed: '^whoami$' }, hint: 'who, am, i as one word.', done: 'That is your user name.' },
      { title: 'Your groups', explain: 'Users are in **groups**. Membership gives extra rights. The group `sudo` (on some systems `wheel`) may run commands as administrator.',
        task: '`groups`', answer: 'groups', check: { typed: '^(groups|id)\\b' }, hint: 'groups', done: 'If you see sudo in the list, you may use sudo.' },
      { title: 'Into the practice folder', explain: 'Here are a small program (hello.sh) and a diary file.',
        task: '`cd ~/DBash/Learn/l4`', answer: 'cd ~/DBash/Learn/l4', check: { pwd: '^~/DBash/Learn/l4$' }, hint: 'cd ~/DBash/Learn/l4', done: 'Ready.' },
      { title: 'Read the permissions', explain: '`ls -l` starts every line with something like `-rw-r--r--`. After the first character come 3 groups of 3: the **owner** (you), the **group**, and **everybody else**. r = read, w = write, x = execute (run), - = not allowed.',
        task: '`ls -l`', answer: 'ls -l', check: { typed: '^ls\\s+-\\w*l', out: 'rw-' }, hint: 'ls -l', done: 'hello.sh is rw-r--r--: you may read and write it, but nobody may run it.' },
      { title: 'Try to run it', explain: 'To run a program in the current folder you type `./` before its name (`.` is this folder).',
        task: 'Try it: `./hello.sh` (this one is supposed to fail)', answer: './hello.sh', check: { typed: '^\\./hello\\.sh$', ok: false }, hint: './hello.sh', done: 'Permission denied: the file has no x, so it may not run. Even sudo does not help here.' },
      { title: 'Make it runnable', explain: '`chmod` (*change mode*) changes permissions. `+x` adds execute permission.',
        task: '`chmod +x hello.sh`', answer: 'chmod +x hello.sh', check: { shell: 'test -x "$HOME/DBash/Learn/l4/hello.sh"' }, hint: 'chmod +x hello.sh', done: 'Check with ls -l: it is now rwxr-xr-x.' },
      { title: 'Run it', explain: 'Now the same command works.',
        task: '`./hello.sh`', answer: './hello.sh', check: { typed: '^\\./hello\\.sh$', out: 'Hello from' }, hint: './hello.sh', done: 'Your first program ran. In lesson 10 you write your own.' },
      { title: 'Keep a file private', explain: 'Permissions can also be written as numbers: r = 4, w = 2, x = 1, added up per group. So 6 = rw, 4 = r, 0 = nothing. `600` = only you may read and write.',
        task: 'Make the diary private: `chmod 600 diary.txt`', answer: 'chmod 600 diary.txt', check: { shell: '[ "$(stat -c %a "$HOME/DBash/Learn/l4/diary.txt")" = 600 ]' }, hint: 'chmod 600 diary.txt', done: 'ls -l now shows -rw------- for diary.txt.' },
      { title: 'sudo', explain: '`sudo` runs one command as **root**, the administrator, after your password. Root may do everything, also break the system. So: only use sudo when a command really needs it (installing, system settings), and read the command first.',
        task: '`sudo whoami`', answer: 'sudo whoami', check: { typed: '^sudo\\s+whoami$', out: '(^|\\n)root\\b' }, hint: 'sudo whoami (DBash asks your password)', done: 'For that one command you were root. Right after, you are yourself again.' }
    ],
    quiz: [
      { q: 'What does the x in rwx allow?', options: ['delete the file', 'run the file as a program', 'read the file'], answer: 1, why: 'x = execute.' },
      { q: 'What does `chmod 600 file` mean?', options: ['everybody may read it', 'only the owner may read and write it', 'nobody may read it'], answer: 1, why: '6 = 4+2 = rw for the owner, 0 for the group and the rest.' },
      { q: 'When should you use sudo?', options: ['always, to be sure', 'only when a command needs administrator rights', 'never'], answer: 1, why: 'sudo gives full power; use it only when it is needed.' }
    ],
    cheatsheet: [['whoami', 'your user name'], ['groups', 'the groups you are in (sudo = may use sudo)'], ['ls -l', 'list with permissions (rwx for owner, group, others)'], ['chmod +x FILE', 'allow running a file'], ['chmod 600 FILE', 'only you may read and write it'], ['./PROGRAM', 'run a program from this folder'], ['sudo COMMAND', 'run one command as administrator (root)']]
  },
  /* ------------------------------------------------------------------ 5 */
  {
    id: 'packages',
    title: 'Packages',
    topics: 'apt search, apt show, apt-cache policy, apt install, dpkg -L, apt remove, apt list --upgradable',
    intro: 'Programs on Debian come in packages, from the Debian servers. apt finds, installs, updates and removes them. You practise with cowsay, a tiny joke program that you remove again at the end. (This lesson is for Debian, Ubuntu and Mint.)',
    setup: '',
    steps: [
      { title: 'Search', explain: 'Before you install, look the package up. Searching only reads, so no sudo is needed.',
        task: '`apt search cowsay`', answer: 'apt search cowsay', check: { typed: '^apt(-cache)?\\s+search\\s+cowsay', out: 'cowsay' }, hint: 'apt search cowsay', done: 'Every result is a package name with a short description.' },
      { title: 'Details', explain: '`apt show` tells you what a package is, how big it is and what it needs.',
        task: '`apt show cowsay`', answer: 'apt show cowsay', check: { typed: '^apt\\s+show\\s+cowsay', out: 'Description' }, hint: 'apt show cowsay', done: 'Read the Description: always check a package before you install it.' },
      { title: 'Is it installed? Can it be?', explain: '`apt-cache policy` shows the **Installed** version (or none) and the **Candidate**: the version you would get. Candidate: (none) means the package is not in your sources.',
        task: '`apt-cache policy cowsay`', answer: 'apt-cache policy cowsay', check: { typed: '^apt-cache\\s+policy\\s+cowsay', out: 'Candidate' }, hint: 'apt-cache policy cowsay', done: 'Installed: (none), and there is a Candidate, so you can install it.' },
      { title: 'Install', explain: 'Installing changes the system, so it needs `sudo`. DBash asks you first, like it does for every change.',
        task: '`sudo apt install cowsay`', answer: 'sudo apt install cowsay', check: { typed: '^sudo\\s+apt(-get)?\\s+install\\b.*cowsay', shell: 'dpkg -s cowsay 2>/dev/null | grep -q "^Status: install ok installed"' }, hint: 'sudo apt install cowsay', done: 'Look for "Setting up cowsay" in the output: that line means it worked.' },
      { title: 'Use it', explain: 'Debian puts games and toys in /usr/games. If `cowsay` is not found, type the full path: `/usr/games/cowsay Hello`.',
        task: '`cowsay Hello`', answer: 'cowsay Hello', check: { typed: '^(/usr/games/)?cowsay\\b', out: 'Hello' }, hint: 'cowsay Hello  (or /usr/games/cowsay Hello)', done: 'A talking cow. Silly, but now you know how installing works.' },
      { title: 'Where did it go?', explain: '`dpkg -L` lists every file a package put on your system.',
        task: '`dpkg -L cowsay | head -n 10`', answer: 'dpkg -L cowsay | head -n 10', check: { typed: '^dpkg\\s+-L\\s+cowsay', out: '/usr/' }, hint: 'dpkg -L cowsay | head -n 10', done: 'Programs live in /usr, never in your home folder.' },
      { title: 'Remove', explain: '`apt remove` removes a package; `apt purge` also removes its system settings. `sudo apt autoremove` cleans up packages that nothing needs anymore.',
        task: '`sudo apt remove cowsay`', answer: 'sudo apt remove cowsay', check: { typed: '^sudo\\s+apt(-get)?\\s+(remove|purge)\\b.*cowsay', shell: '! dpkg -s cowsay 2>/dev/null | grep -q "^Status: install ok installed"' }, hint: 'sudo apt remove cowsay', done: 'Gone again. Your system is as it was.' },
      { title: 'Updates', explain: '`sudo apt update` refreshes the list of packages, `sudo apt upgrade` installs the updates. First see what is waiting (read-only):',
        task: '`apt list --upgradable`', answer: 'apt list --upgradable', check: { typed: '^apt\\s+list\\s+--upgradable' }, hint: 'apt list --upgradable', done: 'Tip: type upgrade in DBash for the all-in-one update command from your command book.' }
    ],
    quiz: [
      { q: 'Why does `apt search` work without sudo, but `apt install` not?', options: ['search is faster', 'search only reads; install changes the system', 'install needs the internet'], answer: 1, why: 'Reading is allowed for everybody; changing the system needs root.' },
      { q: 'apt-cache policy shows `Candidate: (none)`. What does that mean?', options: ['the package is installed', 'the package is not in your sources', 'you need sudo'], answer: 1, why: 'There is no version you can install from your sources.' },
      { q: 'What is the difference between remove and purge?', options: ['purge also removes the system settings of the package', 'remove is faster', 'there is none'], answer: 0, why: 'remove keeps config files in /etc, purge removes them too.' }
    ],
    cheatsheet: [['apt search NAME', 'search for a package'], ['apt show PACKAGE', 'details of a package'], ['apt-cache policy PACKAGE', 'installed version and the version you can get'], ['sudo apt install PACKAGE', 'install a package'], ['dpkg -L PACKAGE', 'which files a package installed'], ['sudo apt remove PACKAGE', 'remove (purge: also its settings)'], ['apt list --upgradable', 'which updates are waiting'], ['sudo apt update && sudo apt upgrade', 'refresh the lists, then install updates']]
  },
  /* ------------------------------------------------------------------ 6 */
  {
    id: 'services',
    title: 'Services',
    topics: 'systemctl --failed, status, is-active, list-unit-files, systemctl --user, list-timers, systemctl cat',
    intro: 'Services are programs that run in the background: network, sound, bluetooth, printing. systemd starts and watches them, and you talk to it with systemctl. This lesson only reads, so nothing changes.',
    setup: '',
    steps: [
      { title: 'Anything broken?', explain: 'The first question when something does not work.',
        task: '`systemctl --failed`', answer: 'systemctl --failed', check: { typed: '^systemctl\\s+--failed' }, hint: 'systemctl --failed', done: '0 loaded units listed = nothing has failed. If there is one, its name is the start of your search.' },
      { title: 'Status of one service', explain: 'dbus is the message bus that every Linux desktop needs. **Active: active (running)** means it runs. The last lines are its newest log lines.',
        task: '`systemctl status dbus`', answer: 'systemctl status dbus', check: { typed: '^systemctl\\s+status\\s+dbus', out: 'Active:' }, hint: 'systemctl status dbus', done: 'Loaded shows whether it starts at boot (enabled), Active whether it runs now.' },
      { title: 'A short answer', explain: 'For scripts there are short questions with a one-word answer.',
        task: '`systemctl is-active dbus`', answer: 'systemctl is-active dbus', check: { typed: '^systemctl\\s+is-active\\s+\\S+', out: '\\bactive\\b' }, hint: 'systemctl is-active dbus', done: 'There is also is-enabled and is-failed.' },
      { title: 'What starts at boot?', explain: 'enable = start at every boot, disable = do not. start and stop act right now. Those four need sudo: `sudo systemctl enable --now NAME`.',
        task: '`systemctl list-unit-files --type=service --state=enabled`', answer: 'systemctl list-unit-files --type=service --state=enabled', check: { typed: 'list-unit-files' }, hint: 'systemctl list-unit-files --type=service --state=enabled', done: 'Everything in this list starts by itself when your PC boots.' },
      { title: 'Your own services', explain: 'Some services run per user, not for the whole system: sound (pipewire) for example. For those you add `--user`, and you never need sudo.',
        task: '`systemctl --user status pipewire`', answer: 'systemctl --user status pipewire', check: { typed: '^systemctl\\s+--user\\b', ok: null }, hint: 'systemctl --user status pipewire', done: 'If sound does not work, this is where to look.' },
      { title: 'Timers', explain: 'Timers start services at set times, like a modern cron: updates, cleaning, backups.',
        task: '`systemctl list-timers`', answer: 'systemctl list-timers', check: { typed: '^systemctl\\s+list-timers' }, hint: 'systemctl list-timers', done: 'NEXT shows when each one runs again.' },
      { title: 'Look inside a service', explain: 'Every service is described in a small text file, a unit file. `systemctl cat` shows it. **ExecStart** is the program it runs.',
        task: '`systemctl cat dbus`', answer: 'systemctl cat dbus', check: { typed: '^systemctl\\s+cat\\s+\\S+', out: 'ExecStart' }, hint: 'systemctl cat dbus', done: 'Now you know where a service comes from and what it runs.' }
    ],
    quiz: [
      { q: 'What is the difference between enable and start?', options: ['enable = at every boot, start = right now', 'they are the same', 'start = at every boot, enable = right now'], answer: 0, why: 'enable --now does both.' },
      { q: 'Sound does not work. Which command makes sense?', options: ['sudo systemctl status pipewire', 'systemctl --user status pipewire', 'systemctl cat sound'], answer: 1, why: 'pipewire runs per user, so --user and no sudo.' },
      { q: 'How do you see which services have crashed?', options: ['systemctl --failed', 'systemctl list-timers', 'whoami'], answer: 0, why: '--failed lists units that failed.' }
    ],
    cheatsheet: [['systemctl --failed', 'services that crashed'], ['systemctl status NAME', 'state and newest log lines of a service'], ['systemctl is-active NAME', 'short answer: active or not'], ['sudo systemctl restart NAME', 'restart a service'], ['sudo systemctl enable --now NAME', 'start now and at every boot'], ['systemctl --user status NAME', 'a service of your own user (sound…)'], ['systemctl list-timers', 'what runs at set times'], ['systemctl cat NAME', 'show the unit file of a service']]
  },
  /* ------------------------------------------------------------------ 7 */
  {
    id: 'logs-and-errors',
    title: 'Logs and errors',
    topics: 'error messages, exit codes ($?), 2> for errors, journalctl -p err, journalctl -u, dmesg',
    intro: 'When something goes wrong, Linux almost always tells you why: in the error message, the exit code or a log. Here you learn to read all three.',
    setup: 'L=$HOME/DBash/Learn/l7; rm -rf "$L"; mkdir -p "$L"',
    steps: [
      { title: 'Make an error', explain: 'An error message has the program name first, then what went wrong. Read the **last** part: that is usually the reason.',
        task: '`ls /does-not-exist`  (this fails on purpose)', answer: 'ls /does-not-exist', check: { typed: '^ls\\s+/does-not-exist', ok: false, out: 'No such file' }, hint: 'ls /does-not-exist', done: '"No such file or directory": the folder does not exist. Clear.' },
      { title: 'The exit code', explain: 'Every command ends with a number, the **exit code**: 0 = it worked, anything else = a problem. `$?` holds the code of the command before.',
        task: '`echo $?`', answer: 'echo $?', check: { typed: '^echo\\s+\\$\\?$', out: '(^|\\n)\\s*[1-9]\\d*\\s*($|\\n)' }, hint: 'echo, a space, a dollar sign and a question mark.', done: 'Not 0, so ls failed. DBash shows this as [exit code …] under a failed command.' },
      { title: 'Errors into a file', explain: 'Programs have two outputs: normal output and errors. `>` catches only normal output; `2>` catches the errors.',
        task: '`ls /does-not-exist 2> ~/DBash/Learn/l7/errors.txt`', answer: 'ls /does-not-exist 2> ~/DBash/Learn/l7/errors.txt', check: { typed: '2>', ok: null, shell: 'test -s "$HOME/DBash/Learn/l7/errors.txt"' }, hint: 'The ls from before, then 2> and the file.', done: 'The screen stayed empty: the error went into the file.' },
      { title: 'Read it back', explain: 'Check what landed in the file.',
        task: '`cat ~/DBash/Learn/l7/errors.txt`', answer: 'cat ~/DBash/Learn/l7/errors.txt', check: { typed: '^cat\\b.*errors\\.txt', out: 'No such file' }, hint: 'cat ~/DBash/Learn/l7/errors.txt', done: 'Handy when you want to send an error to someone.' },
      { title: 'The system log', explain: 'systemd keeps one big log, the journal. `-b` = since this boot, `-p err` = only errors and worse, `-n 20` = the last 20. The full log needs sudo.',
        task: '`sudo journalctl -b -p err -n 20 --no-pager`', answer: 'sudo journalctl -b -p err -n 20 --no-pager', check: { typed: 'journalctl\\b.*-p\\s*err', ok: null }, hint: 'sudo journalctl -b -p err -n 20 --no-pager', done: 'Some errors are normal on every PC. Look at the time stamps: what happened just when your problem started?' },
      { title: 'The log of one service', explain: '`-u NAME` shows only the lines of one service. Very useful together with systemctl status from lesson 6.',
        task: '`sudo journalctl -u NetworkManager -n 15 --no-pager`', answer: 'sudo journalctl -u NetworkManager -n 15 --no-pager', check: { typed: 'journalctl\\b.*-u\\s*\\S+', ok: null }, hint: 'sudo journalctl -u NetworkManager -n 15 --no-pager', done: 'Every line: date, computer, program, message.' },
      { title: 'Kernel messages', explain: '`dmesg` shows what the kernel says about hardware: disks, USB, graphics card, firmware.',
        task: '`sudo dmesg --level=err,warn | tail -n 15`', answer: 'sudo dmesg --level=err,warn | tail -n 15', check: { typed: 'dmesg\\b', ok: null }, hint: 'sudo dmesg --level=err,warn | tail -n 15', done: 'Searching the web for one exact line from here often finds the fix.' }
    ],
    quiz: [
      { q: 'A command ends with exit code 0. What does that mean?', options: ['it failed', 'it worked', 'it is still running'], answer: 1, why: '0 = success, anything else = a problem.' },
      { q: 'How do you put only the error messages of a command into a file?', options: ['> file', '2> file', '| file'], answer: 1, why: '2> catches the error output.' },
      { q: 'Which command shows the errors since this boot?', options: ['sudo journalctl -b -p err', 'systemctl --user', 'tail -f'], answer: 0, why: '-b = this boot, -p err = errors.' }
    ],
    cheatsheet: [['echo $?', 'exit code of the last command (0 = OK)'], ['CMD 2> FILE', 'put the error messages in a file'], ['sudo journalctl -b -p err', 'errors since this boot'], ['sudo journalctl -u NAME -n 50', 'last 50 log lines of one service'], ['journalctl -f', 'follow the log live (Ctrl+C stops)'], ['sudo dmesg --level=err,warn', 'kernel errors and warnings (hardware)']]
  },
  /* ------------------------------------------------------------------ 8 */
  {
    id: 'disks-and-space',
    title: 'Disks and space',
    topics: 'df -h, lsblk, du -sh, du | sort -h, findmnt, /etc/fstab, free -h',
    intro: 'Is my disk full? Which folder is so big? Which disks do I have? This lesson only reads; it touches no disk.',
    setup: 'L=$HOME/DBash/Learn/l8; rm -rf "$L"; mkdir -p "$L/videos"; head -c 5M /dev/zero > "$L/big.bin"; head -c 200K /dev/zero > "$L/small.bin"; head -c 1M /dev/zero > "$L/videos/clip.bin"',
    steps: [
      { title: 'Free space', explain: '`df` (*disk free*) shows every mounted disk. `-h` = human-readable sizes (G, M). Watch the **Use%** column.',
        task: '`df -h`', answer: 'df -h', check: { typed: '^df\\s+-\\w*h', out: 'Use%|Gebr|Size' }, hint: 'df -h', done: 'The line with Mounted on / is your system disk.' },
      { title: 'Your disks', explain: '`lsblk` shows every disk with its partitions as a tree: sda or nvme0n1 is a disk, sda1 or nvme0n1p1 a partition on it.',
        task: '`lsblk`', answer: 'lsblk', check: { typed: '^lsblk\\b' }, hint: 'lsblk', done: 'Use these real names when a command asks for a disk. Never guess them.' },
      { title: 'How big is a folder?', explain: '`du` (*disk usage*) adds up a folder. `-s` = only the total, `-h` = readable.',
        task: '`du -sh ~/DBash/Learn/l8`', answer: 'du -sh ~/DBash/Learn/l8', check: { typed: '^du\\s+-\\w*s', out: '\\d(\\.\\d)?M' }, hint: 'du -sh ~/DBash/Learn/l8', done: 'About 6 MB in total.' },
      { title: 'Find the biggest files', explain: '`du -ah` lists everything, `sort -h` sorts human sizes correctly, `tail` keeps the biggest. Use this on ~/Downloads when your disk is full.',
        task: '`du -ah ~/DBash/Learn/l8 | sort -h | tail -n 3`', answer: 'du -ah ~/DBash/Learn/l8 | sort -h | tail -n 3', check: { typed: '^du\\b.*\\|\\s*sort\\s+-\\w*h', out: 'big\\.bin' }, hint: 'du -ah ~/DBash/Learn/l8 | sort -h | tail -n 3', done: 'big.bin is the biggest file; the last line is the whole folder.' },
      { title: 'What is mounted where?', explain: 'A disk becomes usable once it is **mounted** on a folder (its mount point). `/` is the root of everything.',
        task: '`findmnt /`', answer: 'findmnt /', check: { typed: '^findmnt\\b' }, hint: 'findmnt /', done: 'SOURCE is the partition, FSTYPE the file system (ext4, btrfs…).' },
      { title: 'Mounted at boot', explain: '/etc/fstab lists which disks are mounted at boot: one line per disk with its UUID, mount point, type and options. A wrong line can stop your PC from booting, so read it but only change it with care (DBash shows changes as a diff first).',
        task: '`cat /etc/fstab`', answer: 'cat /etc/fstab', check: { typed: '^cat\\s+/etc/fstab' }, hint: 'cat /etc/fstab', done: 'Lines starting with # are comments. The option nofail lets a PC boot even when that disk is missing.' },
      { title: 'Memory', explain: 'Not a disk, but often asked together: `free -h` shows RAM and swap. **available** is what programs can still use.',
        task: '`free -h`', answer: 'free -h', check: { typed: '^free\\s+-\\w*h' }, hint: 'free -h', done: 'Linux uses free RAM as a cache, so "free" looks low. Look at "available".' }
    ],
    quiz: [
      { q: 'Your disk is full. Which command shows how full each disk is?', options: ['du -sh', 'df -h', 'free -h'], answer: 1, why: 'df = disk free per disk. du measures folders.' },
      { q: 'Which command finds big files in a folder?', options: ['du -ah FOLDER | sort -h | tail', 'lsblk FOLDER', 'findmnt FOLDER'], answer: 0, why: 'du measures, sort -h orders, tail keeps the biggest.' },
      { q: 'What is /etc/fstab?', options: ['a log file', 'the list of disks that are mounted at boot', 'the list of users'], answer: 1, why: 'One line per disk with its mount point and options.' }
    ],
    cheatsheet: [['df -h', 'free space per disk'], ['lsblk', 'disks and partitions as a tree'], ['du -sh FOLDER', 'total size of a folder'], ['du -ah FOLDER | sort -h | tail', 'the biggest files and folders'], ['findmnt /', 'which partition is mounted on /'], ['cat /etc/fstab', 'disks that are mounted at boot'], ['free -h', 'memory (look at "available")']]
  },
  /* ------------------------------------------------------------------ 9 */
  {
    id: 'processes',
    title: 'Processes',
    topics: 'ps aux, ps --sort, a job in the background with &, pgrep, kill, pkill, top -b, uptime',
    intro: 'Every running program is a process with a number, the PID. Here you learn to find processes, see what uses your CPU and memory, and stop a process that hangs.',
    setup: '',
    steps: [
      { title: 'All processes', explain: '`ps aux` lists every process: user, PID, %CPU, %MEM and the command.',
        task: '`ps aux | head -n 5`', answer: 'ps aux | head -n 5', check: { typed: '^ps\\s+\\w*a', out: 'PID' }, hint: 'ps aux | head -n 5', done: 'PID 1 is systemd: the first process, the parent of all others.' },
      { title: 'Memory hogs', explain: '`--sort=-%mem` sorts by memory, biggest first (the minus means *descending*).',
        task: '`ps aux --sort=-%mem | head -n 6`', answer: 'ps aux --sort=-%mem | head -n 6', check: { typed: '^ps\\b.*--sort' }, hint: 'ps aux --sort=-%mem | head -n 6', done: 'Use --sort=-%cpu for the CPU instead.' },
      { title: 'Something in the background', explain: '`&` at the end starts a command in the **background**: you get your prompt back right away. `sleep 4242` just waits 4242 seconds: a harmless process to practise on.',
        task: '`sleep 4242 &`', answer: 'sleep 4242 &', check: { typed: '^sleep\\s+4242\\s*&$', shell: 'for i in 1 2 3 4 5 6 7 8 9 10; do pgrep -f "^sleep 4242$" >/dev/null && exit 0; sleep 0.2; done; exit 1' }, hint: 'sleep 4242 &', done: 'bash answered with [1] and a PID: job 1 runs in the background.' },
      { title: 'Find a process', explain: '`pgrep -a NAME` finds processes by name and shows their PID.',
        task: '`pgrep -a sleep`', answer: 'pgrep -a sleep', check: { typed: '^pgrep\\b', out: '4242' }, hint: 'pgrep -a sleep', done: 'The number in front is the PID you need to stop it.' },
      { title: 'Stop it', explain: '`kill PID` politely asks a process to stop. `pkill -f TEXT` does it by name. If a program really hangs, `kill -9 PID` forces it (it cannot save anything then).',
        task: '`pkill -f "sleep 4242"`  (or kill with the PID from the last step)', answer: 'pkill -f "sleep 4242"', check: { typed: '^(kill|pkill)\\b', ok: null, shell: 'for i in 1 2 3 4 5 6 7 8 9 10; do pgrep -f "^sleep 4242$" >/dev/null || exit 0; sleep 0.2; done; exit 1' }, hint: 'pkill -f "sleep 4242"', done: 'The process is gone. Only stop processes you know.' },
      { title: 'A snapshot of top', explain: '`top` is the live task manager of the terminal (`htop` is a nicer one: q quits). `-b -n 1` takes one snapshot as plain text.',
        task: '`top -b -n 1 | head -n 15`', answer: 'top -b -n 1 | head -n 15', check: { typed: '^top\\b.*-b', out: 'PID' }, hint: 'top -b -n 1 | head -n 15', done: 'The top lines show uptime, load and memory; below are the busiest processes.' },
      { title: 'How busy is the PC?', explain: '`uptime` shows how long the PC runs and the **load average** for the last 1, 5 and 15 minutes. A load around your number of CPU threads = fully busy.',
        task: '`uptime`', answer: 'uptime', check: { typed: '^uptime\\b', out: 'load average' }, hint: 'uptime', done: '`nproc` tells you how many threads your CPU has.' }
    ],
    quiz: [
      { q: 'What is a PID?', options: ['the number of a process', 'a kind of file', 'a user group'], answer: 0, why: 'Process ID.' },
      { q: 'What does `&` at the end of a command do?', options: ['run it as root', 'run it in the background', 'run it twice'], answer: 1, why: 'You get your prompt back while it runs.' },
      { q: 'A program hangs and `kill PID` does not help. What next?', options: ['kill -9 PID', 'sudo reboot', 'rm PID'], answer: 0, why: '-9 forces it to stop (it cannot save anything).' }
    ],
    cheatsheet: [['ps aux', 'all processes'], ['ps aux --sort=-%mem | head', 'the biggest memory users'], ['COMMAND &', 'run in the background'], ['pgrep -a NAME', 'find a process and its PID'], ['kill PID', 'ask a process to stop (-9 = force)'], ['pkill -f TEXT', 'stop processes by name'], ['top -b -n 1 | head', 'one snapshot of top (htop: live, q quits)'], ['uptime', 'running time and load average']]
  },
  /* ------------------------------------------------------------------ 10 */
  {
    id: 'first-script',
    title: 'Your first Bash script',
    topics: 'variables, echo, for, if, a .sh file with nano, #!/bin/bash, $1, chmod +x',
    intro: 'Everything you type in the terminal can go into a file and run again: a script. You first try the building blocks right in the prompt, then you write a real script with nano.',
    setup: 'L=$HOME/DBash/Learn/l10; rm -rf "$L"; mkdir -p "$L"',
    steps: [
      { title: 'Into the practice folder', explain: 'Your script will live here.',
        task: '`cd ~/DBash/Learn/l10`', answer: 'cd ~/DBash/Learn/l10', check: { pwd: '^~/DBash/Learn/l10$' }, hint: 'cd ~/DBash/Learn/l10', done: 'Ready.' },
      { title: 'A variable', explain: 'A variable keeps a value under a name. No spaces around the `=`!',
        task: '`name=World`', answer: 'name=World', check: { typed: '^name=\\S+$' }, hint: 'name=World  (no spaces)', done: 'Nothing is printed: bash just remembers it.' },
      { title: 'Use the variable', explain: '`$name` is replaced by its value. Use double quotes: single quotes would print $name literally.',
        task: '`echo "Hello $name"`', answer: 'echo "Hello $name"', check: { typed: '\\$name', out: 'Hello \\S+' }, hint: 'echo "Hello $name"', done: 'bash replaced $name by its value.' },
      { title: 'A loop', explain: '`for` repeats commands for every item in a list. The parts: `for X in LIST; do COMMANDS; done`.',
        task: '`for f in one two three; do echo "item $f"; done`', answer: 'for f in one two three; do echo "item $f"; done', check: { typed: '^for\\b.*\\bdo\\b.*\\bdone$', out: 'item three' }, hint: 'for f in one two three; do echo "item $f"; done', done: 'Three lines from one command. Try for f in *.txt to loop over files.' },
      { title: 'A choice', explain: '`if` runs commands only when a test is true. `[ -d PATH ]` tests whether a folder exists, `[ -f PATH ]` whether a file exists.',
        task: '`if [ -d ~/DBash ]; then echo "found it"; else echo "missing"; fi`', answer: 'if [ -d ~/DBash ]; then echo "found it"; else echo "missing"; fi', check: { typed: '^if\\b.*\\bfi$', out: 'found it' }, hint: 'if [ -d ~/DBash ]; then echo "found it"; else echo "missing"; fi', done: 'Mind the spaces inside [ ]: they are needed.' },
      { title: 'Write the script', explain: 'Open the editor nano with `nano greet.sh` and type these 3 lines:\n#!/bin/bash\nname="$1"\necho "Hello, $name!"\nThe first line says which program runs the script. `$1` is the first word you give the script. Save with **Ctrl+O** and Enter, close with **Ctrl+X**.',
        task: '`nano greet.sh`', answer: 'nano greet.sh', check: { typed: '^nano\\s+greet\\.sh$', ok: null, shell: 'f="$HOME/DBash/Learn/l10/greet.sh"; head -n 1 "$f" | grep -q "^#!/bin/bash" && grep -q "\\$1" "$f" && grep -q "echo" "$f"' }, hint: 'In nano: type the 3 lines, Ctrl+O, Enter, Ctrl+X. Then check with cat greet.sh', done: 'Your script is saved.' },
      { title: 'Make it runnable', explain: 'Same as in lesson 4.',
        task: '`chmod +x greet.sh`', answer: 'chmod +x greet.sh', check: { shell: 'test -x "$HOME/DBash/Learn/l10/greet.sh"' }, hint: 'chmod +x greet.sh', done: 'Now it may run.' },
      { title: 'Run it', explain: 'The word after the script name becomes `$1`.',
        task: '`./greet.sh Linux`', answer: './greet.sh Linux', check: { typed: '^\\./greet\\.sh\\s+\\S+', out: 'Hello, \\S+' }, hint: './greet.sh Linux', done: 'You wrote a program. Put scripts you like in ~/bin or ~/.local/bin to run them from anywhere.' }
    ],
    quiz: [
      { q: 'What does the first line `#!/bin/bash` do?', options: ['it is a comment with the date', 'it says which program runs the script', 'it makes the file runnable'], answer: 1, why: 'The "shebang" line. Runnable comes from chmod +x.' },
      { q: 'You run `./greet.sh Anna`. What is $1?', options: ['greet.sh', 'Anna', '1'], answer: 1, why: '$1 is the first word after the script name.' },
      { q: 'Which line sets a variable correctly?', options: ['name = Anna', 'name=Anna', '$name=Anna'], answer: 1, why: 'No spaces around =, and no $ when you set it.' }
    ],
    cheatsheet: [['name=VALUE', 'set a variable (no spaces around =)'], ['echo "Hi $name"', 'use a variable'], ['for x in a b c; do …; done', 'repeat for every item'], ['if [ -f FILE ]; then …; fi', 'only when a test is true (-d = folder)'], ['nano FILE', 'edit a file (Ctrl+O save, Ctrl+X close)'], ['#!/bin/bash', 'first line of a bash script'], ['$1', 'the first word given to a script']]
  },
  /* ------------------------------------------------------------------ 11 */
  {
    id: 'network',
    title: 'Network',
    topics: 'hostname, ip -br a, ip route, ping, /etc/resolv.conf, ss -tulpn, nmcli, curl -I',
    intro: 'Is my PC online? Which address does it have? Which programs listen on the network? This lesson only reads: nothing changes.',
    setup: '',
    steps: [
      { title: 'The name of your PC', explain: 'Every computer on a network has a name, the **hostname**. It is also in your prompt, after the @.',
        task: '`hostname`', answer: 'hostname', check: { typed: '^hostname$' }, hint: 'hostname', done: 'Other PCs on your network can often find yours by this name.' },
      { title: 'Your addresses', explain: '`ip` shows and changes the network. `ip -br a` gives a *brief* list of every network card and its **address**: `lo` is the loopback (the PC talking to itself, 127.0.0.1), and names like `enp5s0` or `wlp3s0` are your cable or Wi-Fi.',
        task: '`ip -br a`', answer: 'ip -br a', check: { typed: '^ip\\s+(-\\w+\\s+)*a(ddr(ess)?)?\\b', out: '127\\.0\\.0\\.1' }, hint: 'ip -br a', done: 'UP = connected. Addresses like 192.168.x.x are only valid inside your home network.' },
      { title: 'The way out', explain: '`ip route` shows where network traffic goes. The **default via** line is your router: everything to the internet goes through it.',
        task: '`ip route`', answer: 'ip route', check: { typed: '^ip\\s+r(oute)?\\b' }, hint: 'ip route', done: 'No default line = no way to the internet.' },
      { title: 'Can I reach it?', explain: '`ping` sends a few small packets and measures how long the answer takes, in milliseconds. `-c 3` = 3 times, else it goes on until Ctrl+C.',
        task: '`ping -c 3 debian.org`', answer: 'ping -c 3 debian.org', check: { typed: '^ping\\b.*-c\\s*\\d', ok: null }, hint: 'ping -c 3 debian.org', done: '0% packet loss = the connection works. "Name or service not known" = a name (DNS) problem, not a cable problem.' },
      { title: 'Names into addresses', explain: 'DNS turns names like debian.org into addresses. /etc/resolv.conf says which DNS server your PC asks. 127.0.0.53 means a helper on your own PC (systemd-resolved) asks for you.',
        task: '`cat /etc/resolv.conf`', answer: 'cat /etc/resolv.conf', check: { typed: '^cat\\s+/etc/resolv\\.conf', out: 'nameserver' }, hint: 'cat /etc/resolv.conf', done: 'Ping works with an address but not with a name? Then look here.' },
      { title: 'Who is listening?', explain: '`ss` shows network connections. `-tulpn` = TCP and UDP, only *listening*, with numbers and the program. Every line is a door that is open to the network.',
        task: '`ss -tulpn`', answer: 'ss -tulpn', check: { typed: '^ss\\b' }, hint: 'ss -tulpn', done: 'Addresses with 127.0.0.1 only listen on your own PC; 0.0.0.0 or * listen on the whole network. sudo ss -tulpn also shows the program names of system services.' },
      { title: 'NetworkManager', explain: 'On most desktops NetworkManager handles cable and Wi-Fi. `nmcli` is its command line: the same as the network icon in your panel.',
        task: '`nmcli device status`', answer: 'nmcli device status', check: { typed: '^nmcli\\b', ok: null }, hint: 'nmcli device status', done: '`nmcli device wifi list` shows the Wi-Fi networks around you.' },
      { title: 'Is a website up?', explain: '`curl` fetches a web address. `-I` asks only for the *headers*: the first line has the status code, 200 = OK, 301/302 = moved, 404 = not found.',
        task: '`curl -I https://www.debian.org`', answer: 'curl -I https://www.debian.org', check: { typed: '^curl\\s+(-\\w*I\\w*|--head)\\b', ok: null }, hint: 'curl -I https://www.debian.org', done: 'Now you can check a connection step by step: address, route, ping, DNS, website.' }
    ],
    quiz: [
      { q: 'Ping to 9.9.9.9 works, ping to debian.org says "Name or service not known". Where is the problem?', options: ['the cable', 'DNS (names into addresses)', 'the website'], answer: 1, why: 'The connection works with an address, so only the name lookup fails.' },
      { q: 'Which line of `ip route` points to your router?', options: ['the default via line', 'the lo line', 'the last line'], answer: 0, why: 'default via = where everything to the internet goes.' },
      { q: 'What does `ss -tulpn` show?', options: ['the Wi-Fi networks around you', 'the programs that listen on the network', 'your internet speed'], answer: 1, why: 'Listening TCP/UDP ports and their program.' }
    ],
    cheatsheet: [['hostname', 'the name of your PC'], ['ip -br a', 'your network cards and addresses'], ['ip route', 'where traffic goes (default via = your router)'], ['ping -c 3 HOST', 'can I reach it, and how fast'], ['cat /etc/resolv.conf', 'which DNS server your PC asks'], ['ss -tulpn', 'programs that listen on the network'], ['nmcli device status', 'cable and Wi-Fi (NetworkManager)'], ['curl -I URL', 'is a website up (200 = OK)']]
  },
  /* ------------------------------------------------------------------ 12 */
  {
    id: 'archives',
    title: 'Archives',
    topics: 'tar -czf, tar -tzf, tar -xzf -C, gzip, gunzip, ls -lh',
    intro: 'A .tar.gz packs many files into one smaller file: for backups, for sending, and most software downloads come like this. You pack, look inside and unpack, all in the practice folder.',
    setup: 'L=$HOME/DBash/Learn/l12; rm -rf "$L"; mkdir -p "$L/photos"; for n in beach snow city; do head -c 40K /dev/zero > "$L/photos/$n.jpg"; done; seq 1 2000 > "$L/notes.txt"',
    steps: [
      { title: 'Into the practice folder', explain: 'There is a folder photos with 3 files, and a text file notes.txt.',
        task: '`cd ~/DBash/Learn/l12`', answer: 'cd ~/DBash/Learn/l12', check: { pwd: '^~/DBash/Learn/l12$' }, hint: 'cd ~/DBash/Learn/l12', done: 'Ready.' },
      { title: 'Pack a folder', explain: '`tar` packs files. The letters: **c** = create, **z** = compress with gzip, **f** = the file name comes next. First the new file, then what goes in it.',
        task: '`tar -czf photos.tar.gz photos`', answer: 'tar -czf photos.tar.gz photos', check: { typed: '^tar\\s', shell: 'test -s "$HOME/DBash/Learn/l12/photos.tar.gz"' }, hint: 'tar -czf photos.tar.gz photos', done: 'One file now holds the whole folder.' },
      { title: 'Look inside', explain: '**t** = list what is in it, without unpacking. Always do this with an archive you downloaded: then you know where its files will land.',
        task: '`tar -tzf photos.tar.gz`', answer: 'tar -tzf photos.tar.gz', check: { typed: '^tar\\s+-?\\w*t', out: 'photos/' }, hint: 'tar -tzf photos.tar.gz', done: 'Everything is inside a folder photos/, so unpacking will not scatter files around.' },
      { title: 'How much smaller?', explain: '`ls -lh` shows sizes in K, M and G (h = human).',
        task: '`ls -lh`', answer: 'ls -lh', check: { typed: '^ls\\s+-\\w*l', out: 'photos\\.tar\\.gz' }, hint: 'ls -lh', done: 'These practice photos are only zeros, so they pack extremely well. Real photos hardly get smaller: they are compressed already.' },
      { title: 'A place to unpack', explain: 'Make a separate folder, so you do not overwrite the originals.',
        task: '`mkdir restore`', answer: 'mkdir restore', check: { shell: 'test -d "$HOME/DBash/Learn/l12/restore"' }, hint: 'mkdir restore', done: 'Empty folder ready.' },
      { title: 'Unpack', explain: '**x** = extract. `-C FOLDER` unpacks into that folder instead of the one you are in.',
        task: '`tar -xzf photos.tar.gz -C restore`', answer: 'tar -xzf photos.tar.gz -C restore', check: { typed: '^tar\\s+-?\\w*x', shell: 'test -f "$HOME/DBash/Learn/l12/restore/photos/beach.jpg"' }, hint: 'tar -xzf photos.tar.gz -C restore', done: 'Check with ls restore/photos. Remember: c = create, t = list, x = extract.' },
      { title: 'Compress one file', explain: '`gzip` compresses a single file and **replaces** it with FILE.gz.',
        task: '`gzip notes.txt`', answer: 'gzip notes.txt', check: { shell: 'cd "$HOME/DBash/Learn/l12" && test -f notes.txt.gz && test ! -e notes.txt' }, hint: 'gzip notes.txt', done: 'notes.txt is gone, notes.txt.gz is there. Logs in /var/log are often kept like this.' },
      { title: 'And back', explain: '`gunzip` makes the normal file again. `zcat FILE.gz` shows it without unpacking.',
        task: '`gunzip notes.txt.gz`', answer: 'gunzip notes.txt.gz', check: { shell: 'cd "$HOME/DBash/Learn/l12" && test -f notes.txt && test ! -e notes.txt.gz' }, hint: 'gunzip notes.txt.gz', done: 'For .zip files there is unzip (sudo apt install unzip if it is missing).' }
    ],
    quiz: [
      { q: 'Which letter of tar unpacks?', options: ['c', 't', 'x'], answer: 2, why: 'c = create, t = list, x = extract.' },
      { q: 'Why look inside an archive (tar -tzf) before you unpack it?', options: ['it makes unpacking faster', 'to see where the files will land', 'it is required'], answer: 1, why: 'Some archives drop many files in the folder you are in.' },
      { q: 'What does `gzip notes.txt` do with notes.txt?', options: ['it keeps it and makes a copy', 'it replaces it with notes.txt.gz', 'it deletes it without a copy'], answer: 1, why: 'gzip replaces the file; gunzip turns it back.' }
    ],
    cheatsheet: [['tar -czf NEW.tar.gz FOLDER', 'pack and compress a folder'], ['tar -tzf FILE.tar.gz', 'look inside without unpacking'], ['tar -xzf FILE.tar.gz -C FOLDER', 'unpack into a folder'], ['gzip FILE', 'compress one file (replaces it)'], ['gunzip FILE.gz', 'uncompress again'], ['zcat FILE.gz', 'show a .gz file without unpacking'], ['unzip FILE.zip', 'unpack a .zip']]
  },
  /* ------------------------------------------------------------------ 13 */
  {
    id: 'ssh-keys',
    title: 'SSH and keys',
    topics: 'ssh -V, ssh-keygen, public and private key, fingerprint, ~/.ssh, ssh -G, ssh user@host',
    intro: 'With SSH you work in the terminal of another computer: a server, a Raspberry Pi, a Steam Deck. Keys log you in safely without a password. You make a practice key in the practice folder; your real ~/.ssh is only read.',
    requires: [['ssh-keygen', 'openssh-client']],
    setup: 'L=$HOME/DBash/Learn/l13; rm -rf "$L"; mkdir -p "$L"',
    steps: [
      { title: 'Is SSH there?', explain: '`ssh -V` shows the version of the OpenSSH client. It is on almost every Linux PC.',
        task: '`ssh -V`', answer: 'ssh -V', check: { typed: '^ssh\\s+-V$', ok: null, out: 'OpenSSH' }, hint: 'ssh -V  (a capital V)', done: 'The client can connect to other PCs. Accepting connections needs the server part (openssh-server).' },
      { title: 'Make a key pair', explain: 'A key pair is two files: a **private** key that never leaves your PC, and a **public** key (.pub) that you give to servers. `-t ed25519` is the modern type, `-f` the file, and `-N ""` means no passphrase. That is only OK for this practice key: give real keys a passphrase.',
        task: '`ssh-keygen -t ed25519 -f ~/DBash/Learn/l13/demo_key -N ""`', answer: 'ssh-keygen -t ed25519 -f ~/DBash/Learn/l13/demo_key -N ""', check: { typed: '^ssh-keygen\\b', shell: 'test -f "$HOME/DBash/Learn/l13/demo_key" && test -f "$HOME/DBash/Learn/l13/demo_key.pub"' }, hint: 'ssh-keygen -t ed25519 -f ~/DBash/Learn/l13/demo_key -N ""', done: 'Two files: demo_key (private) and demo_key.pub (public).' },
      { title: 'Two files, two kinds of permission', explain: 'Look at the permissions from lesson 4.',
        task: '`ls -l ~/DBash/Learn/l13`', answer: 'ls -l ~/DBash/Learn/l13', check: { typed: '^ls\\s+-\\w*l', out: 'demo_key\\.pub' }, hint: 'ls -l ~/DBash/Learn/l13', done: 'The private key is -rw------- (only you). ssh refuses a private key that others can read.' },
      { title: 'The public key', explain: 'The public key is one line of text. This is what you paste into a server or into GitHub (Settings → SSH keys). It is safe to share.',
        task: '`cat ~/DBash/Learn/l13/demo_key.pub`', answer: 'cat ~/DBash/Learn/l13/demo_key.pub', check: { typed: '^cat\\b.*demo_key\\.pub', out: 'ssh-ed25519 ' }, hint: 'cat ~/DBash/Learn/l13/demo_key.pub', done: 'Never cat and share the file without .pub: that is the private key.' },
      { title: 'The fingerprint', explain: 'A fingerprint is a short checksum of a key. When you connect to a new server, ssh shows *its* fingerprint and asks if you trust it.',
        task: '`ssh-keygen -lf ~/DBash/Learn/l13/demo_key.pub`', answer: 'ssh-keygen -lf ~/DBash/Learn/l13/demo_key.pub', check: { typed: '^ssh-keygen\\s+-\\w*l', out: 'ED25519' }, hint: 'ssh-keygen -lf ~/DBash/Learn/l13/demo_key.pub', done: 'SHA256:… is the fingerprint.' },
      { title: 'Your own ~/.ssh', explain: 'Your real keys live in ~/.ssh: id_ed25519 (private), id_ed25519.pub, known_hosts (servers you trust) and maybe config. This step only reads. The folder may not exist yet: that is fine.',
        task: '`ls -la ~/.ssh`', answer: 'ls -la ~/.ssh', check: { typed: '^ls\\b.*\\.ssh', ok: null }, hint: 'ls -la ~/.ssh', done: 'Make your real key later with ssh-keygen -t ed25519 (Enter for the default file, and choose a passphrase).' },
      { title: 'Connecting, without connecting', explain: 'You connect with `ssh user@host`, and `ssh-copy-id user@host` puts your public key on that server. `ssh -G host` shows the settings ssh *would* use, without connecting: a safe way to see it.',
        task: '`ssh -G example.com | head -n 5`', answer: 'ssh -G example.com | head -n 5', check: { typed: '^ssh\\s+-G\\b', out: 'hostname' }, hint: 'ssh -G example.com | head -n 5', done: 'In DBash, ssh opens in the full-screen panel, so you can work on the other PC right here.' }
    ],
    quiz: [
      { q: 'Which file do you give to a server?', options: ['demo_key', 'demo_key.pub', 'known_hosts'], answer: 1, why: 'The public key (.pub). The private key never leaves your PC.' },
      { q: 'ssh says it does not know the fingerprint of a new server. What does that mean?', options: ['the server is broken', 'ssh asks if you trust this server', 'your key is wrong'], answer: 1, why: 'First connection: check the fingerprint, then answer yes; it goes into known_hosts.' },
      { q: 'Which permissions does a private key need?', options: ['-rw------- (only you)', '-rw-r--r-- (everybody may read)', '-rwxrwxrwx'], answer: 0, why: 'ssh refuses a private key that others can read.' }
    ],
    cheatsheet: [['ssh USER@HOST', 'work in the terminal of another PC'], ['ssh-keygen -t ed25519', 'make a key pair (choose a passphrase)'], ['ssh-copy-id USER@HOST', 'put your public key on a server'], ['ssh-keygen -lf FILE.pub', 'the fingerprint of a key'], ['~/.ssh', 'your keys, known_hosts and config'], ['ssh -G HOST', 'the settings ssh would use (no connection)']]
  }
  ]
};
