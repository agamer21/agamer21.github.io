"""Add the shared presence client to curated Pages HTML, including direct game links."""
import pathlib
import sys

script = b'<script type="module" src="/assets/arcade/presence.js"></script>'
root = pathlib.Path(sys.argv[1])
for page in root.rglob('*.html'):
    text = page.read_bytes()
    if b'</body>' in text and script not in text:
        page.write_bytes(text.replace(b'</body>', script + b'</body>'))
