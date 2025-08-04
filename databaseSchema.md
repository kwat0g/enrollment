
-- Table structure for accountabilities
DROP TABLE IF EXISTS `accountabilities`;
CREATE TABLE `accountabilities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `description` varchar(200) NOT NULL,
  `status` varchar(20) NOT NULL,
  `amount` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `accountabilities_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for accountabilities
INSERT INTO `accountabilities` VALUES
(1, 1, 'Balance', 'Tuition', 'cleared', '6000.00');


-- Table structure for admins
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for admins
INSERT INTO `admins` VALUES
(1, 'admin', '$2b$10$0T8j9IhEJJ/wz64yulmWPutIZoDnUO7yOjS8FeU2gbh5HU7KNdOiu');


-- Table structure for courses
DROP TABLE IF EXISTS `courses`;
CREATE TABLE `courses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for courses
INSERT INTO `courses` VALUES
(1, 'BSIT', 'Bachelor of Science in Information Technology');


-- Table structure for enrollments
DROP TABLE IF EXISTS `enrollments`;
CREATE TABLE `enrollments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `school_year` varchar(20) NOT NULL,
  `semester` varchar(20) NOT NULL,
  `status` varchar(20) NOT NULL,
  `date_applied` datetime DEFAULT NULL,
  `reference_number` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `section_id` (`section_id`),
  CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for enrollments
INSERT INTO `enrollments` VALUES
(1, 1, 1, '2025-2026', '1st Semester', 'rejected', Fri Aug 01 2025 20:22:45 GMT+0800 (Taiwan Standard Time), NULL),
(2, 1, 1, '2025-2026', '1st Semester', 'rejected', Fri Aug 01 2025 20:25:11 GMT+0800 (Taiwan Standard Time), NULL),
(3, 1, 1, '2025-2026', '1st Semester', 'rejected', Fri Aug 01 2025 20:26:31 GMT+0800 (Taiwan Standard Time), NULL),
(4, 1, 1, '2025-2026', '1st Semester', 'approved', Fri Aug 01 2025 20:44:57 GMT+0800 (Taiwan Standard Time), 'ENR-20250801-4');


-- Table structure for grades
DROP TABLE IF EXISTS `grades`;
CREATE TABLE `grades` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `school_year` varchar(20) NOT NULL,
  `semester` varchar(20) NOT NULL,
  `grade` decimal(4,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `subject_id` (`subject_id`),
  CONSTRAINT `grades_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `grades_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- Table structure for notifications
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `message` varchar(255) NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for notifications
INSERT INTO `notifications` VALUES
(1, 1, 'Your enrollment request has been rejected by the administrator.', 'enrollment', Fri Aug 01 2025 20:23:35 GMT+0800 (Taiwan Standard Time), 1),
(2, 1, 'Your enrollment request has been rejected by the administrator.', 'enrollment', Fri Aug 01 2025 20:25:59 GMT+0800 (Taiwan Standard Time), 1),
(3, 1, 'Your enrollment request has been rejected by the administrator.', 'enrollment', Fri Aug 01 2025 20:29:43 GMT+0800 (Taiwan Standard Time), 1);


-- Table structure for rooms
DROP TABLE IF EXISTS `rooms`;
CREATE TABLE `rooms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `capacity` int(11) DEFAULT 0,
  `type` varchar(50) DEFAULT 'Lecture',
  `facilities` varchar(255) DEFAULT '',
  `status` varchar(20) DEFAULT 'active',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for rooms
INSERT INTO `rooms` VALUES
(3, '1108', 45, 'Lecture', 'Computer', 'active');


-- Table structure for schedules
DROP TABLE IF EXISTS `schedules`;
CREATE TABLE `schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `section_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `room_id` int(11) DEFAULT NULL,
  `day` varchar(20) DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `type` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `section_id` (`section_id`),
  KEY `subject_id` (`subject_id`),
  KEY `room_id` (`room_id`),
  CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`),
  CONSTRAINT `schedules_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`),
  CONSTRAINT `schedules_ibfk_3` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for schedules
INSERT INTO `schedules` VALUES
(47, 1, 3, 3, 'Tuesday', '14:00:00', '15:00:00', 'Lab'),
(50, 1, 2, 3, 'Saturday', '13:00:00', '14:00:00', 'Lec'),
(51, 1, 1, 3, 'Wednesday', '12:00:00', '17:00:00', 'Lab');

-- Add instructor column to schedules table
ALTER TABLE `schedules` ADD COLUMN `instructor` varchar(100) DEFAULT NULL AFTER `type`;

-- Remove instructor column from subjects table (optional - keeping it for backward compatibility)
-- ALTER TABLE `subjects` DROP COLUMN `instructor`;


-- Table structure for sections
DROP TABLE IF EXISTS `sections`;
CREATE TABLE `sections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `year_level` varchar(10) NOT NULL,
  `course_id` int(11) NOT NULL,
  `schedule_type` varchar(20) NOT NULL,
  `status` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `sections_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for sections
INSERT INTO `sections` VALUES
(0, 'Template', '', 1, '', 'template'),
(1, 'BSIT-31A2', '3rd', 1, 'afternoon', 'closed'),
(18, 'BSIT-41M2', '4th', 1, 'morning', 'closed');


-- Table structure for students
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` varchar(20) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `suffix` varchar(10) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `address` varchar(200) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `year_level` varchar(10) DEFAULT NULL,
  `course_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for students
INSERT INTO `students` VALUES
(1, '2025-00001', 'Bungubung', 'Ehdrian', 'Latras', '', 'Male', 'Blk 5 ', '09123456789', 'bungubung.ehdrian@ncst.edu.ph', '3rd', 1);


-- Table structure for subjects
DROP TABLE IF EXISTS `subjects`;
CREATE TABLE `subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `units` int(11) NOT NULL,
  `type` varchar(100) DEFAULT NULL,
  `course_id` int(11) NOT NULL,
  `year_level` varchar(10) NOT NULL,
  `instructor` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `subjects_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for subjects
INSERT INTO `subjects` VALUES
(1, 'IT301', 'INTEG', 2, 'Lab', 1, '3rd', 'Jarmaine Diegas'),
(2, 'IT301', 'INTEG', 1, 'Lec', 1, '3rd', 'Gnehm Ryien Rabe'),
(3, 'IT302', 'HCI', 2, 'Lab', 1, '3rd', 'EWAN');

