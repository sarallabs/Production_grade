const fs = require('fs');
let txt = fs.readFileSync('d:/saralvidhya/saralvidhya-moocs/public/generated_resources/Nagarjuna_University/MBA/chapter_2/Learn/Detailed_Summary/detailed_summary_beginner.md', 'utf8');
const oldLen = txt.length;
txt = txt.replace(/(src=["']data:image\/[^;]+;base64,)([^"']+)(["'])/gi, (match, p1, p2, p3) => p1 + p2.replace(/\s+/g, '') + p3);
console.log('Old length:', oldLen, 'New length:', txt.length);
