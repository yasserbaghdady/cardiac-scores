"""Build: tests first, then dist/index.html (artifact preview) and dist/pwa/ (GitHub Pages, installable, offline)."""
import subprocess, pathlib, json, datetime, sys
R = pathlib.Path(__file__).parent
S, D = R / 'src', R / 'dist'
if subprocess.run(['node', str(R / 'tests' / 'run.js')]).returncode:
    sys.exit('Tests failed: not building.')
js = '\n'.join((S / f).read_text() for f in ['engine-core.js', 'engine-extra.js', 'scores.js', 'app.js'])
js = js.replace('if (typeof module !== \'undefined\') module.exports = { RS: RS, UT: UT };', '').replace("if (typeof module !== 'undefined') module.exports = DEF;", '')
css = (S / 'app.css').read_text()
today = datetime.date.today().strftime('%d %b %Y')
page = (S / 'index.html').read_text().replace('/*CSS*/', css).replace('/*JS*/', js).replace('<!--DATE-->', today)
D.mkdir(exist_ok=True)
(D / 'index.html').write_text(page.replace('<!--PWA-->', ''))

P = D / 'pwa'; P.mkdir(exist_ok=True)
head = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<meta name="theme-color" content="#0F1B2D"><link rel="manifest" href="manifest.webmanifest">'
        '<link rel="icon" href="icon.svg"><link rel="apple-touch-icon" href="icon-192.png">'
        '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Cardiac Scores">'
        '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}[hidden]{display:none!important}</style>')
(P / 'index.html').write_text(head + page.replace('<!--PWA-->', '') .replace('<title>', '</head><body><title>', 1) + '</body></html>')
(P / 'manifest.webmanifest').write_text(json.dumps({
    'name': 'Cardiac Scores', 'short_name': 'Cardiac Scores', 'start_url': './', 'scope': './', 'display': 'standalone',
    'background_color': '#0F1B2D', 'theme_color': '#0F1B2D',
    'icons': [{'src': 'icon-192.png', 'sizes': '192x192', 'type': 'image/png'}, {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
              {'src': 'icon.svg', 'sizes': 'any', 'type': 'image/svg+xml'}]}, indent=1))
ver = datetime.datetime.now().strftime('%Y%m%d%H%M')
(P / 'sw.js').write_text("""const C='cs-%s',F=['./','index.html','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)))});
""" % ver)
print('built', len(page), 'bytes')
