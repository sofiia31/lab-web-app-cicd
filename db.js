const { Pool } = require('pg');

const pool = new Pool({
  user: 'Sofia_IAM',
  host: 'ship-db.cnaeciq0o9w4.ap-northeast-1.rds.amazonaws.com',
  database: 'ship-db',
  password: 'Adm007Adm00',
  port: 5432,
});

module.exports = pool;