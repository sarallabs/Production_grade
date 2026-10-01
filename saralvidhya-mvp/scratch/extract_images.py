import os
import re
import base64
import hashlib

def process_markdown_file(file_path):
    print(f"Processing {file_path}...")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to match base64 images
    # We match both <img src="data:image/..." and ![...](data:image/...)
    # Actually, we just need to match the data URL itself: data:image/(ext);base64,(data)
    pattern = r'data:image/(png|jpeg|jpg);base64,([A-Za-z0-9+/=]+)'
    
    matches = list(re.finditer(pattern, content))
    if not matches:
        print(f"  No base64 images found.")
        return

    print(f"  Found {len(matches)} base64 images.")
    
    base_dir = os.path.dirname(file_path)
    images_dir = os.path.join(base_dir, 'images')
    if not os.path.exists(images_dir):
        os.makedirs(images_dir)

    new_content = content
    for match in matches:
        ext = match.group(1)
        if ext == 'jpeg':
            ext = 'jpg'
        b64_data = match.group(2)
        full_match = match.group(0)
        
        # Calculate a short hash of the data to use as the filename
        # This prevents saving duplicates multiple times
        img_hash = hashlib.md5(b64_data.encode('utf-8')).hexdigest()[:8]
        img_filename = f"img_{img_hash}.{ext}"
        img_path = os.path.join(images_dir, img_filename)
        
        # Save the image if it doesn't exist
        if not os.path.exists(img_path):
            try:
                img_bytes = base64.b64decode(b64_data)
                with open(img_path, 'wb') as img_file:
                    img_file.write(img_bytes)
                print(f"  Saved {img_filename}")
            except Exception as e:
                print(f"  Failed to save {img_filename}: {e}")
                continue
        
        # Replace the base64 string in the content with the relative path
        rel_path = f"images/{img_filename}"
        new_content = new_content.replace(full_match, rel_path)

    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"  Updated {file_path}")

def main():
    root_dir = r"d:\saralvidhya-mvp\public\generated_resources\neb_nepal\class_10\biology\chapter_06\Read"
    for dirpath, _, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.endswith('.md'):
                file_path = os.path.join(dirpath, filename)
                process_markdown_file(file_path)

if __name__ == "__main__":
    main()
