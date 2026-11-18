// DBash: a smart Debian terminal with a local AI.
// This is the backend of the Tauri app: system info, commands (plain and in a real PTY),
// the llamafile model server, web fetches, downloads and self-update. The screen is in ../src.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::Duration;
use tauri::{Emitter, Manager, State};

struct AppState {
    model: Mutex<Option<Child>>,
}

fn home() -> PathBuf {
    std::env::var("HOME").map(PathBuf::from).unwrap_or_else(|_| PathBuf::from("/tmp"))
}

fn expand(p: &str) -> PathBuf {
    if let Some(rest) = p.strip_prefix("~/") {
        home().join(rest)
    } else if p == "~" {
        home()
    } else {
        PathBuf::from(p)
    }
}

fn config_dir() -> PathBuf {
    let d = home().join(".config/dbash");
    let _ = fs::create_dir_all(&d);
    d
}

/// The AppImage adds its own libraries to LD_LIBRARY_PATH, PATH, XDG_DATA_DIRS, ...
/// System programs (flatpak, steam, ...) break when they inherit those, so every
/// child process gets the environment without the AppImage parts.
fn clean_env_std(c: &mut Command) {
    for (k, v) in schone_env() { match v { Some(v) => { c.env(k, v); } None => { c.env_remove(k); } } }
}
fn clean_env_tokio(c: &mut tokio::process::Command) {
    for (k, v) in schone_env() { match v { Some(v) => { c.env(k, v); } None => { c.env_remove(k); } } }
}
fn schone_env() -> Vec<(String, Option<String>)> {
    let appdir = std::env::var("APPDIR").unwrap_or_default();
    let mut out = Vec::new();
    if appdir.is_empty() { return out; }
    for (k, v) in std::env::vars() {
        if ["APPDIR", "APPIMAGE", "ARGV0", "OWD", "APPIMAGE_SILENT_INSTALL"].contains(&k.as_str()) { out.push((k, None)); continue; }
        if k == "GTK_THEME" && v.is_empty() { out.push((k, None)); continue; }
        if !v.contains(&appdir) { continue; }
        let delen: Vec<&str> = v.split(':').filter(|d| !d.is_empty() && !d.contains(&appdir)).collect();
        if delen.is_empty() { out.push((k, None)); } else { out.push((k, Some(delen.join(":")))); }
    }
    out
}

fn sh(cmd: &str) -> String {
    let mut c = Command::new("bash");
    c.arg("-c").arg(cmd);
    clean_env_std(&mut c);
    c.output()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_default()
}

// ---------------------------------------------------------------- system info
#[derive(Serialize)]
struct SysInfo {
    user: String,
    host: String,
    home: String,
    os: String,
    os_id: String,
    desktop: String,
    gpu: String,
    vram_gb: u64,
    cpu: String,
    ram_gb: u64,
    root_fs: String,
    hf_base: Option<String>,
    gh_base: Option<String>,
    version: String,
    /// the standalone dbash-x.y.z.sh this copy was started from (only that version can update itself)
    sh_path: Option<String>,
}

