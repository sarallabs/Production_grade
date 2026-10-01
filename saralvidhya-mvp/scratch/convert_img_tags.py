import os
import re

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match <img src="..." alt="..." ... /> with optional surrounding <br/>
    # Some tags might not have <br/> so we make them optional
    pattern = r'(?:<br/>\s*)?<img\s+src="([^"]+)"\s+alt="([^"]*)"[^>]*>(?:\s*<br/>)?'
    
    new_content = re.sub(pattern, r'![\2](\1)', content)
    
    # Also handle tags where alt is before src, or other attributes are present
    # A more robust regex just to find src and alt from an img tag:
    def replacer(match):
        img_tag = match.group(0)
        src_match = re.search(r'src="([^"]+)"', img_tag)
        alt_match = re.search(r'alt="([^"]*)"', img_tag)
        if src_match:
            src = src_match.group(1)
            alt = alt_match.group(1) if alt_match else "image"
            return f"\n\n![{alt}]({src})\n\n"
        return img_tag

    new_content2 = re.sub(r'(?:<br/>\s*)?<img\s+[^>]+>(?:\s*<br/>)?', replacer, content)

    if new_content2 != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content2)
        print(f"Updated {file_path}")

def main():
    root_dir = r"d:\saralvidhya-mvp\public\generated_resources\neb_nepal\class_10\biology\chapter_06\Read"
    for dirpath, _, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.endswith('.md'):
                process_file(os.path.join(dirpath, filename))

if __name__ == "__main__":
    main()
