#!/usr/bin/env python3
"""Build The Forge from the source files in game/.

    python3 tools/build.py            -> index.html + sw.js (the phone/web app)
                                         dist/The_Forge_standalone.html (one file, music included)

Source layout
  game/page.html          HTML skeleton with <!--@style FILE--> and <!--@script FOLDER--> markers
  game/styles/*.css       stylesheets, in file-name order
  game/scripts/NN-*/      one folder per <script> tag; the .js files in a folder are joined
                          in file-name order into ONE script, so code in one folder shares scope
  audio/*.mp3             music
  mobile.* landscape.*    phone layers, loaded after the game
"""
import base64, hashlib, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
G = os.path.join(ROOT, 'game')

def read(p): return open(p, encoding='utf-8').read()

def assemble():
    page = read(os.path.join(G, 'page.html'))
    page = re.sub(r'<!--@style ([^ ]+)-->', lambda m: '<style>' + read(os.path.join(G, 'styles', m.group(1))) + '</style>', page)
    def script(m):
        d = os.path.join(G, 'scripts', m.group(1))
        return '<script>' + ''.join(read(os.path.join(d, f)) for f in sorted(os.listdir(d)) if f.endswith('.js')) + '</script>'
    return re.sub(r'<!--@script ([^ ]+)-->', script, page)

def h(path): return hashlib.sha1(open(os.path.join(ROOT, path), 'rb').read()).hexdigest()

def main():
    game = assemble()
    m = re.search(r'const SAVE_KEY="([^"]+)"', game)
    save_key = m.group(1) if m else 'theForge.v5.local'
    early = ('<script>try{window.__forgeHadSave=!!localStorage.getItem("%s")}'
             'catch(e){window.__forgeHadSave=true}</script>') % save_key
    game = re.sub(r'<meta name="viewport"[^>]*>',
                  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">', game, count=1)
    head = """
<meta name="theme-color" content="#140e12">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="The Forge">
<meta name="format-detection" content="telephone=no">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="stylesheet" href="mobile.css?v=__V__">
<link rel="stylesheet" href="landscape.css?v=__V__">
"""
    html = game.replace('<head>', '<head>\n' + early, 1).replace('</head>', head + '</head>', 1)
    tail = '<script src="mobile.js?v=__V__"></script>\n<script src="landscape.js?v=__V__"></script>\n'
    html = html.replace('</body>', tail + '</body>', 1) if '</body>' in html else html + tail
    ver = hashlib.sha1((html + ''.join(h(p) for p in ['mobile.js', 'mobile.css', 'landscape.js', 'landscape.css'])).encode()).hexdigest()[:10]
    html = html.replace('__V__', ver)
    open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(html)

    files = ['./', 'index.html'] + [f + '?v=' + ver for f in ['mobile.css', 'mobile.js', 'landscape.css', 'landscape.js']] + ['manifest.webmanifest']
    files += ['icons/' + f for f in sorted(os.listdir(os.path.join(ROOT, 'icons')))]
    files += ['audio/' + f for f in sorted(os.listdir(os.path.join(ROOT, 'audio')))]
    sw = read(os.path.join(ROOT, 'tools', 'sw.template.js')).replace('__VERSION__', ver).replace('__FILES__', json.dumps(files, indent=1))
    open(os.path.join(ROOT, 'sw.js'), 'w').write(sw)

    # one-file version for sharing or playing from disk: music and phone layers inlined
    solo = game.replace('<head>', '<head>\n' + early, 1)
    solo = re.sub(r'src="audio/([^"]+\.mp3)"', lambda m: 'src="data:audio/mpeg;base64,' +
                  base64.b64encode(open(os.path.join(ROOT, 'audio', m.group(1)), 'rb').read()).decode() + '"', solo)
    css = read(os.path.join(ROOT, 'mobile.css')) + read(os.path.join(ROOT, 'landscape.css'))
    js = read(os.path.join(ROOT, 'mobile.js')) + '\n' + read(os.path.join(ROOT, 'landscape.js'))
    solo = solo.replace('</head>', '<style>' + css + '</style></head>', 1)
    solo = solo.replace('</body>', '<script>' + js + '</script></body>', 1)
    os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
    open(os.path.join(ROOT, 'dist', 'The_Forge_standalone.html'), 'w', encoding='utf-8').write(solo)
    print('Built version %s | index.html %.0f KB | standalone %.1f MB' % (
        ver, os.path.getsize(os.path.join(ROOT, 'index.html')) / 1024,
        os.path.getsize(os.path.join(ROOT, 'dist', 'The_Forge_standalone.html')) / 1048576))

if __name__ == '__main__':
    import sys
    if '--reference' in sys.argv:
        open(os.path.join(ROOT, 'archive', 'The_Forge_reference.html'), 'w', encoding='utf-8').write(assemble())
        print('Reference for the regression test updated.')
    else:
        main()
