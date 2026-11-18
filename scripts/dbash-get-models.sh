#!/usr/bin/env bash
# DBash · get the best and newest AI models for your GPU
# - the newest llamafile engine from GitHub (needed for .gguf models)
# - recommended GGUF models, found on Hugging Face when you run this
#   (so the newest versions, not names that were typed in long ago)
# Everything goes to ~/DBash/Models. Nothing is installed on your system.
set -u

MAP="${DBASH_MODELS:-$HOME/DBash/Models}"
HF="${DBASH_HF:-https://huggingface.co}"
GH="${DBASH_GH:-https://api.github.com}"
VERTROUWD="unsloth bartowski ggml-org lmstudio-community Qwen mistralai google mozilla-ai"

# what fits a 16 GB GPU, best first: name | search words | file patterns (preferred first) | max GB | what it is
AANBEVOLEN=(
  "Gemma 4 26B-A4B|gemma-4-26b-a4b-it|qat.*q4_0 IQ4_XS Q4_K_M|14.5|newest all-rounder, fast (MoE), strong for its size"
  "gpt-oss 20B|gpt-oss-20b|mxfp4 Q4_K_M|14.5|reasoning and tools, fast (MoE)"
  "Qwen3 14B|qwen3-14b|Q5_K_M Q4_K_M|11.5|dense model, leaves room for a long chat"
  "Devstral Small|devstral-small|Q4_K_M IQ4_XS|14.5|best for programming"
  "Qwen3.5 4B|qwen3.5-4b|Q5_K_M Q4_K_M|4|small and very fast, for quick questions"
)

r=$'\e[0m'; b=$'\e[1m'; g=$'\e[32m'; y=$'\e[33m'; c=$'\e[36m'; d=$'\e[2m'; e=$'\e[31m'
die() { echo "${e}✗ $*${r}"; exit 1; }
command -v curl >/dev/null || die "curl is missing: sudo apt install curl"
command -v python3 >/dev/null || die "python3 is missing: sudo apt install python3"
mkdir -p "$MAP" || die "cannot make $MAP"

json() { python3 -c "$1" 2>/dev/null; }

