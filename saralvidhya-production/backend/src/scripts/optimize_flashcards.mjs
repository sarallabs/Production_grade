import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Extracts embedded base64 images from flashcard JSON into standalone GCS files
// so the JSON stays small (Cloud Run responses are capped at ~32 MB).
// SAFE: backs up every original before overwriting, and never drops an image
// it cannot extract (card is left untouched and reported).

const TMP_DIR = './scratch_flashcards';
const BACKUP_DIR = './scratch_flashcards_backup';
for (const d of [TMP_DIR, BACKUP_DIR]) fs.mkdirSync(d, { recursive: true });

const TARGETS = (process.argv[2] || 'chapter_03:beginner,chapter_04:beginner,chapter_04:intermediate,chapter_04:advanced')
  .split(',').map(s => s.split(':'));

const DATA_URI = /data:image\/([a-zA-Z0-9+]+);base64,([A-Za-z0-9+/=]+)/;

function optimize(chapter, persona) {
  const gcsJson = `gs://saralvidhya-artifacts/angrau/entomology/${chapter}/practice/flashcards/${persona}.json`;
  const local = path.join(TMP_DIR, `${chapter}_${persona}.json`);
  const backup = path.join(BACKUP_DIR, `${chapter}_${persona}.json`);

  execSync(`gcloud storage cp "${gcsJson}" "${local}" --quiet`);
  fs.copyFileSync(local, backup);

  const parsed = JSON.parse(fs.readFileSync(local, 'utf-8'));
  const cards = parsed.cards || parsed.flashcards || (Array.isArray(parsed) ? parsed : []);
  let extracted = 0, untouched = 0;

  cards.forEach((card, i) => {
    for (const field of ['img', 'infographicUrl']) {
      const val = card[field];
      if (typeof val !== 'string') continue;
      const m = val.match(DATA_URI);
      if (!m) continue;
      const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
      const id = (card.id || `card_${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      const name = `${id}_${persona}.${ext}`;
      const localImg = path.join(TMP_DIR, name);
      fs.writeFileSync(localImg, Buffer.from(m[2], 'base64'));
      execSync(`gcloud storage cp "${localImg}" "gs://saralvidhya-artifacts/angrau/entomology/${chapter}/practice/flashcards/images/${name}" --quiet`);
      card.infographicUrl = `/api/content/angrau/entomology/${chapter}/practice/flashcards/images/${name}`;
      delete card.img;
      extracted++;
      return;
    }
    if (card.img) untouched++;
  });

  console.log(`${chapter} ${persona}: extracted ${extracted}/${cards.length}, untouched-with-img ${untouched}`);
  if (extracted === 0 && cards.some(c => c.img)) {
    console.log('  -> nothing extracted but images exist; NOT uploading.');
    return;
  }
  fs.writeFileSync(local, JSON.stringify(parsed));
  execSync(`gcloud storage cp "${local}" "${gcsJson}" --quiet`);
  console.log(`  uploaded (${fs.statSync(local).size} bytes). Backup: ${backup}`);
}

for (const [ch, p] of TARGETS) {
  try { optimize(ch, p); } catch (e) { console.error(`FAILED ${ch} ${p}: ${e.message}`); }
}
