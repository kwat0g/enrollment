/*
  Node script to create freshman_enrollments table if it doesn't exist.
  Usage: node scripts/create_freshman_enrollments_table.js
*/
require('dotenv').config();
const { db } = require('../config/database');

async function main() {
  const sql = `
    CREATE TABLE IF NOT EXISTS freshman_enrollments (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      -- linkage
      student_id INT UNSIGNED NULL,
      course_id INT UNSIGNED NULL,

      -- step 1: personal
      first_name VARCHAR(100) NOT NULL,
      middle_name VARCHAR(100) NULL,
      last_name VARCHAR(100) NOT NULL,
      suffix VARCHAR(20) NULL,
      birthdate DATE NOT NULL,
      sex ENUM('Male','Female','Other') NOT NULL,
      civil_status VARCHAR(50) NOT NULL,
      nationality VARCHAR(100) NOT NULL,
      citizenship VARCHAR(100) NULL,
      place_of_birth VARCHAR(255) NOT NULL,
      religion VARCHAR(100) NOT NULL,

      -- step 2: contact and address
      email VARCHAR(150) NOT NULL,
      mobile VARCHAR(20) NOT NULL,
      region_code VARCHAR(10) NOT NULL,
      province_code VARCHAR(10) NULL,
      city_code VARCHAR(10) NOT NULL,
      barangay_code VARCHAR(15) NOT NULL,
      region VARCHAR(150) NULL,
      province VARCHAR(150) NULL,
      city VARCHAR(150) NULL,
      barangay VARCHAR(150) NULL,
      address_line VARCHAR(255) NOT NULL,
      zip VARCHAR(10) NOT NULL,

      -- step 3: parents/guardian
      father_name VARCHAR(150) NOT NULL,
      father_occupation VARCHAR(150) NOT NULL,
      father_contact VARCHAR(20) NOT NULL,
      mother_name VARCHAR(150) NOT NULL,
      mother_occupation VARCHAR(150) NOT NULL,
      mother_contact VARCHAR(20) NOT NULL,
      guardian_name VARCHAR(150) NOT NULL,
      guardian_relation VARCHAR(100) NOT NULL,
      guardian_contact VARCHAR(20) NOT NULL,

      -- step 4: academic/program
      shs_name VARCHAR(255) NULL,
      shs_track VARCHAR(255) NULL,
      preferred_sched VARCHAR(50) NULL,
      year_level VARCHAR(20) NOT NULL,
      admission_type ENUM('Freshman','Transferee') NOT NULL,

      -- consent and meta
      consent TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

      PRIMARY KEY (id),
      KEY idx_student_id (student_id),
      KEY idx_course_id (course_id),
      KEY idx_city_brg (city_code, barangay_code),
      CONSTRAINT fk_fe_student_id FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_fe_course_id FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await db.query(sql);
    console.log('✅ freshman_enrollments table is ready.');
  } catch (err) {
    console.error('❌ Failed to create table:', err.message);
    process.exitCode = 1;
  } finally {
    db.end && db.end();
  }
}

main();
