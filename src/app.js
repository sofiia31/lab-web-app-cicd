const http = require('http');

const port = Number(process.env.APP_PORT || 80);

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello there, now is ' + new Date().toISOString());
  console.log('invocation.')
});

server.listen(port, () => console.log(`Server running at *:${port}/`));
