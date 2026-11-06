const fs = require('fs');
const txt = fs.readFileSync('d:/saralvidhya/saralvidhya-moocs/public/generated_resources/Nagarjuna_University/MBA/chapter_2/Learn/Detailed_Summary/detailed_summary_beginner.md', 'utf8');
const match = txt.match(/<img[^>]+>|!\[[^\]]*\]\([^\)]+\)/i);
if(match) console.log(match[0].substring(0, 150) + '...');
else console.log('No image found at all!');
