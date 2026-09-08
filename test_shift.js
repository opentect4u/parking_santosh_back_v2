const http = require('http');

const data = JSON.stringify({
  draw: 1,
  start: 0,
  length: 50,
  frm_dt: '2024-01-01T00:00',
  to_dt: '2024-12-31T23:59',
  custId: '2' // Assuming customer ID 2 is valid
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/report/get_shift_wise_repo_new',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', responseData);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
