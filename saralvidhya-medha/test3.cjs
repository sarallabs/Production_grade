const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function run() {
  const catalog = await fetchJson('http://localhost:8000/api/v1/assets/catalog.json');
  const manifest = await fetchJson('http://localhost:8000/api/v1/assets/manifest.json');
  const coursesJson = await fetchJson('http://localhost:8000/api/v1/assets/courses.json');
  
  const metas = coursesJson.courses || {};
  let courses = [];
  for (const board of catalog.boards) {
    for (const klass of board.classes) {
      for (const subject of klass.subjects) {
        const manifestSubject = manifest.subjects.find((s) => s.id === subject.id);
        const chapterCount = manifestSubject?.chapters?.length ?? subject.chapterNumbers?.length ?? 0;
        const meta = metas[subject.id];

        const defaultMeta = {
          subtitle: `Learn about ${subject.name}`,
          description: `A comprehensive course on ${subject.name}.`,
          discipline: 'General',
          level: 'intermediate',
          instructor: {
            name: 'Faculty Member',
            title: 'Instructor',
          },
          durationHours: chapterCount > 0 ? chapterCount * 4 : 30,
          credits: 3,
          language: 'English',
          accent: 'linear-gradient(135deg, #7c3aed, #ec4899)',
          tags: [],
          enrolled: 0,
          featured: false,
          ...meta,
        };

        courses.push({
          id: subject.id,
          name: subject.name,
          path: subject.path,
          boardId: board.id,
          boardName: board.name,
          boardShortName: board.shortName || board.name,
          classId: klass.id,
          className: klass.name,
          chapterCount,
          meta: defaultMeta,
        });
      }
    }
  }
  
  console.log(JSON.stringify(courses, null, 2));
}
run();
