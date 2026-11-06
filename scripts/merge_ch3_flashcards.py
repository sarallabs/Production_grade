import json
import re
import os

base_dir = r"saralvidhya-mvp\public\generated_resources\angrau\chapter_03\Practice\Revise (Flashcards)"

for level in ["beginner", "intermediate", "advanced"]:
    md_file = os.path.join(base_dir, f"flashcards_{level}.md")
    json_file = os.path.join(base_dir, f"flashcards_{level}.json")
    
    if not os.path.exists(md_file) or not os.path.exists(json_file):
        print(f"Skipping {level}, file not found")
        continue

    with open(md_file, "r", encoding="utf-8") as f:
        md_text = f.read()

    with open(json_file, "r", encoding="utf-8") as f:
        json_data = json.load(f)

    # Split md_text by "### Q:"
    blocks = re.split(r"###\s*Q:", md_text)[1:]
    cards = json_data.get("cards", [])
    print(f"[{level}] Blocks in MD: {len(blocks)}, Cards in JSON: {len(cards)}")

    for i, card in enumerate(cards):
        if i < len(blocks):
            block = blocks[i]
            img_match = re.search(r'<img[^>]+src=["\'](data:image/[^;]+;base64,[^"\']+)["\']', block)
            if img_match:
                card["img"] = img_match.group(1)
                card["infographicUrl"] = img_match.group(1)
                print(f"  Card {i+1} got image ({len(img_match.group(1))} bytes)")

    out_file = f"saralvidhya-production/backend/data/ch3_{level}.json"
    os.makedirs(os.path.dirname(out_file), exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(json_data, f, indent=2)
    print(f"Saved merged {level} to {out_file}")
