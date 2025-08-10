-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 10, 2025 at 09:31 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ncst_enrollment1`
--

-- --------------------------------------------------------

--
-- Table structure for table `accountabilities`
--

CREATE TABLE `accountabilities` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `description` varchar(200) NOT NULL,
  `status` varchar(20) NOT NULL,
  `amount` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `accountabilities`
--

INSERT INTO `accountabilities` (`id`, `student_id`, `type`, `description`, `status`, `amount`) VALUES
(1, 1, 'Balance', 'Tuition', 'cleared', 6000.00);

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `password`) VALUES
(1, 'admin', '$2b$10$0T8j9IhEJJ/wz64yulmWPutIZoDnUO7yOjS8FeU2gbh5HU7KNdOiu');

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`id`, `code`, `name`) VALUES
(1, 'BSIT', 'Bachelor of Science in Information Technology');

-- --------------------------------------------------------

--
-- Table structure for table `enrollments`
--

CREATE TABLE `enrollments` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `section_id` int(11) DEFAULT NULL,
  `school_year` varchar(20) NOT NULL,
  `semester` varchar(20) NOT NULL,
  `status` varchar(20) NOT NULL,
  `enrollment_type` enum('regular','irregular') DEFAULT 'regular',
  `date_applied` datetime DEFAULT NULL,
  `reference_number` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `enrollments`
--

INSERT INTO `enrollments` (`id`, `student_id`, `section_id`, `school_year`, `semester`, `status`, `enrollment_type`, `date_applied`, `reference_number`) VALUES
(15, 1, 9, '2025-2026', '1st Semester', 'rejected', 'irregular', '2025-08-04 22:37:59', NULL),
(16, 1, 8, '2025-2026', '1st Semester', 'rejected', 'irregular', '2025-08-04 22:41:01', NULL),
(17, 1, 8, '2025-2026', '1st Semester', 'rejected', 'irregular', '2025-08-04 22:45:06', NULL),
(18, 1, 8, '2025-2026', '1st Semester', 'rejected', 'irregular', '2025-08-04 22:49:44', NULL),
(19, 1, 9, '2025-2026', '1st Semester', 'pending', 'irregular', '2025-08-10 13:21:11', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `freshman_enrollments`
--

CREATE TABLE `freshman_enrollments` (
  `id` int(11) NOT NULL,
  `student_id` varchar(11) DEFAULT NULL,
  `course_id` int(11) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `suffix` varchar(20) DEFAULT NULL,
  `birthdate` date NOT NULL,
  `sex` enum('Male','Female','Other') NOT NULL,
  `civil_status` varchar(50) NOT NULL,
  `nationality` varchar(100) NOT NULL,
  `citizenship` varchar(100) DEFAULT NULL,
  `place_of_birth` varchar(255) NOT NULL,
  `religion` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `mobile` varchar(20) NOT NULL,
  `region_code` varchar(10) NOT NULL,
  `province_code` varchar(10) DEFAULT NULL,
  `city_code` varchar(10) NOT NULL,
  `barangay_code` varchar(15) NOT NULL,
  `region` varchar(150) DEFAULT NULL,
  `province` varchar(150) DEFAULT NULL,
  `city` varchar(150) DEFAULT NULL,
  `barangay` varchar(150) DEFAULT NULL,
  `address_line` varchar(255) NOT NULL,
  `zip` varchar(10) NOT NULL,
  `father_name` varchar(150) NOT NULL,
  `father_occupation` varchar(150) NOT NULL,
  `father_contact` varchar(20) NOT NULL,
  `mother_name` varchar(150) NOT NULL,
  `mother_occupation` varchar(150) NOT NULL,
  `mother_contact` varchar(20) NOT NULL,
  `guardian_name` varchar(150) NOT NULL,
  `guardian_relation` varchar(100) NOT NULL,
  `guardian_contact` varchar(20) NOT NULL,
  `shs_name` varchar(255) DEFAULT NULL,
  `shs_track` varchar(255) DEFAULT NULL,
  `preferred_sched` varchar(50) DEFAULT NULL,
  `year_level` varchar(20) NOT NULL,
  `admission_type` enum('Freshman','Transferee') NOT NULL,
  `consent` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `status` enum('pending','approved','accepted','rejected') NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `freshman_enrollments`
--

INSERT INTO `freshman_enrollments` (`id`, `student_id`, `course_id`, `first_name`, `middle_name`, `last_name`, `suffix`, `birthdate`, `sex`, `civil_status`, `nationality`, `citizenship`, `place_of_birth`, `religion`, `email`, `mobile`, `region_code`, `province_code`, `city_code`, `barangay_code`, `region`, `province`, `city`, `barangay`, `address_line`, `zip`, `father_name`, `father_occupation`, `father_contact`, `mother_name`, `mother_occupation`, `mother_contact`, `guardian_name`, `guardian_relation`, `guardian_contact`, `shs_name`, `shs_track`, `preferred_sched`, `year_level`, `admission_type`, `consent`, `created_at`, `updated_at`, `status`) VALUES
(1, '2025-00001', 1, 'Jarmaine', 'Pedwino', 'Diegas', '', '2004-01-10', 'Male', 'Single', 'Filipino', 'Filipino', 'Manila', 'Roman Catholic', 'diegas.jarmaine@gmail.com', '09123131231', '040000000', '042100000', '042103000', '042103034', 'CALABARZON', 'Cavite', 'City of Bacoor', 'Habay II', 'Habay', '4102', 'Tatay Diegas', 'Ewan', '09123131231', 'Nanay Diegas', 'Ewan', '09123131231', 'Ate Diegas', 'Sibling', '09123131231', 'Habay', 'TVL', 'Morning', '3rd Year', 'Transferee', 1, '2025-08-10 16:36:29', '2025-08-10 19:27:40', 'accepted');

-- --------------------------------------------------------

--
-- Table structure for table `grades`
--

CREATE TABLE `grades` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `school_year` varchar(20) NOT NULL,
  `semester` varchar(20) NOT NULL,
  `grade` decimal(4,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `irregular_enrollments`
--

CREATE TABLE `irregular_enrollments` (
  `id` int(11) NOT NULL,
  `enrollment_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `schedule_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `irregular_enrollments`
--

INSERT INTO `irregular_enrollments` (`id`, `enrollment_id`, `subject_id`, `schedule_id`, `section_id`, `created_at`) VALUES
(79, 15, 1, 49, 8, '2025-08-04 14:40:09'),
(80, 15, 2, 50, 8, '2025-08-04 14:40:09'),
(81, 15, 3, 42, 9, '2025-08-04 14:40:09'),
(82, 15, 4, 44, 9, '2025-08-04 14:40:09'),
(83, 15, 5, 53, 8, '2025-08-04 14:40:09'),
(84, 15, 6, 54, 8, '2025-08-04 14:40:09'),
(85, 15, 7, 48, 9, '2025-08-04 14:40:09'),
(86, 15, 8, 47, 9, '2025-08-04 14:40:09'),
(87, 16, 1, 49, 8, '2025-08-04 14:41:01'),
(88, 16, 2, 50, 8, '2025-08-04 14:41:01'),
(89, 16, 3, 51, 8, '2025-08-04 14:41:01'),
(90, 16, 4, 52, 8, '2025-08-04 14:41:01'),
(91, 16, 5, 45, 9, '2025-08-04 14:41:01'),
(92, 16, 6, 46, 9, '2025-08-04 14:41:01'),
(93, 16, 7, 48, 9, '2025-08-04 14:41:01'),
(94, 16, 8, 47, 9, '2025-08-04 14:41:01'),
(111, 17, 1, 49, 8, '2025-08-04 14:46:31'),
(112, 17, 2, 50, 8, '2025-08-04 14:46:31'),
(113, 17, 3, 51, 8, '2025-08-04 14:46:31'),
(114, 17, 4, 52, 8, '2025-08-04 14:46:31'),
(115, 17, 5, 45, 9, '2025-08-04 14:46:31'),
(116, 17, 6, 46, 9, '2025-08-04 14:46:31'),
(117, 17, 7, 55, 8, '2025-08-04 14:46:31'),
(118, 17, 8, 56, 8, '2025-08-04 14:46:31'),
(127, 18, 1, 49, 8, '2025-08-10 05:04:10'),
(128, 18, 2, 50, 8, '2025-08-10 05:04:10'),
(129, 18, 3, 42, 9, '2025-08-10 05:04:10'),
(130, 18, 4, 44, 9, '2025-08-10 05:04:10'),
(131, 18, 5, 53, 8, '2025-08-10 05:04:10'),
(132, 18, 6, 54, 8, '2025-08-10 05:04:10'),
(133, 18, 7, 48, 9, '2025-08-10 05:04:10'),
(134, 18, 8, 47, 9, '2025-08-10 05:04:10'),
(135, 19, 1, 41, 9, '2025-08-10 05:21:11'),
(136, 19, 2, 43, 9, '2025-08-10 05:21:11'),
(137, 19, 3, 51, 8, '2025-08-10 05:21:11'),
(138, 19, 4, 52, 8, '2025-08-10 05:21:11');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `message` varchar(255) NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `student_id`, `message`, `type`, `created_at`, `is_read`) VALUES
(1, 1, 'Your enrollment request has been rejected by the administrator.', 'enrollment', '2025-08-04 18:20:23', 1),
(2, 1, 'Your enrollment request has been rejected by the administrator.', 'enrollment', '2025-08-04 20:17:15', 1),
(3, 1, 'Your enrollment request has been rejected by the administrator.', 'enrollment', '2025-08-04 20:17:18', 1),
(4, 1, 'Your enrollment request has been rejected by the administrator.', 'enrollment', '2025-08-04 20:17:46', 1),
(5, 1, 'Your enrollment request has been rejected by the administrator.', 'enrollment', '2025-08-04 20:17:47', 1),
(6, 1, 'Your enrollment request has been rejected by the administrator.', 'enrollment', '2025-08-04 20:17:49', 1),
(7, 1, 'Your enrollment request has been rejected by the administrator.', 'enrollment', '2025-08-04 20:18:15', 1),
(8, 1, 'Your enrollment request has been rejected by the administrator.', 'enrollment', '2025-08-04 20:33:26', 1),
(9, 1, 'Your enrollment request has been rejected by the administrator.', 'enrollment', '2025-08-04 20:35:10', 1),
(10, 1, 'Your enrollment request has been rejected by the administrator.', 'enrollment', '2025-08-04 20:37:09', 1),
(11, 1, 'Your enrollment request has been rejected by the administrator.', 'enrollment', '2025-08-04 20:55:45', 1),
(12, 1, 'Your enrollment request has been rejected by the administrator.', 'enrollment', '2025-08-04 22:40:38', 1),
(13, 1, 'Your enrollment request has been rejected by the administrator.', 'enrollment', '2025-08-04 22:44:58', 1),
(14, 1, 'Your enrollment request has been rejected by the administrator.', 'enrollment', '2025-08-04 22:49:33', 1),
(15, 1, 'Your enrollment request has been rejected by the administrator.', 'enrollment', '2025-08-10 13:17:47', 1);

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `capacity` int(11) DEFAULT 0,
  `type` varchar(50) DEFAULT 'Lecture',
  `facilities` varchar(255) DEFAULT '',
  `status` varchar(20) DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `name`, `capacity`, `type`, `facilities`, `status`) VALUES
(3, '1108', 50, 'Lecture', 'Computer', 'active');

-- --------------------------------------------------------

--
-- Table structure for table `schedules`
--

CREATE TABLE `schedules` (
  `id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `room_id` int(11) DEFAULT NULL,
  `day` varchar(20) DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `type` varchar(10) DEFAULT NULL,
  `instructor` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `schedules`