#[tauri::command]
fn system_info() -> SysInfo {
    let osr = fs::read_to_string("/etc/os-release").unwrap_or_default();
    let get = |k: &str| {
        osr.lines()
            .find_map(|l| l.strip_prefix(&format!("{k}=")))
            .map(|v| v.trim_matches('"').to_string())
            .unwrap_or_default()
    };
    let desktop = {
        let d = std::env::var("XDG_CURRENT_DESKTOP").unwrap_or_default();
        if d.to_uppercase().contains("KDE") { "KDE Plasma".to_string() } else { d }
    };
    let gpu = sh("lspci 2>/dev/null | grep -Ei 'vga|3d|display' | head -1 | sed 's/^[^:]*: //'");
    let mut vram: u64 = 0;
    if let Ok(rd) = fs::read_dir("/sys/class/drm") {
        for e in rd.flatten() {
            let p = e.path().join("device/mem_info_vram_total");
            if let Ok(t) = fs::read_to_string(&p) {
                if let Ok(b) = t.trim().parse::<u64>() {
                    vram = vram.max((b + (1u64 << 29)) >> 30);
                }
            }
        }
    }
    let cpu = fs::read_to_string("/proc/cpuinfo")
        .unwrap_or_default()
        .lines()
        .find_map(|l| l.strip_prefix("model name").map(|r| r.trim_start_matches([' ', '\t', ':']).trim().to_string()))
        .unwrap_or_default();
    let ram_kb: u64 = fs::read_to_string("/proc/meminfo")
        .unwrap_or_default()
        .lines()
        .find_map(|l| l.strip_prefix("MemTotal:").map(|r| r.trim().trim_end_matches("kB").trim().parse().unwrap_or(0)))
        .unwrap_or(0);
    SysInfo {
        hf_base: std::env::var("DBASH_HF").ok(),
        gh_base: std::env::var("DBASH_GH").ok(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        sh_path: std::env::var("DBASH_SH").ok().filter(|p| Path::new(p).is_file()),
        user: std::env::var("USER").unwrap_or_else(|_| sh("whoami")),
        host: fs::read_to_string("/etc/hostname").map(|h| h.trim().to_string()).unwrap_or_else(|_| sh("hostname")),
        home: home().to_string_lossy().to_string(),
        os: get("PRETTY_NAME"),
        os_id: get("ID"),
        desktop,
        gpu,
        vram_gb: vram,
        cpu,
        ram_gb: (ram_kb + 512 * 1024) / (1024 * 1024),
        root_fs: sh("findmnt -no FSTYPE / 2>/dev/null"),
    }
}

// ---------------------------------------------------------------- run commands
#[derive(Serialize)]
struct CmdResult {
    code: i32,
    stdout: String,
    stderr: String,
    sudo_note: String,
    running: bool,
    pid: u32,
}

fn forceer_sudo_a(cmd: &str) -> String {
    let mut out = String::with_capacity(cmd.len() + 8);
    let mut prev: Option<char> = None;
    let mut i = 0;
    while i < cmd.len() {
        let rest = &cmd[i..];
        let at_start = prev.map_or(true, |p| " ;&|(\n".contains(p));
        if at_start && rest.starts_with("sudo ") && !rest.starts_with("sudo -A") { out.push_str("sudo -A "); i += 5; prev = Some(' '); continue; }
        let ch = rest.chars().next().unwrap(); out.push(ch); prev = Some(ch); i += ch.len_utf8();
    }
    out
}

/// Does sudo need a password right now? (false = cached or NOPASSWD)
#[tauri::command]
fn sudo_needs_password() -> bool {
    let mut c = Command::new("sudo");
    c.arg("-n").arg("true").stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
    clean_env_std(&mut c);
    !c.status().map(|s| s.success()).unwrap_or(false)
}

#[tauri::command]
async fn run_command(cmd: String, detach_after: Option<u64>, password: Option<String>) -> Result<CmdResult, String> {
    use tokio::io::AsyncReadExt;
    // sudo password typed in DBash: handed to sudo through a private, temporary askpass helper
    // (in $XDG_RUNTIME_DIR = RAM, only readable by you, deleted right after the command)
    let (eigen_askpass, opruim): (Option<String>, Vec<PathBuf>) = match &password {
        Some(pw) if !pw.is_empty() => { let (helper, files) = maak_askpass(pw)?; (Some(helper.to_string_lossy().to_string()), files) }
        _ => (None, Vec::new()),
    };
    let (cmd2, askpass) = if let Some(a) = &eigen_askpass { (forceer_sudo_a(&cmd), Some(a.clone())) } else { (cmd.clone(), None) };
    let mut c = tokio::process::Command::new("bash");
    c.arg("-lc").arg(&cmd2).current_dir(home()).env("DBASH", "1")
        .stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::piped());
    clean_env_tokio(&mut c);
    let sudo_note = String::new();
    if let Some(a) = &askpass {
        c.env("SUDO_ASKPASS", a);
    }
    let mut child = match c.spawn() { Ok(ch) => ch, Err(e) => { for f in &opruim { let _ = fs::remove_file(f); } return Err(e.to_string()); } };
    let pid = child.id().unwrap_or(0);
    let out_buf = std::sync::Arc::new(Mutex::new(Vec::<u8>::new()));
    let err_buf = std::sync::Arc::new(Mutex::new(Vec::<u8>::new()));
    let mut so = child.stdout.take().unwrap();
    let mut se = child.stderr.take().unwrap();
    let (ob, eb) = (out_buf.clone(), err_buf.clone());
    // keep draining the pipes even after we stop waiting, so the program never blocks
    tokio::spawn(async move { let mut b = [0u8; 8192]; while let Ok(n) = so.read(&mut b).await { if n == 0 { break; } let mut g = ob.lock().unwrap(); if g.len() < 400_000 { g.extend_from_slice(&b[..n]); } } });
    tokio::spawn(async move { let mut b = [0u8; 8192]; while let Ok(n) = se.read(&mut b).await { if n == 0 { break; } let mut g = eb.lock().unwrap(); if g.len() < 400_000 { g.extend_from_slice(&b[..n]); } } });
    let wacht = Duration::from_secs(detach_after.unwrap_or(60 * 60));
    let (code, running) = match tokio::time::timeout(wacht, child.wait()).await {
        Ok(st) => (st.map_err(|e| e.to_string())?.code().unwrap_or(-1), false),
        Err(_) => {
            if detach_after.is_some() {
                // let it run on its own (e.g. Steam, Heroic, Firefox)
                tokio::spawn(async move { let _ = child.wait().await; });
                (0, true)
            } else {
                let _ = child.kill().await;
                for f in &opruim { let _ = fs::remove_file(f); }
                return Err("Command took longer than 60 minutes and was stopped.".into());
            }
        }
    };
    tokio::time::sleep(Duration::from_millis(80)).await;
    for f in &opruim { let _ = fs::remove_file(f); }
    let cut = |v: &[u8]| { let s = String::from_utf8_lossy(v).to_string(); if s.len() > 200_000 { format!("{}\n… (output cut)", &s[..200_000]) } else { s } };
    let stdout = cut(&out_buf.lock().unwrap());
    let stderr = cut(&err_buf.lock().unwrap());
    Ok(CmdResult { code, stdout, stderr, sudo_note, running, pid })
}

#[tauri::command]
fn is_command(word: String) -> bool {
    if word.is_empty() || !word.chars().all(|c| c.is_ascii_alphanumeric() || "-_.+/".contains(c)) { return false; }
    let mut c = Command::new("bash");
    c.arg("-lc").arg(format!("type -t -- '{}' >/dev/null 2>&1", word));
    clean_env_std(&mut c);
    c.status().map(|s| s.success()).unwrap_or(false)
}

// ---------------------------------------------------------------- models
#[derive(Serialize)]
struct ModelFile {
    naam: String,
    pad: String,
    gb: f64,
    soort: String,
    map: String,
}

