const fs = require('fs');
const file = 'd:/saralvidhya/saralvidhya-moocs/public/generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Quick_Summary/quick_summary_intermediate.md';
const text = fs.readFileSync(file, 'utf8');
const matches = text.match(/<img[^>]+>/gi);
if (matches) {
    const b64 = matches[7].match(/src=["']data:image\/webp;base64,([^"']+)["']/)[1];
    const buf = Buffer.from(b64, 'base64');
    // WebP files start with 'RIFF', then 4 bytes of size, then 'WEBP'
    console.log('Signature:', buf.toString('ascii', 0, 4));
    console.log('Type:', buf.toString('ascii', 8, 12));
}
