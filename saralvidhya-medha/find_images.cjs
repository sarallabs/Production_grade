const fs = require('fs');
const file = 'd:/saralvidhya/saralvidhya-moocs/public/generated_resources/Nagarjuna_University/MBA/chapter_5/Learn/Quick_Summary/quick_summary_intermediate.md';
const text = fs.readFileSync(file, 'utf8');
const matches = text.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
if (matches) {
    matches.forEach(m => {
        let snippet = m.substring(0, 40) + '...';
        if (m.indexOf('alt="') > -1) {
            snippet += ' alt="' + m.match(/alt="([^"]*)"/)[1] + '"';
        }
        console.log(snippet);
    });
} else {
    console.log('No images');
}