#[tauri::command]
fn list_models(dirs: Vec<String>) -> Vec<ModelFile> {
    let mut v = Vec::new();
    for d in dirs {
        let dir = expand(&d);
        if let Ok(rd) = fs::read_dir(&dir) {
            for e in rd.flatten() {
                let p = e.path();
                let name = p.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
                let soort = if name.ends_with(".llamafile") { "llamafile" } else if name.ends_with(".gguf") { "gguf" } else { continue };
                let size = e.metadata().map(|m| m.len()).unwrap_or(0);
                v.push(ModelFile {
                    naam: name.trim_end_matches(".llamafile").trim_end_matches(".gguf").to_string(),
                    pad: p.to_string_lossy().to_string(),
                    gb: (size as f64 / 1e8).round() / 10.0,
                    soort: soort.into(),
                    map: d.clone(),
                });
            }
        }
    }
    v.sort_by(|a, b| a.gb.partial_cmp(&b.gb).unwrap_or(std::cmp::Ordering::Equal));
    v
}

fn stop(state: &State<AppState>) {
    if let Some(mut ch) = state.model.lock().unwrap().take() {
        let _ = ch.kill();
        let _ = ch.wait();
    }
}

#[tauri::command]
fn start_model(state: State<AppState>, path: String, gpu: bool, port: u16, ctx: Option<u32>) -> Result<String, String> {
    stop(&state);
    let p = expand(&path);
    if !p.exists() {
        return Err(format!("Model not found: {}", p.display()));
    }
    let mut args: Vec<String> = Vec::new();
    let program: PathBuf;
    if p.extension().map(|e| e == "gguf").unwrap_or(false) {
        // .gguf needs the llamafile engine next to it (file called "llamafile")
        let engine = p.parent().unwrap_or(Path::new(".")).join("llamafile");
        if !engine.exists() {
            return Err(format!("For .gguf models put the llamafile engine here: {}", engine.display()));
        }
        program = engine;
        args.push("-m".into());
        args.push(p.to_string_lossy().to_string());
    } else {
        program = p.clone();
    }
    args.extend(["--server", "--host", "127.0.0.1", "--port"].iter().map(|s| s.to_string()));
    args.push(port.to_string());
    if gpu {
        args.extend(["--gpu", "vulkan", "-ngl", "999"].iter().map(|s| s.to_string()));
    } else {
        args.extend(["-ngl", "0"].iter().map(|s| s.to_string()));
    }
    args.extend(["--reasoning", "off"].iter().map(|s| s.to_string()));
    if let Some(c) = ctx { if c >= 2048 { args.push("-c".into()); args.push(c.to_string()); } }
    let log = config_dir().join("llamafile.log");
    let mut lf = fs::File::create(&log).map_err(|e| e.to_string())?;
    let _ = writeln!(lf, "$ sh {} {}", program.display(), args.join(" "));
    let lf2 = lf.try_clone().map_err(|e| e.to_string())?;
    // run through `sh` so it also works when binfmt_misc would grab the APE file
    let mut cmd = Command::new("sh");
    clean_env_std(&mut cmd);
    let child = cmd
        .arg(&program)
        .args(&args)
        .stdin(Stdio::null())
        .stdout(Stdio::from(lf))
        .stderr(Stdio::from(lf2))
        .spawn()
        .map_err(|e| e.to_string())?;
    *state.model.lock().unwrap() = Some(child);
    Ok(format!("sh {} {}", program.display(), args.join(" ")))
}

#[derive(Serialize)]
struct ModelStatus {
    running: bool,
    ready: bool,
    log_tail: String,
}

#[tauri::command]
async fn model_status(state: State<'_, AppState>, port: u16) -> Result<ModelStatus, String> {
    let running = {
        let mut g = state.model.lock().unwrap();
        match g.as_mut() {
            Some(ch) => matches!(ch.try_wait(), Ok(None)),
            None => false,
        }
    };
    let ready = reqwest::Client::new()
        .get(format!("http://127.0.0.1:{port}/v1/models"))
        .timeout(Duration::from_millis(800))
        .send()
        .await
        .map(|r| r.status().is_success())
        .unwrap_or(false);
    let log = fs::read_to_string(config_dir().join("llamafile.log")).unwrap_or_default();
    let tail: Vec<&str> = log.lines().rev().take(12).collect();
    Ok(ModelStatus { running, ready, log_tail: tail.into_iter().rev().collect::<Vec<_>>().join("\n") })
}

#[tauri::command]
fn stop_model(state: State<AppState>) {
    stop(&state);
}

// ---------------------------------------------------------------- AI chat (streaming via events)
#[derive(Serialize, Clone)]
struct Chunk {
    id: String,
    line: String,
}

static AI_STOP: Mutex<Vec<String>> = Mutex::new(Vec::new());

/// Stop an AI answer that is still streaming (closing the connection stops llamafile too)
#[tauri::command]
fn ai_stop(id: String) { AI_STOP.lock().unwrap().push(id); }

