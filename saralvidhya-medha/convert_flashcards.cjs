const fs = require('fs');
const content = fs.readFileSync('public/generated_resources/cbse/class_10/maths/chapter_01/advanced/flashcards.md', 'utf8');
const fixed = content.replace(/\\pmod/g, '\\\\pmod');
const data = JSON.parse(fixed);
let md = '# Flashcards\n\n';
data.forEach(card => {
  md += `**Q:** ${card.front}\n\n**A:** ${card.back}\n\n---\n\n`;
});
fs.writeFileSync('public/generated_resources/cbse/class_10/maths/chapter_01/advanced/flashcards.md', md);
console.log('Done!');
