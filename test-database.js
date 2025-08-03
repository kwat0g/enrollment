const mysql = require('mysql2/promise');

// Test database connection
async function testConnection() {
  const connection = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ncst_enrollment1',
    port: process.env.DB_PORT || 3306,
    ssl: process.env.DB_HOST?.includes('psdb.cloud') ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    console.log('🔌 Testing database connection...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Database connection successful!');
    console.log('Test query result:', rows);
    
    // Test if tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Available tables:', tables.map(t => Object.values(t)[0]));
    
    await connection.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection(); 