#[tauri::command]
async fn ai_chat(app: tauri::AppHandle, id: String, port: u16, body: serde_json::Value) -> Result<(), String> {
    let mut resp = reqwest::Client::new()
        .post(format!("http://127.0.0.1:{port}/v1/chat/completions"))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("AI not reachable: {e}"))?;
    if !resp.status().is_success() {
        return Err(format!("AI answered with HTTP {}", resp.status()));
    }
    let mut buf = String::new();
    while let Some(bytes) = resp.chunk().await.map_err(|e| e.to_string())? {
        { let mut st = AI_STOP.lock().unwrap(); if let Some(i) = st.iter().position(|x| x == &id) { st.remove(i); return Ok(()); } }
        buf.push_str(&String::from_utf8_lossy(&bytes));
        while let Some(pos) = buf.find('\n') {
            let line: String = buf.drain(..=pos).collect();
            let _ = app.emit("ai-chunk", Chunk { id: id.clone(), line: line.trim_end().to_string() });
        }
    }
    if !buf.trim().is_empty() {
        let _ = app.emit("ai-chunk", Chunk { id: id.clone(), line: buf.trim().to_string() });
    }
    Ok(())
}

// ---------------------------------------------------------------- web
#[derive(Serialize)]
struct WebPage {
    status: u16,
    url: String,
    content_type: String,
    body: String,
}

#[tauri::command]
async fn fetch_url(url: String) -> Result<WebPage, String> {
    if !(url.starts_with("http://") || url.starts_with("https://")) {
        return Err("Only http(s) addresses".into());
    }
    let r = reqwest::Client::builder()
        .user_agent(concat!("Mozilla/5.0 (X11; Linux x86_64) DBash/", env!("CARGO_PKG_VERSION")))
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let status = r.status().as_u16();
    let final_url = r.url().to_string();
    let ct = r.headers().get("content-type").and_then(|v| v.to_str().ok()).unwrap_or("").to_string();
    let bytes = r.bytes().await.map_err(|e| e.to_string())?;
    let body = String::from_utf8_lossy(&bytes[..bytes.len().min(3_000_000)]).to_string();
    Ok(WebPage { status, url: final_url, content_type: ct, body })
}

#[tauri::command]
fn save_text(name: String, content: String) -> Result<String, String> {
    let safe: String = name.chars().filter(|c| c.is_ascii_alphanumeric() || "-_.".contains(*c)).collect();
    if safe.is_empty() || safe.starts_with('.') {
        return Err("Bad file name".into());
    }
    let dir = if safe.contains("backup") { home().join("DBash/Backups") } else { home().join("DBash/Exports") };
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let p = dir.join(&safe);
    fs::write(&p, content).map_err(|e| e.to_string())?;
    Ok(p.to_string_lossy().to_string())
}

/// Known browsers: (id, label, command). "default" uses the desktop's own choice.
const BROWSERS: &[(&str, &str, &str)] = &[
    ("default", "System default (xdg-open)", "xdg-open"),
    ("firefox", "Firefox", "firefox"),
    ("firefox-esr", "Firefox ESR", "firefox-esr"),
    ("chromium", "Chromium", "chromium"),
    ("google-chrome", "Google Chrome", "google-chrome"),
    ("brave", "Brave", "brave-browser"),
    ("vivaldi", "Vivaldi", "vivaldi"),
    ("librewolf", "LibreWolf", "librewolf"),
    ("falkon", "Falkon (KDE)", "falkon"),
    ("konqueror", "Konqueror (KDE)", "konqueror"),
    ("flatpak-firefox", "Firefox (Flatpak)", "flatpak run org.mozilla.firefox"),
    ("flatpak-chromium", "Chromium (Flatpak)", "flatpak run org.chromium.Chromium"),
    ("flatpak-brave", "Brave (Flatpak)", "flatpak run com.brave.Browser"),
    ("kde-open", "KDE default (kde-open)", "kde-open"),
];

#[derive(Serialize)]
struct BrowserInfo { id: String, label: String, installed: bool }

#[tauri::command]
fn detect_browsers() -> Vec<BrowserInfo> {
    let flatpaks = sh("flatpak list --app --columns=application 2>/dev/null");
    BROWSERS.iter().map(|(id, label, cmd)| {
        let installed = if let Some(app) = cmd.strip_prefix("flatpak run ") {
            flatpaks.lines().any(|l| l.trim() == app)
        } else {
            !sh(&format!("command -v {} 2>/dev/null", cmd)).is_empty()
        };
        BrowserInfo { id: id.to_string(), label: label.to_string(), installed }
    }).collect()
}

/// Try the chosen browsers in order; if one fails (missing, crashes, error code), try the next.
#[tauri::command]
async fn open_url(url: String, browsers: Option<Vec<String>>) -> Result<String, String> {
    if !(url.starts_with("http://") || url.starts_with("https://")) {
        return Err("Only http(s) addresses".into());
    }
    let mut lijst = browsers.unwrap_or_default();
    lijst.retain(|b| !b.is_empty() && b != "none");
    if lijst.is_empty() { lijst.push("default".into()); }
    let mut fouten = Vec::new();
    for id in &lijst {
        let cmd = match BROWSERS.iter().find(|b| b.0 == id) { Some(b) => b.2.to_string(), None => continue };
        let mut delen: Vec<String> = cmd.split_whitespace().map(|s| s.to_string()).collect();
        let prog = delen.remove(0);
        let mut c = tokio::process::Command::new(&prog);
        clean_env_tokio(&mut c);
        c.args(&delen).arg(&url).stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
        match c.spawn() {
            Err(e) => { fouten.push(format!("{id}: {e}")); }
            Ok(mut ch) => {
                // a browser keeps running (fine); xdg-open exits quickly with code 0 when it worked
                match tokio::time::timeout(Duration::from_millis(2500), ch.wait()).await {
                    Err(_) => { tokio::spawn(async move { let _ = ch.wait().await; }); return Ok(id.clone()); }
                    Ok(Ok(st)) if st.success() => return Ok(id.clone()),
                    Ok(Ok(st)) => fouten.push(format!("{id}: exit code {}", st.code().unwrap_or(-1))),
                    Ok(Err(e)) => fouten.push(format!("{id}: {e}")),
                }
            }
        }
    }
    Err(format!("No browser could open the page ({})", fouten.join("; ")))
}

