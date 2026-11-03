"""Растеризует SVG в PNG через headless Microsoft Edge (без зависимостей от cairo).

python tools/render_svg.py input.svg output.png size [background]
"""

import os
import subprocess
import sys
import tempfile

EDGE_PATHS = [
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
]


def render(svg_path: str, png_path: str, size: int, background: str = 'transparent') -> None:
    edge = next((p for p in EDGE_PATHS if os.path.exists(p)), None)
    if edge is None:
        raise RuntimeError('Microsoft Edge не найден')
    with open(svg_path, encoding='utf-8') as f:
        svg = f.read()
    html = (
        '<!doctype html><html><head><style>html,body{margin:0;padding:0;'
        f'background:{background};overflow:hidden}}svg{{display:block;width:{size}px;height:{size}px}}'
        f'</style></head><body>{svg}</body></html>'
    )
    with tempfile.TemporaryDirectory() as tmp:
        page = os.path.join(tmp, 'page.html')
        with open(page, 'w', encoding='utf-8') as f:
            f.write(html)
        out = os.path.abspath(png_path)
        subprocess.run(
            [edge, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
             '--default-background-color=00000000', f'--user-data-dir={os.path.join(tmp, "profile")}',
             f'--window-size={size},{size}', f'--screenshot={out}', 'file:///' + page.replace('\\', '/')],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60,
        )


if __name__ == '__main__':
    render(sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4] if len(sys.argv) > 4 else 'transparent')
