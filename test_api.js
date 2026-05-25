import http from 'http';

console.log('Testing connection to http://localhost:3000/api/books ...');
const req = http.get('http://localhost:3000/api/books', (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Body length:', data.length);
    console.log('First 200 chars of body:', data.substring(0, 200));
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
  process.exit(1);
});

req.end();
