"""
Seed script to generate and index sample demo images representing different visual categories:
- Red sports car on highway
- Golden retriever puppy
- Mountain landscape with snow
- Sunset beach with palm trees
- Modern laptop workspace with coffee
- Neon futuristic cyberpunk city
- Coffee mug with latte art
- Fresh colorful fruit basket
"""

import io
from PIL import Image, ImageDraw
from app.database import init_db
from app.services import process_and_index_image
import logging

logging.basicConfig(level=logging.INFO)

def create_red_sports_car() -> bytes:
    img = Image.new("RGB", (640, 480), color=(140, 150, 160)) # Sky/highway backdrop
    draw = ImageDraw.Draw(img)
    # Mountains in distance
    draw.polygon([(0, 240), (160, 120), (320, 240)], fill=(90, 100, 115))
    draw.polygon([(240, 240), (420, 100), (640, 240)], fill=(80, 90, 105))
    # Highway road
    draw.polygon([(0, 480), (220, 240), (420, 240), (640, 480)], fill=(40, 42, 45))
    draw.line([(320, 240), (320, 480)], fill=(240, 220, 60), width=4)
    # Sleek Red sports car body
    draw.rectangle([180, 270, 460, 360], fill=(220, 25, 25))
    draw.polygon([(230, 270), (280, 210), (410, 210), (440, 270)], fill=(180, 20, 20))
    # Windshield / windows
    draw.polygon([(285, 215), (390, 215), (420, 265), (250, 265)], fill=(30, 50, 70))
    # Headlights
    draw.ellipse([435, 290, 455, 310], fill=(255, 255, 200))
    draw.ellipse([185, 290, 205, 310], fill=(255, 255, 200))
    # Wheels
    draw.ellipse([210, 340, 270, 400], fill=(20, 20, 20))
    draw.ellipse([225, 355, 255, 385], fill=(160, 160, 160))
    draw.ellipse([370, 340, 430, 400], fill=(20, 20, 20))
    draw.ellipse([385, 355, 415, 385], fill=(160, 160, 160))
    
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()

def create_snowy_mountain() -> bytes:
    img = Image.new("RGB", (640, 480), color=(135, 206, 235)) # Sky
    draw = ImageDraw.Draw(img)
    # Sun
    draw.ellipse([450, 60, 530, 140], fill=(255, 235, 120))
    # Mountain 1
    draw.polygon([(50, 400), (280, 100), (520, 400)], fill=(110, 120, 135))
    # Snow cap 1
    draw.polygon([(220, 180), (280, 100), (340, 180), (300, 170), (280, 190), (250, 170)], fill=(245, 250, 255))
    # Mountain 2
    draw.polygon([(300, 420), (480, 150), (640, 420)], fill=(80, 90, 105))
    # Snow cap 2
    draw.polygon([(420, 220), (480, 150), (550, 220), (510, 210), (480, 230), (450, 210)], fill=(245, 250, 255))
    # Pine trees at base
    for x in range(0, 640, 40):
        draw.polygon([(x+20, 360), (x, 440), (x+40, 440)], fill=(25, 75, 35))
    # Lake in foreground
    draw.rectangle([0, 420, 640, 480], fill=(30, 80, 140))
    
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()

def create_sunset_beach() -> bytes:
    img = Image.new("RGB", (640, 480), color=(255, 130, 70)) # Sunset sky
    draw = ImageDraw.Draw(img)
    # Sun
    draw.ellipse([260, 160, 380, 280], fill=(255, 240, 130))
    # Ocean
    draw.rectangle([0, 270, 640, 390], fill=(20, 60, 120))
    # Sun reflection on water
    draw.rectangle([280, 270, 360, 390], fill=(230, 140, 60))
    # Sandy beach
    draw.rectangle([0, 380, 640, 480], fill=(210, 170, 100))
    # Palm tree trunk
    draw.line([(540, 480), (510, 200)], fill=(80, 50, 30), width=14)
    # Palm leaves
    for angle in [(440, 160), (460, 140), (510, 130), (560, 140), (590, 170)]:
        draw.line([(510, 200), angle], fill=(35, 100, 40), width=8)

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()

