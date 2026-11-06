const http = require('http');

function fetchJson(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
  });
}

async function run() {
  const catalog = await fetchJson('http://localhost:8000/api/v1/assets/catalog.json');
  const manifest = await fetchJson('http://localhost:8000/api/v1/assets/manifest.json');
  
  let courses = [];
  for (const board of catalog.boards) {
    for (const klass of board.classes) {
      for (const subject of klass.subjects) {
        const manifestSubject = manifest.subjects.find((s) => s.id === subject.id);
        const chapterCount = manifestSubject?.chapters.length ?? subject.chapterNumbers?.length ?? 0;
        courses.push({ id: subject.id, chapterCount });
      }
    }
  }
  console.log('Courses generated:');
  console.log(courses);
}
run();
