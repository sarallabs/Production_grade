const fs = require('fs');
const path = require('path');

const LEVELS = ['beginner', 'intermediate', 'advanced', 'revise'];
const BASE_DIR = path.resolve('public/generated_resources/mlrit/dbms/chapter_01/Practice/Revise');

LEVELS.forEach((lvl) => {
  const mdPath = path.join(BASE_DIR, `DBMS_UNIT_I_Flashcards_${lvl}.md`);
  const jsonPath = path.join(BASE_DIR, `DBMS_UNIT_I_Flashcards_${lvl}.json`);

  if (!fs.existsSync(mdPath) || !fs.existsSync(jsonPath)) {
    console.log(`Skipping ${lvl} (missing md or json)`);
    return;
  }

  const mdContent = fs.readFileSync(mdPath, 'utf8');
  let jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // Split markdown into questions by ### Q
  const sections = mdContent.split(/(?=###\s*Q\d*[:.]?)/i).filter((s) => /###\s*Q/i.test(s));
  console.log(`Level: ${lvl}, sections found in MD: ${sections.length}`);

  const images = [];
  sections.forEach((sec, idx) => {
    // Look for <img src="data:image/...;base64,...">
    const imgMatch = sec.match(/<img\s+src=["'](data:image\/[^;]+;base64,[\s\S]*?)["']/i);
    if (imgMatch) {
      const cleanDataUrl = imgMatch[1].replace(/[\r\n\s]+/g, '');
      images.push(cleanDataUrl);
    } else {
      images.push(null);
    }
  });

  const cards = jsonData.cards || jsonData.flashcards || jsonData;
  if (Array.isArray(cards)) {
    cards.forEach((card, idx) => {
      if (images[idx]) {
        card.image = images[idx];
        card.infographic = images[idx];
        card.infographicUrl = images[idx];
      } else {
        // Fallback to mindmap
        card.image = '/generated_resources/mlrit/dbms/chapter_01/Resources/Mindmaps/NotebookLM%20Mind%20Map.png';
        card.infographic = card.image;
        card.infographicUrl = card.image;
      }
    });

    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log(`Updated ${jsonPath} with ${cards.length} infographics!`);
  }
});
