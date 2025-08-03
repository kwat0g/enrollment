const mysql = require('mysql2/promise');
const fs = require('fs');

async function exportDatabase() {
  const connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ncst_enrollment1'
  });

  try {
    console.log('📤 Exporting database...');
    
    // Get all tables
    const [tables] = await connection.execute('SHOW TABLES');
    let exportSQL = '';
    
    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      console.log(`📋 Exporting table: ${tableName}`);
      
      // Get table structure
      const [createTable] = await connection.execute(`SHOW CREATE TABLE \`${tableName}\``);
      exportSQL += `\n-- Table structure for ${tableName}\n`;
      exportSQL += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      exportSQL += createTable[0]['Create Table'] + ';\n\n';
      
      // Get table data
      const [rows] = await connection.execute(`SELECT * FROM \`${tableName}\``);
      if (rows.length > 0) {
        exportSQL += `-- Data for ${tableName}\n`;
        exportSQL += `INSERT INTO \`${tableName}\` VALUES\n`;
        
        const values = rows.map(row => {
          const rowValues = Object.values(row).map(value => {
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            return value;
          });
          return `(${rowValues.join(', ')})`;
        });
        
        exportSQL += values.join(',\n') + ';\n\n';
      }
    }
    
    // Write to file
    fs.writeFileSync('database_backup.sql', exportSQL);
    console.log('✅ Database exported to database_backup.sql');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

exportDatabase(); 