const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Error code:', err.code);
    return;
  }
  console.log('✅ Database connected successfully!');
  
  // Test query
  connection.query('SELECT * FROM users LIMIT 1', (error, results) => {
    if (error) {
      console.error('❌ Query failed:', error.message);
    } else {
      console.log('✅ Query successful!');
      console.log('Users table exists and is accessible');
    }
    connection.end();
  });
});