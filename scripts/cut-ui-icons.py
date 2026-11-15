#!/usr/bin/env python3
"""Interface art for the beginner game ("arena"): icons and scenes from Draw Things renders.

The icons are rendered on pure black by scripts/drawthings/goalasso-ui.js (FLUX.2 klein on the owner's Mac; the
app keeps every picture as a JPEG in its project sqlite, table thumbnailhistorynode, from the first FF D8 FF).
A render becomes a cut-out here: the black that is reachable from the edge turns into transparency by luminance,
so the glow stays a glow, while black that is enclosed by the object (the patches of a ball, a shield's glass)
stays opaque. They are meant for dark surfaces only: on a light one the halo shows.

    python3 -I scripts/cut-ui-icons.py <dir with ui-NNN.jpg> assets/ui
"""
import sys
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
U=sys.argv[1].rstrip('/')+'/'
def cut(n,name,size=256,T=38):
    im=Image.open(U+'ui-%03d.jpg'%n).convert('RGB'); a=np.asarray(im).astype(np.float32)
    mx=a.max(axis=2)
    m=Image.fromarray(np.where(mx<T,255,0).astype(np.uint8)).copy()
    w,h=m.size
    for x in range(0,w,12):
        for y in (0,h-1):
            if m.getpixel((x,y))==255: ImageDraw.floodfill(m,(x,y),128)
    for y in range(0,h,12):
        for x in (0,w-1):
            if m.getpixel((x,y))==255: ImageDraw.floodfill(m,(x,y),128)
    bg=np.asarray(m)==128
    al=np.clip(mx/255.0*1.6,0,1)
    alpha=np.where(bg,al,1.0)
    alpha=np.asarray(Image.fromarray((alpha*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32)/255
    rgb=np.where(bg[...,None],np.clip(a/np.maximum(al,1e-3)[...,None],0,255),a)
    out=Image.fromarray(np.dstack([rgb,alpha*255]).astype(np.uint8),'RGBA')
    bb=out.getchannel('A').point(lambda v:255 if v>10 else 0).getbbox()
    if bb:
        cx,cy=(bb[0]+bb[2])/2,(bb[1]+bb[3])/2; r=max(bb[2]-bb[0],bb[3]-bb[1])/2*1.06
        out=out.crop((int(cx-r),int(cy-r),int(cx+r),int(cy+r)))
    out=out.resize((size,size),Image.LANCZOS)
    out.save('%s/ic-%s.webp'%(sys.argv[2],name),quality=88,method=6)
def scene(n,name):
    im=Image.open(U+'ui-%03d.jpg'%n).convert('RGB'); im=im.resize((780,1140),Image.LANCZOS)
    im.save('%s/sc-%s.webp'%(sys.argv[2],name),quality=80,method=6)
for n,name in [(142,'stadium'),(143,'shirt'),(144,'trophy'),(145,'transfer'),(147,'coins'),(148,'tactics'),(149,'boot'),(150,'ball'),(151,'shield'),(152,'bell'),(153,'gear')]: cut(n,name)
scene(168,'tunnel'); scene(155,'pitch')
