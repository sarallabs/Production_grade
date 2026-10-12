import { execSync } from 'child_process';
import bcrypt from 'bcryptjs';

const PROJECT_ID = 'saralvidhya-production';
const BASE_FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function getGcloudToken() {
  return execSync('gcloud auth print-access-token --quiet', { encoding: 'utf-8' }).trim();
}

async function writeDoc(path, fields, token) {
  const url = `${BASE_FIRESTORE_URL}/${path}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to write ${path}: HTTP ${res.status} - ${txt}`);
  }
  return await res.json();
}

// Convert JavaScript objects to Firestore REST format
function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}

async function main() {
  console.log('[Firestore ANGRAU Register] Acquiring gcloud access token...');
  const token = getGcloudToken();

  const passwordHash = await bcrypt.hash('NGRanga@2026', 10);

  // 1. Tenant doc
  console.log('Writing tenants/angrau...');
  await writeDoc(
    'tenants/angrau',
    toFirestoreFields({
      name: 'Acharya N.G. Ranga Agricultural University',
      shortName: 'ANGRAU',
      status: 'active',
      domains: [],
      branding: {
        appName: 'ANGRAU Medha',
        primaryColor: '#059669',
        programLabel: 'B.Sc. (Hons.) Agriculture',
      },
      features: {
        examinerConsole: true,
        expertPanel: true,
        pyq: true,
        ask: true,
        toolOrder: [
          'read.quick',
          'read.detailed',
          'learn.mindmap',
          'practice.mcq',
          'practice.msq',
          'podcasts',
          'prepare.pre_final_exam',
        ],
      },
      hierarchy: ['program', 'subject'],
      storage: {
        bucket: 'saralvidhya-artifacts',
        prefix: 'angrau/entomology',
      },
      auth: {
        passwordHash,
        sessionVersion: 1,
        updatedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    token
  );

  // 2. Program Node
  console.log('Writing tenants/angrau/nodes/bsc_agri...');
  await writeDoc(
    'tenants/angrau/nodes/bsc_agri',
    toFirestoreFields({
      type: 'program',
      name: 'B.Sc. (Hons.) Agriculture',
      order: 1,
    }),
    token
  );

  // 3. Subject: Fundamentals of Entomology
  console.log('Writing tenants/angrau/subjects/ento_131...');
  await writeDoc(
    'tenants/angrau/subjects/ento_131',
    toFirestoreFields({
      parentNodeId: 'bsc_agri',
      name: 'Fundamentals of Entomology',
      code: 'ENTO 131',
      order: 1,
      status: 'active',
      chaptersCount: 4,
      faculty: {
        name: 'Department of Entomology',
        title: 'ANGRAU Faculty',
      },
      units: [
        'Insect Morphology and Anatomy',
        'Insect Physiology',
        'Insect Ecology',
        'Insect Classification',
      ],
    }),
    token
  );

  // 4. Chapters 1 to 4
  const chapters = [
    {
      id: 'chapter_01',
      number: 1,
      title: 'Insect Digestive System',
      topics: [
        { id: 'topic_1', label: 'Three Primary Gut Regions', order: 1, topicNum: 1 },
        { id: 'topic_2', label: 'Salivary Glands & Specialised Secretions', order: 2, topicNum: 2 },
        { id: 'topic_3', label: 'Specialized Physiological Adaptations', order: 3, topicNum: 3 },
        { id: 'topic_4', label: 'Excretory Integration & Gut Renewal', order: 4, topicNum: 4 },
      ],
      tools: {
        'read.quick': { personas: ['beginner', 'intermediate', 'advanced'] },
        'read.detailed': { personas: ['beginner', 'intermediate', 'advanced'] },
        'learn.mindmap': { interactive: true },
        'practice.mcq': { difficulties: ['easy', 'medium', 'hard'] },
        'practice.msq': { difficulties: ['easy', 'medium', 'hard'] },
        'podcasts': { tracks: 4 },
        'prepare.pre_final_exam': { available: true },
      },
    },
    {
      id: 'chapter_02',
      number: 2,
      title: 'Metamorphosis & Diapause',
      topics: [
        { id: 'topic_1', label: 'Morphogenesis Framework', order: 1, topicNum: 1 },
        { id: 'topic_2', label: 'Types of Metamorphosis', order: 2, topicNum: 2 },
        { id: 'topic_3', label: 'Immature & Pupal Classifications', order: 3, topicNum: 3 },
        { id: 'topic_4', label: 'Hypermetamorphosis', order: 4, topicNum: 4 },
        { id: 'topic_5', label: 'Endocrine Regulation', order: 5, topicNum: 5 },
        { id: 'topic_6', label: 'Diapause & Dormancy', order: 6, topicNum: 6 },
      ],
      tools: {
        'read.quick': { personas: ['beginner', 'intermediate', 'advanced'] },
        'read.detailed': { personas: ['beginner', 'intermediate', 'advanced'] },
        'learn.mindmap': { interactive: true },
        'practice.mcq': { difficulties: ['easy', 'medium', 'hard'] },
        'practice.msq': { difficulties: ['easy', 'medium', 'hard'] },
        'podcasts': { tracks: 6 },
        'prepare.pre_final_exam': { available: true },
      },
    },
    {
      id: 'chapter_03',
      number: 3,
      title: 'Weathering of Rocks and Minerals',
      topics: [
        { id: 'topic_1', label: 'Fundamentals & Regolith Genesis', order: 1, topicNum: 1 },
        { id: 'topic_2', label: 'Physical Weathering (Mechanical Agents)', order: 2, topicNum: 2 },
        { id: 'topic_3', label: 'Biological Weathering (Living Agents)', order: 3, topicNum: 3 },
        { id: 'topic_4', label: 'Synthesis & Quantitative Summary', order: 4, topicNum: 4 },
      ],
      tools: {
        'read.quick': { personas: ['beginner', 'intermediate', 'advanced'] },
        'read.detailed': { personas: ['beginner', 'intermediate', 'advanced'] },
        'learn.mindmap': { interactive: true },
        'practice.mcq': { difficulties: ['easy', 'medium', 'hard'] },
        'podcasts': { tracks: 4 },
        'prepare.pre_final_exam': { available: true },
      },
    },
    {
      id: 'chapter_04',
      number: 4,
      title: 'Pollination, Pollinizers & Parthenocarpy',
      topics: [
        { id: 'topic_1', label: 'Fundamentals of Floral Biology & Pollination Anatomy', order: 1, topicNum: 1 },
        { id: 'topic_2', label: 'Self-Pollination (Autogamy) & Inbreeding Mechanisms', order: 2, topicNum: 2 },
        { id: 'topic_3', label: 'Cross-Pollination (Allogamy / Xenogamy) & Outcrossing', order: 3, topicNum: 3 },
        { id: 'topic_4', label: 'Pollinators & Pollination Vectors (Abiotic & Biotic)', order: 4, topicNum: 4 },
        { id: 'topic_5', label: 'Pollinizers & Orchard Layout Management', order: 5, topicNum: 5 },
        { id: 'topic_6', label: 'Parthenocarpy (Seedless Fruit Development)', order: 6, topicNum: 6 },
      ],
      tools: {
        'read.quick': { personas: ['beginner', 'intermediate', 'advanced'] },
        'read.detailed': { personas: ['beginner', 'intermediate', 'advanced'] },
        'learn.mindmap': { interactive: true },
        'practice.mcq': { difficulties: ['easy', 'medium', 'hard'] },
        'podcasts': { tracks: 6 },
        'prepare.pre_final_exam': { available: true },
      },
    },
  ];

  for (const ch of chapters) {
    const chPath = `tenants/angrau/subjects/ento_131/chapters/${ch.id}`;
    console.log(`Writing ${chPath}...`);
    await writeDoc(
      chPath,
      toFirestoreFields({
        number: ch.number,
        title: ch.title,
        status: 'published',
        currentVersion: 1,
        topics: ch.topics,
        tools: ch.tools,
        updatedAt: new Date().toISOString(),
      }),
      token
    );

    // Write versions/1 with in-place canonical files map
    const verPath = `${chPath}/versions/1`;
    console.log(`Writing ${verPath}...`);
    const files = {
      'read/quick/beginner.md': { path: `${ch.id}/beginner/summary.md` },
      'read/quick/intermediate.md': { path: `${ch.id}/intermediate/summary.md` },
      'read/quick/advanced.md': { path: `${ch.id}/advanced/summary.md` },
      'learn/study_plan.md': { path: `${ch.id}/Learn/study_plan.md` },
      'prepare/pre_final_exam.json': { path: `${ch.id}/Prepare/pre_final_exam.json` },
    };

    await writeDoc(
      verPath,
      toFirestoreFields({
        version: 1,
        files,
        registeredAt: new Date().toISOString(),
        registeredBy: 'sv-admin-init',
      }),
      token
    );
  }

  console.log('\n[SUCCESS] ANGRAU registered in Firestore registry with 4 chapters and bcrypt auth hash!');
}

main().catch((err) => {
  console.error('\n[ERROR]', err);
  process.exit(1);
});
