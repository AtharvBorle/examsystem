import os
from PIL import Image, ImageDraw

src_path = r"c:\Users\Admin\Downloads\onlineexamsystem\frontend\public\app_icon.jpeg"
mobile_icon_path = r"c:\Users\Admin\Downloads\onlineexamsystem\mobile\icon.jpeg"
res_dir = r"c:\Users\Admin\Downloads\onlineexamsystem\mobile\android\app\src\main\res"

try:
    img = Image.open(src_path)
    img.save(mobile_icon_path)
    print(f"Copied source image to {mobile_icon_path}")
except Exception as e:
    print(f"Error copying to mobile icon: {e}")

densities = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192
}

for folder, size in densities.items():
    folder_path = os.path.join(res_dir, folder)
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
        
    # Resize image for square launcher icon
    square_img = img.resize((size, size), Image.Resampling.LANCZOS)
    square_img.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")
    
    # Create circular mask for round launcher icon
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)
    
    # Create an image with an alpha channel
    round_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    round_img.paste(square_img, (0, 0), mask=mask)
    round_img.save(os.path.join(folder_path, "ic_launcher_round.png"), "PNG")
    print(f"Generated icons for {folder} ({size}x{size})")
