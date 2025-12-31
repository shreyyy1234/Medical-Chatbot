from PIL import Image, ImageDraw, ImageFont
import os
import textwrap

BASE = os.path.dirname(__file__)
OUT_DIR = os.path.join(BASE, '..', 'docs')
os.makedirs(OUT_DIR, exist_ok=True)
OUT_FILE = os.path.join(OUT_DIR, 'block_diagram.png')

W, H = 2200, 720
img = Image.new('RGB', (W, H), (255, 255, 255))
d = ImageDraw.Draw(img)

# fonts
try:
    font_bold = ImageFont.truetype('arialbd.ttf', 24)
    font = ImageFont.truetype('arial.ttf', 16)
except Exception:
    font_bold = ImageFont.load_default()
    font = ImageFont.load_default()

# helper
def draw_multiline_text(x, y, text_lines, max_chars, font, fill=(40,40,40), leading=6):
    y_cursor = y
    for line in text_lines:
        wrapped = textwrap.wrap(line, width=max_chars)
        for wline in wrapped:
            d.text((x, y_cursor), wline, fill=fill, font=font)
            bbox = d.textbbox((x, y_cursor), wline, font=font)
            line_h = bbox[3] - bbox[1]
            y_cursor += line_h + leading
    return y_cursor


def box(x1, y1, x2, y2, title, lines, fill=(240,248,255)):
    radius = 10
    d.rounded_rectangle([x1, y1, x2, y2], radius=radius, fill=fill, outline=(140,140,140), width=2)
    d.text((x1+14, y1+10), title, fill=(20,20,20), font=font_bold)
    max_chars = 45
    y = y1 + 44
    draw_multiline_text(x1+14, y, lines, max_chars, font)

# Draw blocks left-to-right with arrows
# Layout settings
padding_y = 30
start_x = 60
start_y = 40
w_box = 360
h_box = 140
gap = 80

# Row 1 (top flow)
box(start_x, start_y, start_x + w_box, start_y + h_box, 'User Input Block', ['Collect symptoms via web form'], fill=(255,245,235))
box1_x = start_x + w_box + gap
box(box1_x, start_y, box1_x + w_box, start_y + h_box, 'Preprocessing', ['Convert user symptoms into machine-readable format'], fill=(235,255,245))
box2_x = box1_x + w_box + gap
box(box2_x, start_y, box2_x + w_box, start_y + h_box, 'Disease Prediction', ['Model: Pre-trained SVC'], fill=(235,245,255))
box3_x = box2_x + w_box + gap
box(box3_x, start_y, box3_x + w_box, start_y + h_box, 'Recommendations', ['Disease description', 'Medications', 'Precautions', 'Diet Plan', 'Workout'], fill=(255,245,235))

# arrows row1
def arrow(x1,y1,x2,y2, width=4, head=12):
    d.line([(x1,y1),(x2,y2)], fill=(90,90,90), width=width)
    # arrowhead
    import math
    angle = math.atan2(y2-y1, x2-x1)
    hx = x2 - head * math.cos(angle)
    hy = y2 - head * math.sin(angle)
    left = (hx + head/2 * math.sin(angle), hy - head/2 * math.cos(angle))
    right = (hx - head/2 * math.sin(angle), hy + head/2 * math.cos(angle))
    d.polygon([ (x2,y2), left, right ], fill=(90,90,90))

arrow(start_x + w_box, start_y + h_box//2, box1_x, start_y + h_box//2)
arrow(box1_x + w_box, start_y + h_box//2, box2_x, start_y + h_box//2)
arrow(box2_x + w_box, start_y + h_box//2, box3_x, start_y + h_box//2)

# Row 2
row2_y = start_y + h_box + 90
# Place Hospital Locator directly beneath Recommendations and other blocks to the left
hospital_x = box3_x  # center under Recommendations
hospital_y = row2_y
box(hospital_x, hospital_y, hospital_x + w_box, hospital_y + h_box, 'Hospital Locator Block', ['Gives nearest hospital contact', 'number and doctor'], fill=(245,255,250))
# left of hospital: Multilingual -> Healthcare Bot -> Frontend (leftwards chain)
multilingual_x = hospital_x - (w_box + gap)
healthcare_x = multilingual_x - (w_box + gap)
frontend_x = healthcare_x - (w_box + gap)
box(multilingual_x, row2_y, multilingual_x + w_box, row2_y + h_box, 'Multilingual Output', ['Translate outputs to selected language'], fill=(255,250,245))
box(healthcare_x, row2_y, healthcare_x + w_box, row2_y + h_box, 'Healthcare Bot', ['Text-based Q&A on common medical queries.'], fill=(245,245,255))
box(frontend_x, row2_y, frontend_x + w_box, row2_y + h_box, 'Frontend Display', ['Show all data nicely'], fill=(255,245,250))

# arrows: Recommendations -> Hospital Locator (vertical)
rec_mid_x = box3_x + w_box//2
arrow(rec_mid_x, start_y + h_box, hospital_x + w_box//2, hospital_y)
# arrow from Multilingual -> Hospital Locator (rightwards)
arrow(multilingual_x + w_box, row2_y + h_box//2, hospital_x, row2_y + h_box//2)
# leftward flow: Multilingual -> Healthcare Bot -> Frontend (left-pointing arrows)
arrow(multilingual_x + 20, row2_y + h_box//2, healthcare_x + w_box, row2_y + h_box//2)
arrow(healthcare_x + 20, row2_y + h_box//2, frontend_x + w_box, row2_y + h_box//2)
# small downward marker inside hospital locator (like sample)
cx = hospital_x + w_box//2
cy = hospital_y + 18
d.polygon([(cx, cy+8),(cx-8, cy-2),(cx+8, cy-2)], fill=(120,120,120))

# small notes
d.text((40, row2_y + h_box + 20), 'Notes: Dynamic form generation from CSV columns; Local inference preserves privacy when enabled.', fill=(60,60,60), font=font)

d.text((40, H-30), 'Diagram: MediBot block flow — User Input → Preprocessing → Prediction → Recommendations → Locator/Multilingual/Chat → Frontend', fill=(100,100,100), font=font)

img.save(OUT_FILE)
print('Saved block diagram to', OUT_FILE)
