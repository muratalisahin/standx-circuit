from pathlib import Path
from PIL import Image

src = Path(
    r"C:\Users\Murat\.cursor\projects\c-Users-Murat-Desktop-standx-circuit\assets\c__Users_Murat_AppData_Roaming_Cursor_User_workspaceStorage_5d1e4a4d9f469dfe9e17ed9dbfc83e32_images_standximge-a3752ba7-7459-46ff-a006-000303c9393a.png"
)
out = Path(r"C:\Users\Murat\Desktop\standx-circuit\public\images")
out.mkdir(parents=True, exist_ok=True)
im = Image.open(src).convert("RGBA")

def knock_white(tile, thresh=242):
    px = tile.load()
    tw, th = tile.size
    for y in range(th):
        for x in range(tw):
            r, g, b, a = px[x, y]
            if r >= thresh and g >= thresh and b >= thresh:
                px[x, y] = (255, 255, 255, 0)
    return tile

def tight(tile, pad=10):
    bbox = tile.getbbox()
    if not bbox:
        return tile
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(tile.size[0], r + pad)
    b = min(tile.size[1], b + pad)
    return tile.crop((l, t, r, b))

def save(name, box):
    tile = tight(knock_white(im.crop(box)))
    tile.save(out / f"{name}.png")
    print(name, tile.size)

save("standx-mark", (73, 62, 232, 228))
save("stander-34", (50, 350, 230, 590))
save("stander-front", (300, 350, 480, 590))
save("stander-side", (548, 350, 722, 590))
save("stander-back", (792, 350, 978, 590))
save("stander-focus", (40, 645, 260, 905))
save("stander-think", (320, 645, 530, 905))
save("stander-formal", (548, 645, 770, 905))
save("stander-cozy", (808, 645, 980, 905))

front = Image.open(out / "stander-front.png")
front.save(out / "stander.png")
