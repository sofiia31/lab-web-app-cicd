const http = require('http');
const pool = require('./db');

const port = Number(process.env.APP_PORT || 80);

const server = http.createServer(async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello there, now is ' + result.rows[0].now);
  } catch (err) {
    console.error('Error connecting to database', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Error connecting to database');
  }
  console.log('invocation.')
});

server.listen(port, () => console.log(`Server running at *:${port}/`));