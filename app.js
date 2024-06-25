
const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.APP_PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello, World1!');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});