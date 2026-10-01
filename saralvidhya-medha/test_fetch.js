const http = require('http');

http.get('http://127.0.0.1:8000/api/v1/assets/folders/ento_131/assessments?difficulty=Medium', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('127.0.0.1 Result:', res.statusCode, data));
}).on('error', err => console.log('127.0.0.1 Error:', err.message));

http.get('http://localhost:8000/api/v1/assets/folders/ento_131/assessments?difficulty=Medium', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('localhost Result:', res.statusCode, data));
}).on('error', err => console.log('localhost Error:', err.message));