--

INSERT INTO `schedules` (`id`, `section_id`, `subject_id`, `room_id`, `day`, `start_time`, `end_time`, `type`, `instructor`) VALUES
(41, 9, 1, 3, 'Monday', '07:00:00', '08:00:00', 'Lab', 'M1'),
(42, 9, 3, 3, 'Monday', '08:00:00', '09:00:00', 'Lab', 'M2'),
(43, 9, 2, 3, 'Tuesday', '07:00:00', '08:00:00', 'Lec', 'M3'),
(44, 9, 4, 3, 'Tuesday', '08:00:00', '09:00:00', 'Lec', 'M4'),
(45, 9, 5, 3, 'Monday', '09:00:00', '10:00:00', 'Lab', 'M5'),
(46, 9, 6, 3, 'Tuesday', '09:00:00', '10:00:00', 'Lec', 'M6'),
(47, 9, 8, 3, 'Monday', '10:00:00', '11:00:00', 'Lec', 'M7'),
(48, 9, 7, 3, 'Tuesday', '10:00:00', '11:00:00', 'Lab', 'M8'),
(49, 8, 1, 3, 'Monday', '14:00:00', '15:00:00', 'Lab', '1'),
(50, 8, 2, 3, 'Tuesday', '14:00:00', '15:00:00', 'Lec', '2'),
(51, 8, 3, 3, 'Monday', '15:00:00', '16:00:00', 'Lab', '3'),
(52, 8, 4, 3, 'Tuesday', '15:00:00', '16:00:00', 'Lec', '4'),
(53, 8, 5, 3, 'Monday', '16:00:00', '17:00:00', 'Lab', '5'),
(54, 8, 6, 3, 'Tuesday', '16:00:00', '17:00:00', 'Lec', '6'),
(55, 8, 7, 3, 'Monday', '17:00:00', '18:00:00', 'Lab', '7'),
(56, 8, 8, 3, 'Monday', '18:00:00', '19:00:00', 'Lec', '8');