// ---------------------------------------------------------------- real terminal (PTY)
// One bash session that stays open, like the shell inside Konsole: `cd`, variables and
// programs that take over the screen (nano, htop, less, ssh) all work. After every
// command bash prints an invisible marker: \x1e DBASH:<exit code>:<folder> \x1f
use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};

struct PtyState {
    writer: Box<dyn Write + Send>,
    master: Box<dyn MasterPty + Send>,
    child: Box<dyn portable_pty::Child + Send + Sync>,
}
static PTY: Mutex<Option<PtyState>> = Mutex::new(None);
static PTY_ASKPASS: Mutex<Vec<PathBuf>> = Mutex::new(Vec::new());

#[derive(Serialize, Clone)]
struct PtyData { data: String }

const PTY_SETUP: &str = "stty -echo\n\
export PS1= PS2= PAGER=cat SYSTEMD_PAGER=cat GIT_PAGER=cat MANPAGER=cat APT_LISTCHANGES_FRONTEND=none\n\
alias ls='ls --color=always' grep='grep --color=always'\n\
PROMPT_COMMAND='printf \"\\036DBASH:%s:%s\\037\" \"$?\" \"$PWD\"; unset SUDO_ASKPASS'\n";

/// private askpass helper for sudo (RAM, 0600/0700), returns (helper, files to delete)
fn maak_askpass(pw: &str) -> Result<(PathBuf, Vec<PathBuf>), String> {
    use std::os::unix::fs::PermissionsExt;
    let dir = std::env::var("XDG_RUNTIME_DIR").map(PathBuf::from).unwrap_or_else(|_| config_dir());
    let id = format!("{}-{}", std::process::id(), std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_nanos()).unwrap_or(0));
    let pwf = dir.join(format!(".dbash-pw-{id}"));
    let shf = dir.join(format!(".dbash-askpass-{id}"));
    fs::write(&pwf, format!("{pw}\n")).map_err(|e| e.to_string())?;
    fs::set_permissions(&pwf, fs::Permissions::from_mode(0o600)).map_err(|e| e.to_string())?;
    fs::write(&shf, format!("#!/bin/sh\ncat '{}'\n", pwf.display())).map_err(|e| e.to_string())?;
    fs::set_permissions(&shf, fs::Permissions::from_mode(0o700)).map_err(|e| e.to_string())?;
    Ok((shf.clone(), vec![pwf, shf]))
}

fn ruim_askpass() { for f in PTY_ASKPASS.lock().unwrap().drain(..) { let _ = fs::remove_file(f); } }

#[tauri::command]
fn pty_start(app: tauri::AppHandle, cols: u16, rows: u16) -> Result<(), String> {
    let mut g = PTY.lock().unwrap();
    if let Some(mut old) = g.take() { let _ = old.child.kill(); }
    let pair = native_pty_system().openpty(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 }).map_err(|e| e.to_string())?;
    let mut cb = CommandBuilder::new("bash");
    cb.args(["--noprofile", "--norc", "--noediting", "-i"]);
    cb.cwd(home());
    for (k, v) in schone_env() { match v { Some(v) => cb.env(k, v), None => cb.env_remove(k) } }
    cb.env("TERM", "dumb"); cb.env("DBASH", "1"); cb.env("PS1", ""); cb.env("PS2", "");
    let child = pair.slave.spawn_command(cb).map_err(|e| e.to_string())?;
    drop(pair.slave);
    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let mut writer = pair.master.take_writer().map_err(|e| e.to_string())?;
    writer.write_all(PTY_SETUP.as_bytes()).map_err(|e| e.to_string())?;
    let _ = writer.flush();
    std::thread::spawn(move || {
        let mut buf = [0u8; 16384];
        let mut rest: Vec<u8> = Vec::new();
        loop {
            match std::io::Read::read(&mut reader, &mut buf) {
                Ok(0) | Err(_) => { ruim_askpass(); let _ = app.emit("pty-exit", ()); break; }
                Ok(n) => {
                    rest.extend_from_slice(&buf[..n]);
                    let geldig = match std::str::from_utf8(&rest) { Ok(_) => rest.len(), Err(e) => if e.error_len().is_some() { rest.len() } else { e.valid_up_to() } };
                    if geldig == 0 { continue; }
                    let deel: Vec<u8> = rest.drain(..geldig).collect();
                    if deel.contains(&0x1e) { ruim_askpass(); }
                    let _ = app.emit("pty-data", PtyData { data: String::from_utf8_lossy(&deel).to_string() });
                }
            }
        }
    });
    *g = Some(PtyState { writer, master: pair.master, child });
    Ok(())
}

/// Run one command line in the shell (with a sudo password: through the private askpass helper)
#[tauri::command]
fn pty_run(cmd: String, password: Option<String>) -> Result<(), String> {
    let mut g = PTY.lock().unwrap();
    let st = g.as_mut().ok_or("terminal not started")?;
    let regel = match password.as_deref() {
        Some(pw) if !pw.is_empty() => {
            let (helper, files) = maak_askpass(pw)?;
            PTY_ASKPASS.lock().unwrap().extend(files);
            format!("export SUDO_ASKPASS='{}'; {}\n", helper.display(), forceer_sudo_a(&cmd))
        }
        _ => format!("{}\n", cmd),
    };
    st.writer.write_all(regel.as_bytes()).map_err(|e| e.to_string())?;
    st.writer.flush().map_err(|e| e.to_string())
}

