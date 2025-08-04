-- MANUAL DATABASE UPDATE FOR IRREGULAR ENROLLMENT
-- Run these commands in your MySQL database management tool (phpMyAdmin, MySQL Workbench, etc.)

USE ncst_enrollment1;

-- 1. Modify section_id to allow NULL for irregular enrollments
ALTER TABLE enrollments MODIFY COLUMN section_id INT NULL;

-- 2. Add enrollment_type column to existing enrollments table
ALTER TABLE enrollments ADD COLUMN enrollment_type ENUM('regular', 'irregular') DEFAULT 'regular' AFTER status;

-- 3. Create irregular_enrollments table to store individual subject selections
CREATE TABLE irregular_enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  enrollment_id INT NOT NULL,
  subject_id INT NOT NULL,
  schedule_id INT NOT NULL,
  section_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment_subject (enrollment_id, subject_id, schedule_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. Add indexes for better performance
CREATE INDEX idx_irregular_enrollment_id ON irregular_enrollments(enrollment_id);
CREATE INDEX idx_irregular_subject_id ON irregular_enrollments(subject_id);
CREATE INDEX idx_irregular_schedule_id ON irregular_enrollments(schedule_id);
CREATE INDEX idx_irregular_section_id ON irregular_enrollments(section_id);

-- Verification queries (optional - run these to check if everything was created correctly)
-- DESCRIBE enrollments;
-- DESCRIBE irregular_enrollments;
-- SHOW INDEXES FROM irregular_enrollments;