-- --------------------------------------------------------

--
-- Table structure for table `sections`
--

CREATE TABLE `sections` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `year_level` varchar(10) NOT NULL,
  `course_id` int(11) NOT NULL,
  `schedule_type` varchar(20) NOT NULL,
  `status` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sections`
--

INSERT INTO `sections` (`id`, `name`, `year_level`, `course_id`, `schedule_type`, `status`) VALUES
(0, 'Template', '', 1, '', 'template'),
(8, 'BSIT-31A2', '3rd', 1, 'afternoon', 'closed'),
(9, 'BSIT-31M1', '3rd', 1, 'morning', 'closed');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
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
  `course_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `student_id`, `last_name`, `first_name`, `middle_name`, `suffix`, `gender`, `address`, `contact_number`, `email`, `year_level`, `course_id`) VALUES
(1, '2025-00001', 'Bungubung', 'Ehdrian', 'Latras', '', 'Male', 'Blk 5 Lot 10', '09123456789', 'bungubung.ehdrian@ncst.edu.ph', '3rd', 1);

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `units` int(11) NOT NULL,
  `type` varchar(100) DEFAULT NULL,
  `course_id` int(11) NOT NULL,
  `year_level` varchar(10) NOT NULL,
  `instructor` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`id`, `code`, `name`, `units`, `type`, `course_id`, `year_level`, `instructor`) VALUES
