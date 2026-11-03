"""Собирает иконки из brand/mark.svg и brand/icon-template.svg.

Результат:
  brand/icon.svg                         полная иконка (вектор)
  build_assets/icon.ico, icon.png        Windows / установщик
  android/.../mipmap-*/ic_launcher*.png  иконки лаунчера (обычная и круглая)
  android/.../drawable-nodpi/ic_launcher_foreground.png  передний слой adaptive icon
Нужен Microsoft Edge (растеризация SVG) и Pillow.
"""

import os
import re
import shutil
import sys
import tempfile

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render_svg import render  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND = os.path.join(ROOT, 'brand')
RES = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res')


def mark_inner() -> str:
    with open(os.path.join(BRAND, 'mark.svg'), encoding='utf-8') as f:
        svg = f.read()
    return re.sub(r'^.*?<svg[^>]*>|</svg>\s*$', '', svg, flags=re.S)


def build_icon_svg() -> str:
    with open(os.path.join(BRAND, 'icon-template.svg'), encoding='utf-8') as f:
        tpl = f.read()
    svg = tpl.replace('MARK', mark_inner())
    path = os.path.join(BRAND, 'icon.svg')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(svg)
    return path


def mask(img: Image.Image, shape: str) -> Image.Image:
    s = img.size[0]
    m = Image.new('L', (s * 4, s * 4), 0)
    d = ImageDraw.Draw(m)
    if shape == 'circle':
        d.ellipse((0, 0, s * 4 - 1, s * 4 - 1), fill=255)
    else:
        d.rounded_rectangle((0, 0, s * 4 - 1, s * 4 - 1), radius=int(s * 4 * 0.225), fill=255)
    out = Image.new('RGBA', img.size, (0, 0, 0, 0))
    out.paste(img, (0, 0), m.resize(img.size, Image.LANCZOS))
    return out


def main() -> None:
    icon_svg = build_icon_svg()
    out = os.path.join(ROOT, 'build_assets')
    os.makedirs(out, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        full_png = os.path.join(tmp, 'full.png')
        render(icon_svg, full_png, 1024)
        full = Image.open(full_png).convert('RGBA')

        # Передний слой adaptive icon: знак в безопасной зоне (66% из 108dp)
        fg_svg = os.path.join(tmp, 'fg.svg')
        with open(fg_svg, 'w', encoding='utf-8') as f:
            f.write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">'
                    '<svg x="26" y="22" width="56" height="56" viewBox="0 0 100 100">'
                    + mark_inner() + '</svg></svg>')
        fg_png = os.path.join(tmp, 'fg.png')
        render(fg_svg, fg_png, 432)
        fg = Image.open(fg_png).convert('RGBA')

    squircle = mask(full, 'squircle')
    squircle.resize((256, 256), Image.LANCZOS).save(
        os.path.join(out, 'icon.ico'), sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    squircle.resize((512, 512), Image.LANCZOS).save(os.path.join(out, 'icon.png'))
    full.resize((512, 512), Image.LANCZOS).save(os.path.join(BRAND, 'icon-512.png'))

    for folder, px in {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}.items():
        d = os.path.join(RES, f'mipmap-{folder}')
        os.makedirs(d, exist_ok=True)
        mask(full.resize((px, px), Image.LANCZOS), 'squircle').save(os.path.join(d, 'ic_launcher.png'))
        mask(full.resize((px, px), Image.LANCZOS), 'circle').save(os.path.join(d, 'ic_launcher_round.png'))
    nodpi = os.path.join(RES, 'drawable-nodpi')
    os.makedirs(nodpi, exist_ok=True)
    fg.save(os.path.join(nodpi, 'ic_launcher_foreground.png'))

    # логотип для интерфейса
    web_img = os.path.join(ROOT, 'web', 'img')
    os.makedirs(web_img, exist_ok=True)
    shutil.copyfile(os.path.join(BRAND, 'mark.svg'), os.path.join(web_img, 'logo.svg'))
    squircle.resize((64, 64), Image.LANCZOS).save(os.path.join(web_img, 'favicon.png'))
    print('icons ok', file=sys.stderr)


if __name__ == '__main__':
    main()
