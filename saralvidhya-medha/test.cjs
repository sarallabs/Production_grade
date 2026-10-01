const fs = require('fs');
const data = fs.readFileSync('d:/saralvidhya/saralvidhya-moocs/public/generated_resources/Entomology/chapter_02/intermediate/flashcards.json', 'utf8');
let cards = JSON.parse(data).flashcards;
const subject = 'Entomology';
if (cards?.length) {
  cards = cards.map((card) => {
    let back = card.back || '';
    let infographicUrl = card.infographicUrl;

    if (!infographicUrl) {
      const infoMatch = back.match(/<!-- INFOGRAPHIC_URL:(.*?) -->/);
      if (infoMatch) {
        infographicUrl = infoMatch[1];
        back = back.replace(infoMatch[0], '').trim();
      } else {
        const imgMatch = back.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
        if (imgMatch) {
          infographicUrl = imgMatch[1];
          const wrapperRegex = /<div[^>]*>\s*<img[^>]+src=["'][^"']+["'][^>]*>[\s\S]*?<\/div>/i;
          const wrapperMatch = back.match(wrapperRegex);
          if (wrapperMatch && wrapperMatch[0].includes(imgMatch[0])) {
            back = back.replace(wrapperMatch[0], '').trim();
          } else {
            back = back.replace(imgMatch[0], '').trim();
          }
        }
      }
    }

    const isPhysics = subject === 'anu_physics' || subject.includes('physics');
    if (isPhysics) {
      const lower = (infographicUrl || '').toLowerCase();
      if (!infographicUrl || lower.includes('placeholder') || lower.includes('generated_infographics') || lower.includes('infographic_card') || lower.includes('dummy')) {
        const PHYSICS_REAL_INFOGRAPHICS = [];
        const cardIdx = cards.indexOf(card);
        infographicUrl = PHYSICS_REAL_INFOGRAPHICS[(cardIdx >= 0 ? cardIdx : 0) % PHYSICS_REAL_INFOGRAPHICS.length];
      }
    }

    return { ...card, back, infographicUrl };
  });
}
console.log('Success!', cards.length);
