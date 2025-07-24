const { db } = require('../config/database');
const { resolveStudentIdStrict } = require('../utils/helpers');

// --- Student: Get available sections ---
const getAvailableSections = async (req, res) => {
  try {
    // Check if student has any accountabilities
    const studentNumericId = await resolveStudentIdStrict(req.student.id);
    // DEBUG: Always return all sections for student's year_level and course, regardless of accountabilities or section status
    let sections = [];
    [sections] = await db.query(
      `SELECT * FROM sections WHERE year_level = ? AND course_id = ?`,
      [req.student.year_level, req.student.course_id]
    );

    // For each section, get its schedules (subjects, room, day, time)
    const sectionIds = sections.map(s => s.id);
    let schedules = [];
    if (sectionIds.length > 0) {
      const [schedRows] = await db.query(
        `SELECT sc.section_id, sub.code as subject_code, sub.name as subject_name, sub.units, r.name as room_name, sc.day, sc.start_time, sc.end_time
         FROM schedules sc
         JOIN subjects sub ON sc.subject_id = sub.id
         LEFT JOIN rooms r ON sc.room_id = r.id
         WHERE sc.section_id IN (?)`,
        [sectionIds]
      );
      schedules = schedRows;
    }

    // Attach schedules to each section
    const sectionsWithSchedules = sections.map(section => {
      const scheds = schedules.filter(s => s.section_id === section.id);
      return {
        ...section,
        schedules: scheds
      };
    });

    res.json(sectionsWithSchedules);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// --- Student: Get current enrollment/registration form ---
const getCurrentEnrollment = async (req, res) => {
  try {
    // Get latest enrollment for this student
    const studentNumericId = await resolveStudentIdStrict(req.student.id);
    const [enrollments] = await db.query(
      `SELECT * FROM enrollments WHERE student_id = ? ORDER BY id DESC LIMIT 1`,
      [studentNumericId]
    );
    if (!enrollments.length || !['pending', 'approved'].includes(enrollments[0].status)) {
      return res.json({ enrollment: null, section: null, schedule: [] });
    }
    const enrollment = enrollments[0];
    // Get section info
    const [sectionRows] = await db.query(`SELECT * FROM sections WHERE id = ?`, [enrollment.section_id]);
    // Get schedule for this section
    const [scheduleRows] = await db.query(
      `SELECT sc.*, sub.code as subject_code, sub.name as subject_name, sub.units, r.name as room_name
       FROM schedules sc
       JOIN subjects sub ON sc.subject_id = sub.id
       LEFT JOIN rooms r ON sc.room_id = r.id
       WHERE sc.section_id = ?`,
      [enrollment.section_id]
    );
    res.json({
      enrollment, // now includes reference_number if present
      section: sectionRows[0],
      schedule: scheduleRows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// --- Student: Get accountabilities ---
const getAccountabilities = async (req, res) => {
  try {
    const studentNumericId = await resolveStudentIdStrict(req.student.id);
    const [rows] = await db.query(
      'SELECT * FROM accountabilities WHERE student_id = ?',
      [studentNumericId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error in getAccountabilities:', err);
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Student: Get grades ---
const getGrades = async (req, res) => {
  try {
    const studentNumericId = await resolveStudentIdStrict(req.student.id);
    const [rows] = await db.query(
      'SELECT * FROM grades WHERE student_id = ?',
      [studentNumericId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error in getGrades:', err);
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Student: Get notifications ---
const getNotifications = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE student_id = ? ORDER BY created_at DESC',
      [req.student.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// --- Student: Mark notification as read ---
const markNotificationAsRead = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND student_id = ?',
      [req.params.id, req.student.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

module.exports = {
  getAvailableSections,
  getCurrentEnrollment,
  getAccountabilities,
  getGrades,
  getNotifications,
  markNotificationAsRead
};
