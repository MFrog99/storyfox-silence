"""Рисует иконку приложения (полумесяц в стиле «Тишины»): icon.ico для Windows и PNG для Android."""

import os
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOP, BOTTOM = (10, 14, 19), (16, 24, 32)
SAND, SAGE, STAR = (227, 192, 141), (168, 195, 160), (244, 231, 204)


def draw(size: int, shape: str = 'squircle') -> Image.Image:
    s = size * 4  # рисуем с запасом и уменьшаем для сглаживания
    bg = Image.new('RGBA', (s, s))
    bd = ImageDraw.Draw(bg)
    for y in range(s):
        t = y / s
        bd.line([(0, y), (s, y)], fill=tuple(int(TOP[i] + (BOTTOM[i] - TOP[i]) * t) for i in range(3)) + (255,))

    glow = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    cx, cy, r = s * 0.47, s * 0.48, s * 0.25
    ImageDraw.Draw(glow).ellipse((cx - r * 2.1, cy - r * 2.1, cx + r * 2.1, cy + r * 2.1), fill=SAND + (60,))
    glow = glow.filter(ImageFilter.GaussianBlur(s * 0.1))
    img = Image.alpha_composite(bg, glow)

    # полумесяц: круг минус смещённый круг
    moon = Image.new('L', (s, s), 0)
    ImageDraw.Draw(moon).ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)
    cut = Image.new('L', (s, s), 0)
    ox, oy = cx + r * 0.62, cy - r * 0.02
    ImageDraw.Draw(cut).ellipse((ox - r, oy - r, ox + r, oy + r), fill=255)
    moon = ImageChops.subtract(moon, cut)
    img.paste(Image.new('RGBA', (s, s), SAND + (255,)), (0, 0), moon)

    d = ImageDraw.Draw(img)
    for i in range(3):
        rr = r * (1.12 + i * 0.18)
        alpha = int(255 * (0.35 - i * 0.08))
        d.arc((cx - rr, cy - rr * 0.55, cx + rr, cy + rr * 0.55), 28, 152, fill=SAGE + (alpha,), width=max(2, int(s * 0.006)))
    for (x, y, rad, a) in ((0.75, 0.27, 0.010, 210), (0.26, 0.2, 0.008, 130)):
        d.ellipse((s * x - s * rad, s * y - s * rad, s * x + s * rad, s * y + s * rad), fill=STAR + (a,))

    mask = Image.new('L', (s, s), 0)
    md = ImageDraw.Draw(mask)
    if shape == 'circle':
        md.ellipse((0, 0, s - 1, s - 1), fill=255)
    else:
        md.rounded_rectangle((0, 0, s - 1, s - 1), radius=int(s * 0.23), fill=255)
    out = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out.resize((size, size), Image.LANCZOS)


def main() -> None:
    out = os.path.join(ROOT, 'build_assets')
    os.makedirs(out, exist_ok=True)
    big = draw(256)
    big.save(os.path.join(out, 'icon.ico'), sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    big.save(os.path.join(out, 'icon.png'))
    res = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res')
    for folder, px in {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}.items():
        d = os.path.join(res, f'mipmap-{folder}')
        os.makedirs(d, exist_ok=True)
        draw(px).save(os.path.join(d, 'ic_launcher.png'))
    print('icons ok', file=sys.stderr)


if __name__ == '__main__':
    main()
