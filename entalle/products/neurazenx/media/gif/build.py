from PIL import Image, ImageFilter
import imageio.v2 as iio, numpy as np
c=[Image.open(f).convert('RGB').crop((0,0,940,1672)) for f in ['c1.png','c2.png','c3.png']]
ovv=Image.open('ov-v.png').convert('RGBA'); ovq=Image.open('ov-q.png').convert('RGBA')
def square(b):
    bg=b.resize((940,1672)).crop((0,366,940,1306)).filter(ImageFilter.GaussianBlur(30))
    r=b.crop((0,120,940,1400)); s=940/1280; r=r.resize((round(940*s),940),Image.LANCZOS)
    bg.paste(r,((940-r.width)//2,0)); return bg
def seq(fps):
    k=fps/20; n=lambda x:max(1,round(x*k)); fr=[]
    fr+=[(c[0],0)]*n(12)
    fr+=[(Image.blend(c[0],c[1],(i+1)/n(8)),0) for i in range(n(8))]
    fr+=[(c[1],0)]*n(12)
    fr+=[(Image.blend(c[1],c[2],(i+1)/n(8)),0) for i in range(n(8))]
    fr+=[(c[2],0)]*n(8)
    fr+=[(c[2],(i+1)/n(6)) for i in range(n(6))]
    fr+=[(c[2],1)]*n(44); return fr
def comp(base,a,sq):
    b=square(base) if sq else base
    if a>0:
        o=(ovq if sq else ovv).copy(); o.putalpha(o.getchannel('A').point(lambda v:int(v*a)))
        b=b.convert('RGBA'); b.alpha_composite(o); b=b.convert('RGB')
    return b
for sq,name,size in [(False,'neurazenx-2frascos-9x16.mp4',(1080,1920)),(True,'neurazenx-2frascos-1x1.mp4',(1080,1080))]:
    w=iio.get_writer(name,fps=25,codec='libx264',quality=8,macro_block_size=8,pixelformat='yuv420p')
    for f,a in seq(25): w.append_data(np.asarray(comp(f,a,sq).resize(size,Image.LANCZOS)))
    w.close()
fr=[comp(f,a,False).resize((540,960),Image.LANCZOS) for f,a in seq(20)]
fr[0].save('neurazenx-2frascos-9x16.gif',save_all=True,append_images=fr[1:],duration=50,loop=0,optimize=True)
fq=[comp(f,a,True).resize((720,720),Image.LANCZOS) for f,a in seq(20)]
fq[0].save('neurazenx-2frascos-1x1.webp',save_all=True,append_images=fq[1:],duration=50,loop=0,quality=80,method=4)
v=comp(c[2],1,False).resize((470,836)); q=comp(c[2],1,True).resize((470,470))
s=Image.new('RGB',(960,836),'white'); s.paste(v,(0,0)); s.paste(q,(490,0)); s.save('/tmp/claude-0/-home-user-nomi-mobile/63f9065e-0006-51ee-955f-1ed9ba27f627/scratchpad/gifprev.jpg')
