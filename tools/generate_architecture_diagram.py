from PIL import Image, ImageDraw, ImageFont
import os

BASE = os.path.dirname(__file__)
OUT = os.path.join(BASE, '..', 'docs')
os.makedirs(OUT, exist_ok=True)
OUT_FILE = os.path.join(OUT, 'architecture.png')

W, H = 1400, 700
img = Image.new('RGB', (W, H), (255, 255, 255))
d = ImageDraw.Draw(img)

# Try to load a system font
try:
    font_bold = ImageFont.truetype('arialbd.ttf', 18)
    font = ImageFont.truetype('arial.ttf', 14)
except Exception:
    font_bold = ImageFont.load_default()
    font = ImageFont.load_default()

# Helper to draw rounded rects
def round_rect(draw, xy, radius, fill, outline=(0,0,0)):
    x1,y1,x2,y2 = xy
    draw.rounded_rectangle([x1,y1,x2,y2], radius=radius, fill=fill, outline=outline)

# Draw header
d.text((40,20), 'MediBot - System Architecture', fill=(20,20,20), font=ImageFont.truetype('arialbd.ttf', 26) if os.path.exists('C:/Windows/Fonts/arialbd.ttf') else font_bold)

# Frontend box
round_rect(d, (60,80,520,200), 12, fill=(235,245,255))
d.text((80,100), 'Frontend', fill=(10,40,80), font=ImageFont.truetype('arialbd.ttf', 18) if os.path.exists('C:/Windows/Fonts/arialbd.ttf') else font_bold)
d.text((80,130), 'React + Vite + TypeScript', fill=(30,30,30), font=font)
d.text((80,150), '- Components: Chat, DiseaseForms, HospitalFinder', fill=(30,30,30), font=font)

# Backend box
round_rect(d, (620,80,1200,200), 12, fill=(245,235,255))
d.text((640,100), 'Backend', fill=(60,10,80), font=ImageFont.truetype('arialbd.ttf', 18) if os.path.exists('C:/Windows/Fonts/arialbd.ttf') else font_bold)
d.text((640,130), 'FastAPI (Python)', fill=(30,30,30), font=font)
d.text((640,150), '- /predict/* endpoints, model serving via joblib', fill=(30,30,30), font=font)

# ML Models box
round_rect(d, (140,250,520,420), 12, fill=(235,255,240))
d.text((160,270), 'ML Models', fill=(6,80,30), font=ImageFont.truetype('arialbd.ttf', 18) if os.path.exists('C:/Windows/Fonts/arialbd.ttf') else font_bold)
d.text((160,300), 'Support Vector Classifier (SVC)', fill=(30,30,30), font=font)
d.text((160,320), 'Random Forest (selected if better)', fill=(30,30,30), font=font)

# NLP/Cloud box
round_rect(d, (620,250,1200,420), 12, fill=(255,245,235))
d.text((640,270), 'Conversational & NLP', fill=(80,50,6), font=ImageFont.truetype('arialbd.ttf', 18) if os.path.exists('C:/Windows/Fonts/arialbd.ttf') else font_bold)
d.text((640,300), 'Google Gemini (genai)', fill=(30,30,30), font=font)
d.text((640,320), '- Multilingual responses, Maps tool integration', fill=(30,30,30), font=font)

# Geolocation / Maps
round_rect(d, (300,470,900,600), 12, fill=(255,250,235))
d.text((320,490), 'Location Services', fill=(80,50,6), font=ImageFont.truetype('arialbd.ttf', 18) if os.path.exists('C:/Windows/Fonts/arialbd.ttf') else font_bold)
d.text((320,520), 'Browser Geolocation API -> coordinates', fill=(30,30,30), font=font)
d.text((320,540), 'Google Maps via Gemini tool for nearby hospitals/pharmacies', fill=(30,30,30), font=font)

# Arrows: Frontend -> Backend
arrow_color = (60,60,60)
d.line([(520,140),(620,140)], fill=arrow_color, width=2)
d.polygon([(620,140),(610,135),(610,145)], fill=arrow_color)
d.text((540,120), 'API calls (predictions / chat)', fill=(60,60,60), font=font)

# Arrows: Backend -> ML Models
d.line([(620,300),(520,300)], fill=arrow_color, width=2)
d.polygon([(520,300),(530,295),(530,305)], fill=arrow_color)
d.text((440,290), 'Loads joblib models', fill=(60,60,60), font=font)

# Arrow: Frontend -> Geolocation
d.line([(290,200),(290,470)], fill=arrow_color, width=2)
d.polygon([(290,470),(285,460),(295,460)], fill=arrow_color)
d.text((200,320), 'navigator.geolocation', fill=(60,60,60), font=font)

# Arrow: Frontend -> NLP cloud
d.line([(520,160),(620,300)], fill=arrow_color, width=2)
d.polygon([(620,300),(615,290),(625,290)], fill=arrow_color)
d.text((540,200), 'Optional: chat messages / maps queries', fill=(60,60,60), font=font)

# Footer notes
footer_text = 'Diagram: Local ML inference + cloud NLP (optional). See ARCHITECTURE.md for details.'
d.text((40,650), footer_text, fill=(100,100,100), font=font)

img.save(OUT_FILE)
print('Saved diagram to', OUT_FILE)
