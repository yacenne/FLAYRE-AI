Social Coach Extension Icons
============================

You need to create or download PNG icons in these sizes:
- icon16.png (16x16 pixels)
- icon48.png (48x48 pixels)
- icon128.png (128x128 pixels)

Recommended: Use a simple chat bubble or message icon with purple/indigo gradient.

You can create icons at:
- https://www.canva.com
- https://favicon.io/favicon-generator/
- https://icons8.com

For testing, you can use any 16x16, 48x48, and 128x128 PNG files.
For quick testing, let's create a simple data URI icon. Actually, let me give you a Python script to generate simple icons:

# Run this in Python to generate simple icons
python -c "
from PIL import Image, ImageDraw

def create_icon(size, filename):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a simple circle with gradient-like colors
    padding = size // 8
    draw.ellipse([padding, padding, size-padding, size-padding], fill='#667eea')
    
    # Add a simple chat icon (rectangle)
    inner_padding = size // 3
    draw.rectangle([inner_padding, inner_padding, size-inner_padding, size-inner_padding], fill='white')
    
    img.save(filename)
    print(f'Created {filename}')

create_icon(16, 'extension/icons/icon16.png')
create_icon(48, 'extension/icons/icon48.png')
create_icon(128, 'extension/icons/icon128.png')
"
If you don't have PIL, just download any three PNG images and rename them. The extension will work without proper icons.