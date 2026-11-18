#!/usr/bin/env python3
"""Make dist/DBash-preview.html: the whole screen in ONE file (styles, scripts and fonts inline).
It runs in any browser, also on a phone, in preview mode: simulated commands and demo answers.
The real terminal parts (xterm.js, real.js) are left out; they only work inside the app."""
import base64, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'
html = (SRC / 'index.html').read_text(encoding='utf8')
versie = re.search(r"const DBASH_VERSIE='([^']+)'", (SRC / 'js/app.js').read_text(encoding='utf8')).group(1)

def fonts_inline(css_path):
    css = css_path.read_text(encoding='utf8')
    def data(m):
        b = (css_path.parent / m.group(1)).read_bytes()
        return 'url(data:font/woff2;base64,' + base64.b64encode(b).decode() + ')'
    return re.sub(r'url\(\./([^)]+\.woff2)\)', data, css)

def style(m):
    p = SRC / m.group(1)
    if 'xterm' in m.group(1): return ''
    css = fonts_inline(p) if p.name == 'fonts.css' else p.read_text(encoding='utf8')
    return '<style>\n' + css + '\n</style>'

def script(m):
    f = m.group(1)
    if f.startswith('vendor/') or f == 'js/real.js': return ''
    return '<script>\n' + (SRC / f).read_text(encoding='utf8').replace('</script>', '<\\/script>') + '\n</script>'

html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', style, html)
html = re.sub(r'<script src="([^"]+)"></script>', script, html)
html = html.replace('<title>DBash // Smart Terminal</title>', f'<title>DBash {versie} · preview</title>')
out = ROOT / 'dist' / 'DBash-preview.html'
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding='utf8')
print(f'{out}  ({len(html)//1024} KB)')