/// Keys and text for the program that is running (Ctrl+C = "\u{3}")
#[tauri::command]
fn pty_write(data: String) -> Result<(), String> {
    let mut g = PTY.lock().unwrap();
    let st = g.as_mut().ok_or("terminal not started")?;
    st.writer.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
    st.writer.flush().map_err(|e| e.to_string())
}

#[tauri::command]
fn pty_resize(cols: u16, rows: u16) -> Result<(), String> {
    let g = PTY.lock().unwrap();
    let st = g.as_ref().ok_or("terminal not started")?;
    st.master.resize(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 }).map_err(|e| e.to_string())
}

/// Is this a desktop (window) program? Those keep running on their own, outside the terminal.
#[tauri::command]
fn is_gui(word: String) -> bool {
    if word.is_empty() || word.contains('/') { return false; }
    let mut dirs = vec![PathBuf::from("/usr/share/applications"), PathBuf::from("/usr/local/share/applications"), PathBuf::from("/var/lib/flatpak/exports/share/applications")];
    dirs.push(home().join(".local/share/applications"));
    dirs.push(home().join(".local/share/flatpak/exports/share/applications"));
    for d in dirs {
        let Ok(rd) = fs::read_dir(&d) else { continue };
        for e in rd.flatten() {
            let p = e.path();
            if p.extension().map_or(true, |x| x != "desktop") { continue; }
            let Ok(t) = fs::read_to_string(&p) else { continue };
            if t.lines().any(|l| l.trim() == "Terminal=true") { continue; }
            for l in t.lines() {
                let Some(exec) = l.strip_prefix("Exec=") else { continue };
                let mut woorden = exec.split_whitespace();
                let mut w = woorden.next().unwrap_or("");
                if w == "env" { w = woorden.find(|x| !x.contains('=')).unwrap_or(""); }
                let naam = w.trim_matches('"').rsplit('/').next().unwrap_or("");
                if naam == word { return true; }
            }
        }
    }
    false
}

// ---------------------------------------------------------------- downloads (models, engine)
static DL_STOP: Mutex<Vec<String>> = Mutex::new(Vec::new());

#[derive(Serialize, Clone)]
struct DlVoortgang { id: String, done: u64, total: u64 }

/// Download a file into the models folder, with progress events ("dl-progress") and resume (.part)
#[tauri::command]
async fn download_file(app: tauri::AppHandle, id: String, url: String, dir: String, name: String) -> Result<String, String> {
    let map = if let Some(r) = dir.strip_prefix("~/") { home().join(r) } else { PathBuf::from(&dir) };
    let doel = download_naar(&app, &id, &url, &map, &name).await?;
    if name == "llamafile" {
        use std::os::unix::fs::PermissionsExt;
        let _ = fs::set_permissions(&doel, fs::Permissions::from_mode(0o755));
    }
    Ok(doel.display().to_string())
}

async fn download_naar(app: &tauri::AppHandle, id: &str, url: &str, map: &Path, name: &str) -> Result<PathBuf, String> {
    if !(url.starts_with("https://") || url.starts_with("http://")) { return Err("only http(s) addresses".into()); }
    if name.is_empty() || name.contains('/') || name.starts_with('.') || name.contains("..") { return Err("bad file name".into()); }
    if !map.starts_with(home()) || map.components().any(|c| c == std::path::Component::ParentDir) { return Err("downloads only go inside your home folder".into()); }
    let id = id.to_string();
    fs::create_dir_all(&map).map_err(|e| e.to_string())?;
    let doel = map.join(&name);
    let part = map.join(format!("{name}.part"));
    let start = fs::metadata(&part).map(|m| m.len()).unwrap_or(0);
    let client = reqwest::Client::builder().user_agent("DBash").connect_timeout(Duration::from_secs(20)).build().map_err(|e| e.to_string())?;
    let mut req = client.get(url);
    if start > 0 { req = req.header("Range", format!("bytes={start}-")); }
    let mut resp = req.send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() { return Err(format!("the server answered {}", resp.status())); }
    let verder = resp.status().as_u16() == 206;
    let total = resp.content_length().map(|l| l + if verder { start } else { 0 }).unwrap_or(0);
    let mut f = fs::OpenOptions::new().create(true).write(true).append(verder).truncate(!verder).open(&part).map_err(|e| e.to_string())?;
    let mut done = if verder { start } else { 0 };
    let mut laatst = std::time::Instant::now();
    let _ = app.emit("dl-progress", DlVoortgang { id: id.clone(), done, total });
    while let Some(stuk) = resp.chunk().await.map_err(|e| e.to_string())? {
        { let mut st = DL_STOP.lock().unwrap(); if let Some(i) = st.iter().position(|x| x == &id) { st.remove(i); return Err("stopped (run it again to continue)".into()); } }
        f.write_all(&stuk).map_err(|e| e.to_string())?;
        done += stuk.len() as u64;
        if laatst.elapsed() > Duration::from_millis(300) { laatst = std::time::Instant::now(); let _ = app.emit("dl-progress", DlVoortgang { id: id.clone(), done, total }); }
    }
    f.flush().map_err(|e| e.to_string())?;
    drop(f);
    let _ = app.emit("dl-progress", DlVoortgang { id: id.clone(), done, total });
    if total > 0 && done != total { return Err(format!("incomplete ({done} of {total} bytes), run it again to continue")); }
    fs::rename(&part, &doel).map_err(|e| e.to_string())?;
    Ok(doel)
}

