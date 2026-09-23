"""Export local glyph outlines for the optional walkthrough renderer.
Requires fontTools. System DejaVu fonts are only used during rendering.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
import json
root = Path(__file__).resolve().parent.parent
result = {}
for name, path in [
    ('hand', root / 'public/fonts/smile-moon.otf'),
    ('sans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'),
    ('mono', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'),
]:
    font = TTFont(path)
    glyph_set = font.getGlyphSet()
    cmap = font.getBestCmap()
    glyphs = {}
    for char in ''.join(chr(i) for i in range(32, 127)) + '–—’←→✳·…':
        name_in_font = cmap.get(ord(char), cmap[ord('?')])
        pen = SVGPathPen(glyph_set)
        glyph_set[name_in_font].draw(pen)
        glyphs[char] = {'d': pen.getCommands(), 'w': font['hmtx'][name_in_font][0]}
    result[name] = {'upm': font['head'].unitsPerEm, 'glyphs': glyphs}
(root / 'tools/preview-fonts.json').write_text(json.dumps(result))
