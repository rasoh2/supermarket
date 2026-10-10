import os
import glob
from PIL import Image

PRODUCTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'images', 'products')

def optimize_images():
    pattern = os.path.join(PRODUCTS_DIR, '*.[jJ][pP][gG]')
    files = glob.glob(pattern)
    print(f"Encontrados {len(files)} archivos de imagen para optimizar en {PRODUCTS_DIR}")
    
    total_orig_size = 0
    total_new_size = 0

    for file_path in files:
        orig_size = os.path.getsize(file_path)
        total_orig_size += orig_size
        
        try:
            with Image.open(file_path) as img:
                # Convert RGBA or Palette to RGB if necessary
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                
                # Resize if larger than 600x600 px preserving aspect ratio
                img.thumbnail((600, 600), Image.Resampling.LANCZOS)
                
                # Overwrite optimized JPEG
                img.save(file_path, "JPEG", quality=80, optimize=True)
                
            new_size = os.path.getsize(file_path)
            total_new_size += new_size
            
            savings_pct = (1 - (new_size / orig_size)) * 100
            print(f"Optimizado {os.path.basename(file_path)}: {orig_size/1024:.1f}KB -> {new_size/1024:.1f}KB ({savings_pct:.1f}% ahorro)")
        except Exception as e:
            print(f"Error optimizando {file_path}: {e}")

    orig_mb = total_orig_size / (1024 * 1024)
    new_mb = total_new_size / (1024 * 1024)
    total_savings = (1 - (total_new_size / total_orig_size)) * 100 if total_orig_size else 0
    print(f"\n==========================================")
    print(f"TOTAL ORIGINAL: {orig_mb:.2f} MB")
    print(f"TOTAL OPTIMIZADO: {new_mb:.2f} MB")
    print(f"AHORRO TOTAL: {total_savings:.1f}%")
    print(f"==========================================")

if __name__ == '__main__':
    optimize_images()
