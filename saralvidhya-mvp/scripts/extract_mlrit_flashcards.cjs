const fs = require('fs');
const path = require('path');

const levels = ['beginner', 'intermediate', 'advanced'];
const outDir = path.resolve(__dirname, '../public/generated_resources/mlrit/dbms/chapter_01/practice/flashcards/images');
fs.mkdirSync(outDir, { recursive: true });

// Also copy the Mindmap PNG if it exists
const mindmapSrc = path.resolve('d:/SV-Medha_ production_grade/MLRIT/DBMS/Resources/Mindmaps/NotebookLM Mind Map.png');
const mindmapDstDir = path.resolve(__dirname, '../public/generated_resources/mlrit/dbms/chapter_01/Resources/Mindmaps');
fs.mkdirSync(mindmapDstDir, { recursive: true });
if (fs.existsSync(mindmapSrc)) {
  fs.copyFileSync(mindmapSrc, path.join(mindmapDstDir, 'NotebookLM Mind Map.png'));
  console.log('Copied NotebookLM Mind Map.png to', mindmapDstDir);
}

// Also ensure chapter_01/Mindmaps directory has it
const mindmapDstDir2 = path.resolve(__dirname, '../public/generated_resources/mlrit/dbms/chapter_01/Mindmaps');
fs.mkdirSync(mindmapDstDir2, { recursive: true });
if (fs.existsSync(mindmapSrc)) {
  fs.copyFileSync(mindmapSrc, path.join(mindmapDstDir2, 'NotebookLM Mind Map.png'));
}

levels.forEach(lvl => {
  const p = path.resolve(`d:/SV-Medha_ production_grade/MLRIT/DBMS/Practice/Revise/DBMS_UNIT_I_Flashcards_${lvl}.md`);
  if (!fs.existsSync(p)) {
    console.log('File not found:', p);
    return;
  }
  const text = fs.readFileSync(p, 'utf8');
  const cardChunks = text.split(/(?=###\s*Q\d+)/g).filter(s => s.trim().startsWith('### Q'));
  console.log(`Level ${lvl}: found ${cardChunks.length} cards`);

  cardChunks.forEach((chunk, idx) => {
    const imgMatch = chunk.match(/<img[^>]+src=["'](data:image\/([^;]+);base64,([^"']+))["']/i);
    if (imgMatch) {
      const ext = imgMatch[2] === 'jpeg' ? 'jpg' : imgMatch[2];
      const base64Data = imgMatch[3];
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `card_${lvl}_${idx + 1}.${ext}`;
      const filePath = path.join(outDir, filename);
      fs.writeFileSync(filePath, buffer);
      console.log(`Saved ${filename} (${buffer.length} bytes)`);
    } else {
      console.log(`Level ${lvl} card ${idx + 1}: no image found`);
    }
  });
});