# ---------- llamafile engine ----------
engine() {
  echo "${b}${c}▶ llamafile engine${r} ${d}(GitHub: mozilla-ai/llamafile)${r}"
  local rel; rel=$(curl -fsSL "$GH/repos/mozilla-ai/llamafile/releases/latest") || { echo "${y}  ⚠ GitHub not reachable, engine skipped${r}"; return; }
  local info; info=$(printf '%s' "$rel" | json '
import json,sys,re
j=json.load(sys.stdin)
a=[x for x in j.get("assets",[]) if re.fullmatch(r"llamafile-\d+\.\d+\.\d+",x["name"])]
if a: print(j.get("tag_name",""), a[0]["browser_download_url"], a[0]["size"])')
  [ -n "$info" ] || { echo "${y}  ⚠ no engine file in the newest release${r}"; return; }
  set -- $info; local tag=$1 url=$2 size=$3
  local nu=""; [ -x "$MAP/llamafile" ] && nu=$("$MAP/llamafile" --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
  if [ -n "$nu" ] && [ "v$nu" = "$tag" -o "$nu" = "$tag" ]; then echo "  ${g}✓ already the newest ($tag)${r}"; return; fi
  echo "  newest: ${b}$tag${r} ($((size/1048576)) MB)${nu:+  · you have $nu}"
  curl -fL --progress-bar -C - -o "$MAP/llamafile.part" "$url" || { echo "${e}  ✗ download failed${r}"; return; }
  [ "$(stat -c %s "$MAP/llamafile.part")" = "$size" ] || { echo "${e}  ✗ size does not match, try again${r}"; return; }
  [ -e "$MAP/llamafile" ] && mv -f "$MAP/llamafile" "$MAP/llamafile.old"
  mv "$MAP/llamafile.part" "$MAP/llamafile" && chmod +x "$MAP/llamafile"
  echo "  ${g}✓ engine $tag in $MAP/llamafile${r}"
}

# ---------- find a model on Hugging Face ----------
# prints: repo|file|size   (best publisher with the most downloads, preferred quant, not gated, fits)
zoek() {
  local woorden=$1 max=$2; shift 2
  local lijst; lijst=$(curl -fsSL "$HF/api/models?search=$woorden&filter=gguf&sort=downloads&direction=-1&limit=40") || return 1
  local repos; repos=$(printf '%s' "$lijst" | VERTROUWD="$VERTROUWD" json '
import json,sys,os
ok=os.environ["VERTROUWD"].split()
for m in json.load(sys.stdin):
    i=m.get("id","")
    if m.get("gated") not in (False,None,"false"): continue
    if i.split("/")[0] in ok: print(i)')
  local repo bomen=""
  for repo in $(echo "$repos" | head -6); do
    local tree; tree=$(curl -fsSL "$HF/api/models/$repo/tree/main?recursive=1") || continue
    bomen="$bomen$(printf '%s' "$tree" | REPO="$repo" json '
import json,sys,os
r=os.environ["REPO"]
for x in json.load(sys.stdin):
    if x.get("type")=="file" and x["path"].lower().endswith(".gguf"):
        print(r, x["path"], (x.get("lfs") or {}).get("size") or x.get("size") or 0)')
"
  done
  # the preferred quantisation first, from the most downloaded repo that has it
  local keuze; keuze=$(printf '%s' "$bomen" | MAX="$max" PATRONEN="$*" json '
import sys,os,re
max=float(os.environ["MAX"])*1e9
rij=[l.split(" ") for l in sys.stdin.read().splitlines() if l.count(" ")==2]
for pat in os.environ["PATRONEN"].split():
    for repo,pad,gr in rij:
        if "mmproj" in pad.lower() or re.search(r"-0000[2-9]-of-",pad): continue
        if re.search(pat,pad,re.I) and 0<int(gr)<=max: print(repo+"|"+pad+"|"+gr); sys.exit()')
  [ -n "$keuze" ] && { echo "$keuze"; return 0; }
  return 1
}

model() {
  local naam=$1 woorden=$2 max=$3 uitleg=$4; shift 4
  echo "${b}${c}▶ $naam${r} ${d}— $uitleg${r}"
  local gevonden; gevonden=$(zoek "$woorden" "$max" "$@") || { echo "${y}  ⚠ not found on Hugging Face right now (or no version that fits 16 GB)${r}"; return; }
  IFS='|' read -r repo pad size <<<"$gevonden"
  local bestand; bestand=$(basename "$pad")
  echo "  found: ${b}$repo${r} · $bestand · $(python3 -c "print(round($size/1e9,1))") GB"
  if [ -e "$MAP/$bestand" ] && [ "$(stat -c %s "$MAP/$bestand")" = "$size" ]; then echo "  ${g}✓ already downloaded${r}"; return; fi
  local vrij; vrij=$(df -B1 --output=avail "$MAP" | tail -1)
  [ "$vrij" -gt $((size + 2000000000)) ] || { echo "${e}  ✗ not enough free space in $MAP${r}"; return; }
  curl -fL --progress-bar -C - -o "$MAP/$bestand.part" "$HF/$repo/resolve/main/$pad?download=true" || { echo "${e}  ✗ download failed (run the script again to continue)${r}"; return; }
  [ "$(stat -c %s "$MAP/$bestand.part")" = "$size" ] || { echo "${e}  ✗ size does not match, run the script again${r}"; return; }
  mv "$MAP/$bestand.part" "$MAP/$bestand"
  echo "$repo/$pad" > "$MAP/.$bestand.source"
  echo "  ${g}✓ $MAP/$bestand${r}"
}

# ---------- menu ----------
echo
echo "${b}DBash · best and newest AI models for a 16 GB GPU${r}"
echo "${d}Downloads go to $MAP · nothing is installed on your system${r}"
echo
echo "  0) llamafile engine (newest)  — needed for .gguf models"
i=1; for x in "${AANBEVOLEN[@]}"; do IFS='|' read -r n w pats mx u <<<"$x"; printf "  %d) %-18s %s\n" "$i" "$n" "${d}$u${r}"; i=$((i+1)); done
echo
echo "  Enter = recommended set: ${b}0 1 3${r} (engine + Gemma 4 + Qwen3 14B)"
read -r -p "Your choice (e.g. 0 1 3, or all): " keus
[ -z "$keus" ] && keus="0 1 3"
[ "$keus" = "all" ] && keus="0 $(seq -s ' ' 1 ${#AANBEVOLEN[@]})"
echo
for k in $keus; do
  if [ "$k" = 0 ]; then engine
  elif [ "$k" -ge 1 ] 2>/dev/null && [ "$k" -le ${#AANBEVOLEN[@]} ]; then
    IFS='|' read -r n w pats mx u <<<"${AANBEVOLEN[$((k-1))]}"
    model "$n" "$w" "$mx" "$u" $pats
  else echo "${y}  ? unknown choice: $k${r}"; fi
  echo
done
echo "${g}${b}Done.${r} Open DBash: the new models appear under LIBRARY → Models."
echo "${d}Tip: big models (13–15 GB) leave little room for AI memory: use 8,000 or 16,000 tokens in ⚙ → AI.${r}"
