const fs = require('fs');

const data = fs.readFileSync('public/generated_resources/Nagarjuna_University/MBA/chapter_1/video_1_importance_and_scope_of_marketing/Learn/Flashcards/flashcards_advanced.md', 'utf8');

const regex = /\*\*(?:Q|Front):\*\*\s*([\s\S]*?)\s*\*\*(?:A|Back):\*\*\s*([\s\S]*?)(?=\n#{1,6}[ \t]+\S|\n---\s*|\n\*\*(?:Q|Front):|$)/g;

const matches = [...data.matchAll(regex)];
console.log("Matches found:", matches.length);
if (matches.length > 0) {
    console.log("First match Q:", matches[0][1]);
    console.log("First match A:", matches[0][2]);
}
