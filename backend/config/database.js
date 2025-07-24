const mysql = require('mysql2/promise');

// MySQL config
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // set your MySQL password
  database: 'ncst_enrollment1', // set your database name
});

module.exports = { db };
