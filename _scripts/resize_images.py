#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Requirements: Pillow (pip install Pillow)
#
# Usage (from the repo root):
#   python _scripts/resize_images.py              # every image in img_gallery/originals
#   python _scripts/resize_images.py A.JPG B.JPG  # only these originals (by file name)
#
# Originals keep their camera metadata; the published copies are upright (EXIF
# orientation applied), converted to sRGB (iPhone photos are Display P3) and carry
# no metadata (no EXIF/GPS).

from PIL import Image, ImageCms, ImageOps
import io
import os
import sys

expanded_width = 1000
thumbnail_width = 400

# Paths relative to the repository root
script_dir = os.path.dirname(os.path.abspath(__file__))
repo_root = os.path.dirname(script_dir)

img_source_path = os.path.join(repo_root, "img_gallery", "originals")
thumbnail_output_path = os.path.join(repo_root, "img_gallery", "Thumbnails")
expanded_output_path = os.path.join(repo_root, "img_gallery")

SRGB = ImageCms.createProfile("sRGB")


def load_for_web(path):
    """Upright image in sRGB, without the original's metadata."""
    image = ImageOps.exif_transpose(Image.open(path))
    icc = image.info.get("icc_profile")
    if icc and image.mode == "RGB":
        src_profile = ImageCms.ImageCmsProfile(io.BytesIO(icc))
        image = ImageCms.profileToProfile(image, src_profile, SRGB, outputMode="RGB")
    image.info = {}
    return image


os.makedirs(thumbnail_output_path, exist_ok=True)
os.makedirs(expanded_output_path, exist_ok=True)

print(f"Input images from {img_source_path}")
print(f"Output thumbnails to {thumbnail_output_path}")
print(f"Output expanded to {expanded_output_path}")

files = sys.argv[1:] or sorted(os.listdir(img_source_path))
for file in files:
    if not file.upper().endswith((".PNG", ".JPG", ".JPEG")):
        print(f"  SKIP: {file} (unknown extension)")
        continue

    src = os.path.join(img_source_path, file)
    image = load_for_web(src)

    # Save expanded version
    expanded = image.copy()
    expanded.thumbnail((expanded_width, 20000))
    expanded.save(os.path.join(expanded_output_path, file))

    # Save thumbnail
    thumb = image.copy()
    thumb.thumbnail((thumbnail_width, 20000))
    thumb.save(os.path.join(thumbnail_output_path, file))

    print(f"  OK: {file} ({image.size[0]}x{image.size[1]} -> {expanded.size[0]}x{expanded.size[1]} / {thumb.size[0]}x{thumb.size[1]})")
