const fs = require('fs');
let md = fs.readFileSync('public/generated_resources/cbse/class_10/maths/chapter_01/advanced/flashcards.md', 'utf8');
// Convert \( and \) to $
md = md.replace(/\\\(/g, '$').replace(/\\\)/g, '$');
fs.writeFileSync('public/generated_resources/cbse/class_10/maths/chapter_01/advanced/flashcards.md', md);
