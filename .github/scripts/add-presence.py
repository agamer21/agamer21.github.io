"""Add the shared presence client to curated Pages HTML, including direct game links."""
import pathlib
import sys

script = b'<script type="module" src="/assets/arcade/presence.js"></script>'
root = pathlib.Path(sys.argv[1])
shells = set(root.glob('*.html'))
shells.update(root / name for name in (
    'granny/index.html', 'pokemon-3ds/index.html',
    'geometry-dash/index.html', 'geometry-dash/official.html',
))
theme_script = b'<script type="module" src="/assets/arcade/player-theme.js"></script>'
for page in root.rglob('*.html'):
    text = page.read_bytes()
    if page in shells and b'</body>' in text and theme_script not in text:
        text = text.replace(b'</body>', theme_script + b'</body>')
    if b'</body>' in text and script not in text:
        text = text.replace(b'</body>', script + b'</body>')
    if text != page.read_bytes():
        page.write_bytes(text)