(1, 'IT301', 'INTEG', 2, 'Lab', 1, '3rd', 'Jarmaine Diegas'),
(2, 'IT301', 'INTEG', 1, 'Lec', 1, '3rd', 'EWAN'),
(3, 'IT302', 'HCI', 2, 'Lab', 1, '3rd', ''),
(4, 'IT302', 'HCI', 1, 'Lec', 1, '3rd', ''),
(5, 'IT303', 'NETWORKING 2', 2, 'Lab', 1, '3rd', NULL),
(6, 'IT303', 'NETWORKING 2', 1, 'Lec', 1, '3rd', NULL),
(7, 'IT304', 'SIA', 2, 'Lab', 1, '3rd', NULL),
(8, 'IT304', 'SIA', 1, 'Lec', 1, '3rd', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accountabilities`
--
ALTER TABLE `accountabilities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `section_id` (`section_id`);

--
-- Indexes for table `freshman_enrollments`
--
ALTER TABLE `freshman_enrollments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_course_id` (`course_id`),
  ADD KEY `idx_city_brg` (`city_code`,`barangay_code`);

--
-- Indexes for table `grades`
--
ALTER TABLE `grades`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `subject_id` (`subject_id`);

--
-- Indexes for table `irregular_enrollments`
--
ALTER TABLE `irregular_enrollments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_enrollment_subject` (`enrollment_id`,`subject_id`,`schedule_id`),
  ADD KEY `idx_irregular_enrollment_id` (`enrollment_id`),
  ADD KEY `idx_irregular_subject_id` (`subject_id`),
  ADD KEY `idx_irregular_schedule_id` (`schedule_id`),
  ADD KEY `idx_irregular_section_id` (`section_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `schedules`
--
ALTER TABLE `schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `section_id` (`section_id`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `sections`
--
ALTER TABLE `sections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_id` (`student_id`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_id` (`course_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accountabilities`
--
ALTER TABLE `accountabilities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `enrollments`
--
ALTER TABLE `enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `freshman_enrollments`
--
ALTER TABLE `freshman_enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `grades`
--
ALTER TABLE `grades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `irregular_enrollments`
--
ALTER TABLE `irregular_enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=139;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `schedules`
--
ALTER TABLE `schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `sections`
--
ALTER TABLE `sections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `accountabilities`
--
ALTER TABLE `accountabilities`
  ADD CONSTRAINT `accountabilities_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`);

--
-- Constraints for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  ADD CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`);

--
-- Constraints for table `freshman_enrollments`
--
ALTER TABLE `freshman_enrollments`
  ADD CONSTRAINT `fk_fe_course_id` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `grades`
--
ALTER TABLE `grades`
  ADD CONSTRAINT `grades_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  ADD CONSTRAINT `grades_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`);

--
-- Constraints for table `irregular_enrollments`
--
ALTER TABLE `irregular_enrollments`
  ADD CONSTRAINT `irregular_enrollments_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `irregular_enrollments_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `irregular_enrollments_ibfk_3` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `irregular_enrollments_ibfk_4` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`);

--
-- Constraints for table `schedules`
--
ALTER TABLE `schedules`
  ADD CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`),
  ADD CONSTRAINT `schedules_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`),
  ADD CONSTRAINT `schedules_ibfk_3` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`);

--
-- Constraints for table `sections`
--
ALTER TABLE `sections`
  ADD CONSTRAINT `sections_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`);

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`);

--
-- Constraints for table `subjects`
--
ALTER TABLE `subjects`
  ADD CONSTRAINT `subjects_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
