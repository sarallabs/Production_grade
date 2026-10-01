const fs = require('fs');
const file = 'd:/saralvidhya/saralvidhya-moocs/public/generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Quick_Summary/quick_summary_intermediate.md';
const text = fs.readFileSync(file, 'utf8');
const matches = text.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
if (matches) {
    matches.forEach((m, i) => {
        const src = m.match(/src=["']([^"']+)["']/)[1];
        if (src.startsWith('data:image')) {
            const b64 = src.split(',')[1];
            try {
                const buf = Buffer.from(b64, 'base64');
                console.log(`Image ${i+1}: ${buf.length} bytes`);
            } catch (e) {
                console.log(`Image ${i+1}: invalid base64`);
            }
        }
    });
}
