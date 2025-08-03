const mysql = require('mysql2/promise');

// Test database connection
async function testConnection() {
  // You can test both local and remote databases
  const configs = [
    {
      name: 'Local Database',
      config: {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'ncst_enrollment1',
        port: 3306
      }
    },
    {
      name: 'PlanetScale Database',
      config: {
        host: process.env.DB_HOST || 'your-planetscale-host',
        user: process.env.DB_USER || 'your-username',
        password: process.env.DB_PASSWORD || 'your-password',
        database: process.env.DB_NAME || 'your-database',
        port: process.env.DB_PORT || 3306,
        ssl: process.env.DB_HOST?.includes('psdb.cloud') ? {
          rejectUnauthorized: false
        } : false
      }
    }
  ];

  for (const { name, config } of configs) {
    console.log(`\n🔌 Testing ${name}...`);
    
    try {
      const connection = mysql.createPool(config);
      
      // Test basic connection
      const [rows] = await connection.execute('SELECT 1 as test');
      console.log(`✅ ${name} connection successful!`);
      
      // Test if tables exist
      const [tables] = await connection.execute('SHOW TABLES');
      console.log(`📋 Tables in ${name}:`, tables.map(t => Object.values(t)[0]));
      
      // Test data count
      for (const tableRow of tables) {
        const tableName = Object.values(tableRow)[0];
        const [count] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
        console.log(`   - ${tableName}: ${count[0].count} records`);
      }
      
      await connection.end();
    } catch (error) {
      console.error(`❌ ${name} connection failed:`, error.message);
    }
  }
}

// Instructions
console.log('🚀 Database Connection Test');
console.log('============================');
console.log('');
console.log('To test PlanetScale connection, set these environment variables:');
console.log('DB_HOST=your-planetscale-host');
console.log('DB_USER=your-planetscale-username');
console.log('DB_PASSWORD=your-planetscale-password');
console.log('DB_NAME=your-planetscale-database');
console.log('');
console.log('Example:');
console.log('DB_HOST=aws.connect.psdb.cloud DB_USER=abc123 DB_PASSWORD=xyz789 DB_NAME=enrollment-system node test-database.cjs');
console.log('');

testConnection(); 