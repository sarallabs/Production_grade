const fs = require('fs');
const path = require('path');

const dir = 'd:/saralvidhya/saralvidhya-moocs/public/generated_resources/Nagarjuna_University/MBA/Chapter_3/Learn/Flashcards';
const levels = ['beginner', 'intermediate', 'advanced'];

for (const level of levels) {
    const mdFile = path.join(dir, `flashcards_${level}.md`);
    const jsonFile = path.join(dir, `flashcards_${level}.json`);
    
    if (!fs.existsSync(mdFile) || !fs.existsSync(jsonFile)) continue;
    
    const mdContent = fs.readFileSync(mdFile, 'utf8');
    const jsonContent = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    
    const chunks = mdContent.split(/###\s*Q\d*/i);
    const imgMap = new Map();
    
    for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        const lines = chunk.trim().split('\n');
        const questionText = lines[0].trim().replace(/\*\*/g, '').toLowerCase();
        
        const imgMatch = chunk.match(/<img[^>]+src=["'](data:image\/[^;]+;base64,[^"']+)["']/i);
        if (imgMatch) {
            imgMap.set(questionText, imgMatch[1]);
        }
    }
    
    let updated = false;
    const cards = Array.isArray(jsonContent) ? jsonContent : (jsonContent.flashcards || jsonContent.cards);
    
    for (const card of cards) {
        const frontClean = card.front.replace(/\*\*/g, '').trim().toLowerCase();
        for (const [qText, b64] of imgMap.entries()) {
            if (frontClean.includes(qText) || qText.includes(frontClean)) {
                card.infographicUrl = b64;
                updated = true;
                break;
            }
        }
    }
    
    if (updated) {
        fs.writeFileSync(jsonFile, JSON.stringify(jsonContent, null, 2), 'utf8');
        console.log(`Updated ${level}.json with base64 images`);
    } else {
        console.log(`No matches found for ${level}`);
    }
}
