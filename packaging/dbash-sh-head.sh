#!/usr/bin/env bash
# DBash @VERSION@ - standalone. Just run it: no installation, no root, no FUSE needed.
#
#   ./dbash-@VERSION@.sh               start DBash
#   ./dbash-@VERSION@.sh --menu        also add DBash to your start menu (optional)
#   ./dbash-@VERSION@.sh --remove      remove the menu entry and the unpacked copy
#
# The first start unpacks the app once into ~/.cache/dbash/@VERSION@ (takes a few seconds).
# DBash can update itself: it downloads the next dbash-x.y.z.sh from GitHub, checks its sha256
# and switches the start-menu entry to it (only after you say y).
# After that it starts right away. Your chats, models and backups are never touched.
set -euo pipefail

VERSIE="@VERSION@"
ZELF="$(readlink -f "$0")"
CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/dbash/$VERSIE"
APPDIR="$CACHE/squashfs-root"
DESKTOP="$HOME/.local/share/applications/dbash.desktop"
ICON_DIR="$HOME/.local/share/icons/hicolor/128x128/apps"

melding() { # show a message in a KDE window when started from Dolphin, else in the terminal
    if [ -t 1 ]; then echo "$1"; elif command -v kdialog >/dev/null; then kdialog --title DBash --msgbox "$1"; else echo "$1"; fi
}

if [ "${1:-}" = "--remove" ]; then
    rm -rf "${XDG_CACHE_HOME:-$HOME/.cache}/dbash" "$DESKTOP" "$ICON_DIR/dbash.png"
    melding "DBash menu entry and unpacked copy removed. Your chats, models and backups are still there."
    exit 0
fi

if [ "$(uname -m)" != "x86_64" ]; then melding "DBash only runs on 64-bit PCs (x86_64)."; exit 1; fi

# ---- unpack once (no FUSE needed) ----
if [ ! -x "$APPDIR/AppRun" ]; then
    [ -t 1 ] && echo "DBash $VERSIE: first start, unpacking (a few seconds)..."
    mkdir -p "$CACHE"
    TMP=$(mktemp -d "$CACHE/.uitpak.XXXX")
    trap 'rm -rf "$TMP"' EXIT
    REGEL=$(awk '/^__PAYLOAD__$/{print NR+1; exit}' "$ZELF")
    tail -n +"$REGEL" "$ZELF" | tar -xz -C "$TMP"
    chmod +x "$TMP/DBash.AppImage"
    ( cd "$TMP" && ./DBash.AppImage --appimage-extract >/dev/null )
    rm -rf "$APPDIR"
    mv "$TMP/squashfs-root" "$APPDIR"
    cp "$TMP/dbash.png" "$CACHE/dbash.png"
    rm -rf "$TMP"; trap - EXIT
    # unpacked copies of older versions are no longer needed
    find "${XDG_CACHE_HOME:-$HOME/.cache}/dbash" -mindepth 1 -maxdepth 1 -type d ! -name "$VERSIE" -exec rm -rf {} + 2>/dev/null || true
fi

mkdir -p "$HOME/DBash/Models" "$HOME/DBash/Downloads" "$HOME/DBash/Backups"

# ---- optional: start menu entry ----
if [ "${1:-}" = "--menu" ]; then
    mkdir -p "$ICON_DIR" "$(dirname "$DESKTOP")"
    cp "$CACHE/dbash.png" "$ICON_DIR/dbash.png"
    cat > "$DESKTOP" <<EOF
[Desktop Entry]
Type=Application
Name=DBash
GenericName=Smart Terminal
Comment=Smart Debian terminal with a local AI that helps you learn Linux
Exec="$ZELF"
Icon=dbash
Terminal=false
Categories=System;Utility;TerminalEmulator;
Keywords=terminal;ai;debian;bash;
EOF
    command -v update-desktop-database >/dev/null && update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
    melding "DBash is now in your start menu. It starts this file: $ZELF (keep it where it is)."
fi

# ---- start ----
[ "${1:-}" = "--menu" ] && shift
export DBASH_SH="$ZELF"          # lets DBash update this file
exec "$APPDIR/AppRun" "$@"
__PAYLOAD__
