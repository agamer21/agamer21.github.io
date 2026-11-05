"""Stage the pinned runtime in the Pages artifact; keep binaries out of Git."""
import pathlib
import sys
import time
import urllib.request

SOURCE = 'https://raw.githubusercontent.com/naotomori1/angrybirds2/6ba66b34c4505754d8b6b30582939a72e8d04243/Build/'
FILES = {
    'UnityLoader.js': 159291,
    **{f'angry.data.unityweb{i:02d}': 20971520 for i in range(5)},
    'angry.data.unityweb05': 1108278,
    'angry.json': 462,
    'angry.wasm.code.unityweb00': 20971520,
    'angry.wasm.code.unityweb01': 7830198,
    'angry.wasm.framework.unityweb': 554548,
}

def prepare(destination):
    destination.mkdir(parents=True, exist_ok=True)
    for name, expected_size in FILES.items():
        for attempt in range(3):
            try:
                with urllib.request.urlopen(SOURCE + name, timeout=90) as response:
                    data = response.read()
                if len(data) != expected_size:
                    raise ValueError(f'{name}: expected {expected_size} bytes, got {len(data)}')
                (destination / name).write_bytes(data)
                print(f'Prepared {name}: {len(data)} bytes', flush=True)
                break
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(attempt + 1)

if __name__ == '__main__':
    prepare(pathlib.Path(sys.argv[1]))
