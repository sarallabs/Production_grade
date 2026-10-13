const GCS_API_BASE = 'https://saralvidhya-api-193782571555.asia-south1.run.app';
const GCS_SUBJECT_MAP = {
  'entomology': 'angrau/entomology',
  'angrau_entomology': 'angrau/entomology',
  'dbms': 'mlrit/dbms',
  'mlrit_dbms': 'mlrit/dbms',
};

async function testSubject(subject, chNum, level) {
  const subjectPath = GCS_SUBJECT_MAP[subject];
  const chDir = 'chapter_' + String(chNum).padStart(2, '0');
  const url = `${GCS_API_BASE}/api/content/${subjectPath}/${chDir}/practice/flashcards?persona=${level}`;
  const res = await fetch(url);
  const data = await res.json();
  const cards = Array.isArray(data) ? data : (data.flashcards || data.cards || []);
  
  const mapped = cards.map((c, index) => {
    let infoUrl = c.infographicUrl || c.infographic || c.image;
    if (!infoUrl && (subject === 'dbms' || subject.includes('dbms'))) {
      const normLvl = level === 'beginner' ? 'beginner' : level === 'advanced' ? 'advanced' : 'intermediate';
      infoUrl = `/generated_resources/mlrit/dbms/chapter_01/practice/flashcards/images/card_${normLvl}_${index + 1}.webp`;
    }
    if (infoUrl && !infoUrl.startsWith('http://') && !infoUrl.startsWith('https://') && !infoUrl.startsWith('data:')) {
      if (infoUrl.startsWith('/api/')) {
        infoUrl = `${GCS_API_BASE}${infoUrl}`;
      } else if (infoUrl.includes('generated_infographics')) {
        const cleanRel = infoUrl.replace(/^.*generated_infographics\//, 'generated_infographics/');
        infoUrl = `${GCS_API_BASE}/api/content/${subjectPath}/${chDir}/${cleanRel}`;
      } else if (infoUrl.startsWith('/generated_resources/')) {
        if (subjectPath.includes('angrau')) {
          const subRel = infoUrl.replace(/^\/generated_resources\/[^\/]+\//, '');
          infoUrl = `${GCS_API_BASE}/api/content/${subjectPath}/${subRel}`;
        }
      } else if (infoUrl.startsWith('/')) {
        infoUrl = `${GCS_API_BASE}${infoUrl}`;
      } else {
        infoUrl = `${GCS_API_BASE}/api/content/${subjectPath}/${chDir}/${infoUrl}`;
      }
    }
    return {
      front: (c.front || c.question || '').slice(0, 40) + '...',
      infoUrl,
      hasMermaid: !!(c.mermaid_diagram || c.mermaid),
    };
  });
  console.log(`=== ${subject} ch${chNum} ${level} (${mapped.length} cards) ===`);
  console.log('Sample card 0:', mapped[0]);
  if (mapped[0].infoUrl && mapped[0].infoUrl.startsWith('http')) {
    const head = await fetch(mapped[0].infoUrl, { method: 'HEAD' });
    console.log('Sample card 0 HEAD status:', head.status, head.headers.get('content-type'));
  }
}

async function run() {
  await testSubject('entomology', 1, 'intermediate');
  await testSubject('entomology', 2, 'intermediate');
  await testSubject('entomology', 3, 'intermediate');
  await testSubject('entomology', 4, 'intermediate');
  await testSubject('dbms', 1, 'intermediate');
}
run();