#[tauri::command]
fn download_stop(id: String) { DL_STOP.lock().unwrap().push(id); }

// ---------------------------------------------------------------- self-update (standalone .sh only)
/// sha256 of a file, with the system tool (coreutils is always there)
fn sha256_van(p: &Path) -> Result<String, String> {
    let o = Command::new("sha256sum").arg("--").arg(p).output().map_err(|e| e.to_string())?;
    let t = String::from_utf8_lossy(&o.stdout);
    t.split_whitespace().next().filter(|h| h.len() == 64).map(|h| h.to_lowercase()).ok_or_else(|| "sha256sum failed".into())
}

/// Download a new dbash-x.y.z.sh next to the running one, check its sha256 against the
/// SHA256SUMS file of the same GitHub release, then switch the start-menu entry to it and
/// move the old file to ~/DBash/Backups. Nothing changes when a check fails.
#[tauri::command]
async fn app_update(app: tauri::AppHandle, id: String, url: String, sums_url: String, name: String) -> Result<String, String> {
    let oud = PathBuf::from(std::env::var("DBASH_SH").map_err(|_| "only the standalone dbash-x.y.z.sh can update itself")?);
    if !oud.is_file() { return Err("the running dbash .sh file was not found".into()); }
    let ok_naam = name.starts_with("dbash-") && name.ends_with(".sh") && name[6..name.len() - 3].chars().all(|c| c.is_ascii_digit() || c == '.');
    if !ok_naam { return Err("unexpected file name in the release".into()); }
    for u in [&url, &sums_url] {
        if !(u.starts_with("https://github.com/") || u.starts_with("https://objects.githubusercontent.com/") || std::env::var("DBASH_GH").map(|b| u.starts_with(&b)).unwrap_or(false)) {
            return Err("updates only come from github.com".into());
        }
    }
    let map = oud.parent().ok_or("bad path")?.to_path_buf();
    if !map.starts_with(home()) { return Err("DBash must be inside your home folder to update itself".into()); }
    // 1. the expected checksum
    let sums = reqwest::Client::builder().user_agent("DBash").timeout(Duration::from_secs(30)).build().map_err(|e| e.to_string())?
        .get(&sums_url).send().await.map_err(|e| e.to_string())?.text().await.map_err(|e| e.to_string())?;
    let verwacht = sums.lines().find_map(|l| { let mut w = l.split_whitespace(); let h = w.next()?; let n = w.next()?.trim_start_matches('*'); (n == name).then(|| h.to_lowercase()) })
        .ok_or("the release has no checksum for this file")?;
    // 2. download + check
    let nieuw = download_naar(&app, &id, &url, &map, &name).await?;
    let echt = sha256_van(&nieuw)?;
    if echt != verwacht { let _ = fs::remove_file(&nieuw); return Err(format!("checksum does not match (expected {verwacht}, got {echt}); the download was deleted")); }
    { use std::os::unix::fs::PermissionsExt; fs::set_permissions(&nieuw, fs::Permissions::from_mode(0o755)).map_err(|e| e.to_string())?; }
    // 3. start-menu entry → new file
    let desktop = home().join(".local/share/applications/dbash.desktop");
    if let Ok(t) = fs::read_to_string(&desktop) {
        let t2 = t.replace(&oud.display().to_string(), &nieuw.display().to_string());
        if t2 != t { let _ = fs::write(&desktop, t2); }
    }
    // 4. old file → backups (kept as a fallback, delete it whenever you like)
    if oud != nieuw {
        let bk = home().join("DBash/Backups");
        let _ = fs::create_dir_all(&bk);
        if let Some(n) = oud.file_name() { if fs::rename(&oud, bk.join(n)).is_err() { let _ = fs::copy(&oud, bk.join(n)).and_then(|_| fs::remove_file(&oud)); } }
    }
    Ok(nieuw.display().to_string())
}

/// Start the new version and close this one
#[tauri::command]
fn restart_into(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let p = PathBuf::from(&path);
    let naam = p.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
    if !p.is_file() || !p.starts_with(home()) || !naam.starts_with("dbash-") || !naam.ends_with(".sh") { return Err("not a DBash file".into()); }
    let mut c = Command::new("setsid");
    clean_env_std(&mut c);
    c.env_remove("DBASH_SH").arg("sh").arg("-c").arg("sleep 1; exec \"$0\"").arg(&p)
        .stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null()).spawn().map_err(|e| e.to_string())?;
    app.exit(0);
    Ok(())
}

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(AppState { model: Mutex::new(None) })
        .invoke_handler(tauri::generate_handler![
            system_info, run_command, list_models, start_model, model_status, stop_model, ai_chat, ai_stop, fetch_url, open_url, save_text, is_command, detect_browsers, sudo_needs_password, pty_start, pty_run, pty_write, pty_resize, is_gui, download_file, download_stop, app_update, restart_into
        ])
        .build(tauri::generate_context!())
        .expect("error while building DBash");
    app.run(|handle, event| {
        if let tauri::RunEvent::Exit = event {
            let st = handle.state::<AppState>();
            stop(&st);
            if let Some(mut p) = PTY.lock().unwrap().take() { let _ = p.child.kill(); }
            ruim_askpass();
        }
    });
}

#[cfg(test)]
mod tests {
    #[test]
    fn askpass_rewrite() {
        let out = super::forceer_sudo_a("sudo apt update && echo héllo; sudo -A ls | sudo tee x");
        assert_eq!(out, "sudo -A apt update && echo héllo; sudo -A ls | sudo -A tee x");
    }
}

