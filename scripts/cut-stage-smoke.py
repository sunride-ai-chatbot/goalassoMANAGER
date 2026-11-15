#!/usr/bin/env python3
"""Cut the smoke of the newspaper's stage photograph out as a layer of its own.

    python3 -I scripts/cut-stage-smoke.py            # assets/np-stage.jpg -> assets/np-stage-smoke.webp

A sponsor's sign hangs on the back wall of that stage (`npSignHTML` in 29-paper-ui.js). Laid over the
photograph it would sit in front of the smoke, which is what made it read as pasted on. The same smoke,
with the same pixels, is therefore laid over the sign again: outside the sign the layer covers identical
pixels and cannot be seen, over the sign it is the photograph's own smoke drifting in front of it.

Colour comes from the photograph; alpha is how much brighter a pixel is than the wall behind it. The wall
is estimated from a wide blur of the darker pixels only, so a cloud does not lift its own baseline. The
lit floor and the podium are not smoke and are faded out.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'np-stage.jpg')
OUT = os.path.join(ROOT, 'assets', 'np-stage-smoke.webp')
LO, HI = 14.0, 62.0          # luminance above the wall: where smoke starts to show, where it is solid
FLOOR = (.56, .68)           # the band of the picture's height over which the layer ends


def sstep(x, lo, hi):
    t = np.clip((x - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def main():
    im = Image.open(SRC).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    h = a.shape[0]
    lum = a @ np.array([.299, .587, .114], np.float32)
    dark = np.minimum(lum, np.percentile(lum[: int(h * .6)], 35))
    wall = np.asarray(Image.fromarray(dark.astype(np.uint8)).filter(ImageFilter.GaussianBlur(28))).astype(np.float32)
    alpha = sstep(lum - wall, LO, HI) * (1 - sstep(np.linspace(0, 1, h)[:, None], *FLOOR))
    al = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    out = im.convert('RGBA')
    out.putalpha(al)
    out.save(OUT, 'WEBP', quality=86, method=6)
    print(os.path.relpath(OUT, ROOT), out.size, os.path.getsize(OUT), 'bytes')


if __name__ == '__main__':
    sys.exit(main())
