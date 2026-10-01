const fs = require('fs');
const file = 'd:/saralvidhya/saralvidhya-moocs/public/generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Quick_Summary/quick_summary_intermediate.md';
let text = fs.readFileSync(file, 'utf8');

const regex = /(src=["']data:image\/[^;]+;base64,)([^"']+)(["'])/gi;
let match = regex.exec(text);
if (match) {
    const b64 = match[2];
    fs.writeFileSync('test_image.webp', Buffer.from(b64, 'base64'));
    console.log('Wrote test_image.webp, size:', Buffer.from(b64, 'base64').length);
}
