# Courier Partner Logos - Download Sources

## Current Courier Partners Needing Logos

### 1. **BlueDart** (Blue Dart Express)
- **Wikipedia Commons (SVG - Transparent)**: https://upload.wikimedia.org/wikipedia/commons/7/7d/Blue_Dart_Express_logo.svg
- **Alternative PNG**: Search "Blue Dart logo transparent" on Google Images
- **Recommended**: Use SVG from Wikipedia Commons for best quality

### 2. **FedEx**
- **Wikipedia Commons (SVG - Transparent)**: https://upload.wikimedia.org/wikipedia/commons/3/3b/FedEx_Express.svg
- **Alternative**: https://upload.wikimedia.org/wikipedia/commons/4/4e/FedEx_Logo.svg
- **Recommended**: Use SVG from Wikipedia Commons

### 3. **Delhivery**
- **Official Website**: https://www.delhivery.com/assets/images/delhivery-logo.svg
- **Alternative**: Search "Delhivery logo transparent PNG" on Google Images
- **Note**: May need to download and convert to PNG if SVG not supported

### 4. **Shiprocket**
- **Official Website**: https://www.shiprocket.in/wp-content/uploads/2020/11/shiprocket-logo.svg
- **Alternative**: Search "Shiprocket logo transparent" on Google Images
- **Recommended**: Use official website SVG

### 5. **DTDC** (Already has logo, but here's a backup source)
- **Wikipedia Commons (SVG)**: https://upload.wikimedia.org/wikipedia/commons/1/1b/DTDC_logo.svg
- **Current**: Already uploaded as `311a06c8-cb13-48d5-8336-ada3fb3e1861.png`

## How to Add Logos

### Option 1: Upload via Admin Panel (Recommended)
1. Go to Admin Panel → Courier Manager
2. Click "Edit" on each courier
3. Click "Upload Logo" button
4. Download the logo from the links above
5. Upload the image file (PNG, JPG, or SVG)
6. Save the courier

### Option 2: Direct Download Links (Quick Access)

**BlueDart:**
- SVG: https://upload.wikimedia.org/wikipedia/commons/7/7d/Blue_Dart_Express_logo.svg
- Right-click → Save Image As → Save as PNG/JPG

**FedEx:**
- SVG: https://upload.wikimedia.org/wikipedia/commons/3/3b/FedEx_Express.svg
- Right-click → Save Image As → Save as PNG/JPG

**Delhivery:**
- Official: https://www.delhivery.com/assets/images/delhivery-logo.svg
- Or search Google Images for "Delhivery logo transparent PNG"

**Shiprocket:**
- Official: https://www.shiprocket.in/wp-content/uploads/2020/11/shiprocket-logo.svg
- Or search Google Images for "Shiprocket logo transparent PNG"

## Additional Logo Sources

### Free Logo Resources:
1. **Wikipedia Commons**: https://commons.wikimedia.org/ (Search "company name logo")
2. **PNGTree**: https://pngtree.com/ (Search "courier logo transparent")
3. **Vecteezy**: https://www.vecteezy.com/ (Free vector logos)
4. **LogoSearch**: https://logosearch.io/ (Company logo database)

### Google Images Search Tips:
- Search: "[Company Name] logo transparent background"
- Use Tools → Color → Transparent
- Filter by Image Type → PNG or SVG

## Logo Requirements
- **Format**: PNG (preferred) or JPG
- **Background**: Transparent (PNG with alpha channel)
- **Size**: Recommended 200x200px to 500x500px
- **File Size**: Max 10MB
- **Aspect Ratio**: Square or rectangular (maintain brand proportions)

## Quick Download Script

You can use this Python script to download logos automatically:

```python
import requests
from pathlib import Path

logos = {
    "bluedart": "https://upload.wikimedia.org/wikipedia/commons/7/7d/Blue_Dart_Express_logo.svg",
    "fedex": "https://upload.wikimedia.org/wikipedia/commons/3/3b/FedEx_Express.svg",
    "dtdc": "https://upload.wikimedia.org/wikipedia/commons/1/1b/DTDC_logo.svg",
    "delhivery": "https://www.delhivery.com/assets/images/delhivery-logo.svg",
    "shiprocket": "https://www.shiprocket.in/wp-content/uploads/2020/11/shiprocket-logo.svg"
}

download_dir = Path("courier_logos")
download_dir.mkdir(exist_ok=True)

for name, url in logos.items():
    try:
        response = requests.get(url)
        if response.status_code == 200:
            ext = url.split('.')[-1]
            filepath = download_dir / f"{name}_logo.{ext}"
            filepath.write_bytes(response.content)
            print(f"✓ Downloaded {name} logo")
        else:
            print(f"✗ Failed to download {name} logo: {response.status_code}")
    except Exception as e:
        print(f"✗ Error downloading {name}: {e}")
```

