const fs = require('fs');
const file = 'd:/saralvidhya/saralvidhya-moocs/public/generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Quick_Summary/quick_summary_intermediate.md';
let text = fs.readFileSync(file, 'utf8');

const regex = /(src=["']data:image\/[^;]+;base64,)([^"']+)(["'])/gi;
let matchCount = 0;
let newText = text.replace(regex, (m, p, d, s) => {
    matchCount++;
    return p + d.replace(/\s+/g, '') + s;
});

console.log('Matches:', matchCount);
console.log('Original Length:', text.length);
console.log('New Length:', newText.length);