#[cfg(test)]
mod env_tests {
    #[test]
    fn strips_appimage_parts() {
        std::env::set_var("APPDIR", "/tmp/.mount_DBashX");
        std::env::set_var("LD_LIBRARY_PATH", "/tmp/.mount_DBashX/usr/lib");
        std::env::set_var("XDG_DATA_DIRS", "/tmp/.mount_DBashX/usr/share:/usr/share:/usr/local/share");
        std::env::set_var("PATH", "/tmp/.mount_DBashX/usr/bin:/usr/bin:/bin");
        let e = super::schone_env();
        let get = |k: &str| e.iter().find(|(x, _)| x == k).map(|(_, v)| v.clone());
        assert_eq!(get("LD_LIBRARY_PATH"), Some(None));
        assert_eq!(get("XDG_DATA_DIRS"), Some(Some("/usr/share:/usr/local/share".into())));
        assert_eq!(get("PATH"), Some(Some("/usr/bin:/bin".into())));
        assert_eq!(get("APPDIR"), Some(None));
    }
}

#[cfg(test)]
mod browser_tests {
    #[tokio::test(flavor = "current_thread")]
    async fn falls_back_to_next_browser() {
        let dir = std::env::temp_dir().join("dbash-fakebin");
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("chromium"), "#!/bin/sh\nexit 3\n").unwrap();          // broken browser
        std::fs::write(dir.join("firefox"), "#!/bin/sh\nsleep 5\n").unwrap();          // keeps running = ok
        for f in ["chromium", "firefox"] { std::process::Command::new("chmod").arg("+x").arg(dir.join(f)).status().unwrap(); }
        std::env::set_var("PATH", format!("{}:{}", dir.display(), std::env::var("PATH").unwrap()));
        let r = super::open_url("https://debian.org".into(), Some(vec!["chromium".into(), "librewolf".into(), "firefox".into()])).await;
        assert_eq!(r.unwrap(), "firefox");
        let r2 = super::open_url("https://debian.org".into(), Some(vec!["chromium".into()])).await;
        assert!(r2.unwrap_err().contains("exit code 3"));
        assert!(super::open_url("file:///etc/passwd".into(), None).await.is_err());
    }
}

#[cfg(test)]
mod askpass_tests {
    #[tokio::test(flavor = "current_thread")]
    async fn password_reaches_the_command_and_files_are_removed() {
        // simulate sudo with a fake "sudo" that runs its askpass and prints what it got
        let dir = std::env::temp_dir().join("dbash-fakesudo");
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("sudo"), "#!/bin/sh\n[ \"$1\" = -A ] || { echo no-A; exit 9; }\nshift\necho \"pw=$($SUDO_ASKPASS)\"\nexec \"$@\"\n").unwrap();
        std::process::Command::new("chmod").arg("+x").arg(dir.join("sudo")).status().unwrap();
        std::env::set_var("XDG_RUNTIME_DIR", std::env::temp_dir());
        let cmd = format!("PATH={}:$PATH; sudo echo hi && sudo echo twee", dir.display());
        let r = super::run_command(cmd, None, Some("geheim 123".into())).await.unwrap();
        assert_eq!(r.code, 0, "{} {}", r.stdout, r.stderr);
        assert!(r.stdout.contains("pw=geheim 123\nhi\npw=geheim 123\ntwee"), "{}", r.stdout);
        let left: Vec<_> = std::fs::read_dir(std::env::temp_dir()).unwrap().flatten().filter(|e| e.file_name().to_string_lossy().starts_with(".dbash-")).collect();
        assert!(left.is_empty(), "temp files left behind");
    }
}

#[cfg(test)]
mod pty_tests {
    use super::*;
    #[test]
    fn shell_keeps_folder_and_gives_marker() {
        let pair = native_pty_system().openpty(PtySize { rows: 24, cols: 120, pixel_width: 0, pixel_height: 0 }).unwrap();
        let mut cb = CommandBuilder::new("bash");
        cb.args(["--noprofile", "--norc", "--noediting", "-i"]);
        cb.env("TERM", "dumb");
        let _child = pair.slave.spawn_command(cb).unwrap();
        drop(pair.slave);
        let mut reader = pair.master.try_clone_reader().unwrap();
        let mut w = pair.master.take_writer().unwrap();
        w.write_all(PTY_SETUP.as_bytes()).unwrap();
        w.write_all(b"cd /tmp\npwd\nfalse\n").unwrap();
        let (tx, rx) = std::sync::mpsc::channel();
        std::thread::spawn(move || { let mut b = [0u8; 4096]; loop { match std::io::Read::read(&mut reader, &mut b) { Ok(0) | Err(_) => break, Ok(n) => { let _ = tx.send(String::from_utf8_lossy(&b[..n]).to_string()); } } } });
        let mut all = String::new();
        let t0 = std::time::Instant::now();
        while t0.elapsed() < Duration::from_secs(5) { if let Ok(x) = rx.recv_timeout(Duration::from_millis(200)) { all.push_str(&x); } if all.contains("DBASH:1:/tmp") { break; } }
        assert!(all.contains("\u{1e}DBASH:0:/tmp\u{1f}"), "{all:?}");
        assert!(all.contains("/tmp\r\n"), "{all:?}");
        assert!(all.contains("\u{1e}DBASH:1:/tmp\u{1f}"), "{all:?}");
    }
}
