const fs = require('fs');
const path = require('path');

const summaryFile = 'd:/saralvidhya/saralvidhya-moocs/public/generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Quick_Summary/quick_summary_intermediate.md';
const outputDir = 'd:/saralvidhya/saralvidhya-moocs/public/generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Flashcards/images';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const text = fs.readFileSync(summaryFile, 'utf8');
const matches = text.match(/<img[^>]+src=["'](data:image\/webp;base64,([^"']+))["'][^>]*>/gi);

if (matches) {
    matches.forEach((m, i) => {
        const srcMatch = m.match(/src=["']data:image\/webp;base64,([^"']+)["']/);
        if (srcMatch) {
            const b64 = srcMatch[1].replace(/\s+/g, ''); // clean any newlines
            const buf = Buffer.from(b64, 'base64');
            const filename = `infographic_${i + 1}.webp`;
            fs.writeFileSync(path.join(outputDir, filename), buf);
            console.log(`Saved ${filename} (${buf.length} bytes)`);
        }
    });
} else {
    console.log('No base64 images found.');
}