def create_cyberpunk_city() -> bytes:
    img = Image.new("RGB", (640, 480), color=(10, 10, 25)) # Night sky
    draw = ImageDraw.Draw(img)
    # Neon moon
    draw.ellipse([480, 50, 560, 130], fill=(255, 0, 128))
    # Skyscrapers
    buildings = [
        (20, 160, 120, 480, (20, 25, 45)),
        (130, 100, 240, 480, (15, 20, 38)),
        (250, 180, 360, 480, (25, 30, 50)),
        (370, 120, 490, 480, (18, 22, 40)),
        (500, 190, 620, 480, (22, 28, 48))
    ]
    for left, top, right, bottom, color in buildings:
        draw.rectangle([left, top, right, bottom], fill=color)
        # Windows
        for wy in range(top + 20, bottom - 40, 30):
            for wx in range(left + 15, right - 15, 25):
                win_col = (0, 240, 255) if (wx + wy) % 2 == 0 else (255, 0, 210)
                draw.rectangle([wx, wy, wx + 12, wy + 16], fill=win_col)
    # Wet street reflecting neon
    draw.rectangle([0, 440, 640, 480], fill=(30, 15, 40))
    draw.line([(0, 442), (640, 442)], fill=(0, 255, 200), width=3)
    
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()

def create_coffee_workspace() -> bytes:
    img = Image.new("RGB", (640, 480), color=(220, 200, 180)) # Wooden desk
    draw = ImageDraw.Draw(img)
    # Laptop
    draw.rectangle([140, 80, 420, 260], fill=(160, 165, 175))
    draw.rectangle([155, 95, 405, 245], fill=(30, 35, 45)) # Screen
    draw.rectangle([120, 255, 440, 360], fill=(190, 195, 205)) # Keyboard base
    draw.rectangle([160, 270, 400, 330], fill=(80, 85, 95)) # Keys
    draw.rectangle([250, 335, 310, 355], fill=(140, 145, 155)) # Trackpad
    # Coffee Mug
    draw.ellipse([460, 220, 560, 320], fill=(245, 245, 245)) # Cup
    draw.ellipse([475, 235, 545, 305], fill=(100, 60, 30))   # Coffee
    draw.ellipse([490, 250, 530, 290], fill=(230, 210, 185)) # Latte foam
    # Plant pot
    draw.rectangle([60, 280, 110, 360], fill=(200, 110, 70))
    draw.ellipse([50, 220, 120, 290], fill=(40, 130, 50))
    
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()

def create_golden_retriever_dog() -> bytes:
    img = Image.new("RGB", (640, 480), color=(120, 180, 90)) # Green meadow
    draw = ImageDraw.Draw(img)
    # Dog body
    draw.ellipse([180, 220, 460, 380], fill=(225, 175, 95))
    # Dog head
    draw.ellipse([340, 140, 480, 280], fill=(235, 185, 105))
    # Snout
    draw.ellipse([420, 200, 495, 265], fill=(240, 195, 125))
    draw.ellipse([465, 210, 490, 235], fill=(20, 20, 20)) # Nose
    # Eyes
    draw.ellipse([400, 175, 420, 195], fill=(30, 20, 10))
    # Ears
    draw.polygon([(360, 160), (330, 240), (390, 220)], fill=(195, 145, 75))
    # Legs
    draw.rectangle([220, 340, 260, 430], fill=(220, 170, 90))
    draw.rectangle([380, 340, 420, 430], fill=(220, 170, 90))
    # Tail
    draw.polygon([(180, 260), (120, 220), (140, 280)], fill=(230, 180, 100))
    
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()

def seed_all():
    print("Seeding database and FAISS index with initial demo collection...")
    init_db()

    samples = [
        ("Red sports car parked on highway near mountains", "red_sports_car_highway.jpg", create_red_sports_car),
        ("Snowy mountain peaks and lake landscape", "snowy_mountain_landscape.jpg", create_snowy_mountain),
        ("Tropical sunset beach with ocean and palm trees", "tropical_sunset_beach.jpg", create_sunset_beach),
        ("Cyberpunk futuristic neon skyscraper city at night", "cyberpunk_neon_city.jpg", create_cyberpunk_city),
        ("Modern laptop workspace with coffee cup and plant", "modern_workspace_coffee.jpg", create_coffee_workspace),
        ("Golden retriever dog sitting on green meadow grass", "golden_retriever_dog.jpg", create_golden_retriever_dog),
    ]

    for title, fname, generator_fn in samples:
        print(f"Generating and indexing: {title} ({fname})...")
        img_bytes = generator_fn()
        item, is_new = process_and_index_image(img_bytes, fname)
        status = "Indexed new" if is_new else "Already indexed"
        print(f"  {status}: ID #{item['id']} | Tags: {item['tags']}")

    print("Seed complete! Demo collection is ready.")

if __name__ == "__main__":
    seed_all()
