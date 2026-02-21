
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Requirements: Pillow (pip install Pillow)

from PIL import Image
import os

expanded_width = 1000
thumbnail_width = 400

# Paths relative to the repository root
script_dir = os.path.dirname(os.path.abspath(__file__))
repo_root = os.path.dirname(script_dir)

img_source_path = os.path.join(repo_root, "img_gallery", "originals")
thumbnail_output_path = os.path.join(repo_root, "img_gallery", "Thumbnails")
expanded_output_path = os.path.join(repo_root, "img_gallery")

os.makedirs(thumbnail_output_path, exist_ok=True)
os.makedirs(expanded_output_path, exist_ok=True)

print(f"Input images from {img_source_path}")
print(f"Output thumbnails to {thumbnail_output_path}")
print(f"Output expanded to {expanded_output_path}")

for file in sorted(os.listdir(img_source_path)):
    if not file.upper().endswith((".PNG", ".JPG", ".JPEG")):
        print(f"  SKIP: {file} (unknown extension)")
        continue

    src = os.path.join(img_source_path, file)
    image = Image.open(src)

    # Save expanded version
    expanded = image.copy()
    expanded.thumbnail((expanded_width, 20000))
    expanded.save(os.path.join(expanded_output_path, file))

    # Save thumbnail
    thumb = image.copy()
    thumb.thumbnail((thumbnail_width, 20000))
    thumb.save(os.path.join(thumbnail_output_path, file))

    print(f"  OK: {file} ({image.size[0]}x{image.size[1]} -> {expanded.size[0]}x{expanded.size[1]} / {thumb.size[0]}x{thumb.size[1]})")


