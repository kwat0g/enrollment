const { db } = require('../config/database');
const { resolveStudentIdStrict } = require('../utils/helpers');

// Normalize year level to strict tokens used across the app
function normalizeYearLevel(v) {
  if (v == null) return null;
  const s = String(v).toLowerCase().trim();
  const m = s.match(/(1st|2nd|3rd|4th)|\b([1-4])\b/);
  if (m) {
    if (m[1]) return m[1];
    if (m[2]) {
      const n = Number(m[2]);
      return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : '4th';
    }
  }
  if (/first/.test(s)) return '1st';
  if (/second/.test(s)) return '2nd';
  if (/third/.test(s)) return '3rd';
  if (/(fourth|forth)/.test(s)) return '4th';
  const stripped = s.replace(/year/gi, '').trim();
  if (stripped === '1') return '1st';
  if (stripped === '2') return '2nd';
  if (stripped === '3') return '3rd';
  if (stripped === '4') return '4th';
  return s;
}

// --- Student: Get available sections ---
const getAvailableSections = async (req, res) => {
  try {
    // Check if student has any accountabilities
    const studentNumericId = await resolveStudentIdStrict(req.student.id);
    
    // Check if student has pending or approved enrollment
    const [existingEnrollments] = await db.query(
      'SELECT * FROM enrollments WHERE student_id = ? AND status IN (?, ?)',
      [studentNumericId, 'pending', 'approved']
    );
    
    // If student has pending/approved enrollment, return empty array
    if (existingEnrollments.length > 0) {
      return res.json([]);
    }
    
    // Return all OPEN sections for student's course, then filter by normalized year level
    const studentYear = normalizeYearLevel(req.student.year_level);
    let sections = [];
    [sections] = await db.query(
      `SELECT * FROM sections WHERE course_id = ? AND status = 'open'`,
      [req.student.course_id]
    );
    sections = sections.filter(sec => normalizeYearLevel(sec.year_level) === studentYear);

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

// --- Admin: Get current enrollment/registration form for a specific student ---
// Mirrors getCurrentEnrollment but resolves the target student from params and works under authAdmin
const getCurrentEnrollmentForAdmin = async (req, res) => {
  try {
    const targetStudentId = req.params.studentId;
    if (!targetStudentId) {
      return res.status(400).json({ error: 'Missing studentId parameter.' });
    }
    // Resolve numeric id from either numeric or string-based student id
    const studentNumericId = await resolveStudentIdStrict(targetStudentId);
    // Get latest enrollment for this student
    const [enrollments] = await db.query(
      `SELECT * FROM enrollments WHERE student_id = ? ORDER BY id DESC LIMIT 1`,
      [studentNumericId]
    );
    if (!enrollments.length || !['pending', 'approved'].includes(enrollments[0].status)) {
      return res.json({ enrollment: null, section: null, schedule: [] });
    }
    const enrollment = enrollments[0];

    let section = null;
    let scheduleRows = [];

    if (enrollment.enrollment_type === 'irregular') {
      const [irregularSchedules] = await db.query(
        `SELECT 
          sc.*, 
          sub.code as subject_code, 
          sub.name as subject_name, 
          sub.units, 
          sub.type,
          sc.instructor, 
          r.name as room_name,
          sec.name as section_name
         FROM irregular_enrollments ie
         JOIN schedules sc ON ie.schedule_id = sc.id
         JOIN subjects sub ON ie.subject_id = sub.id
         JOIN sections sec ON ie.section_id = sec.id
         LEFT JOIN rooms r ON sc.room_id = r.id
         WHERE ie.enrollment_id = ?`,
        [enrollment.id]
      );
      scheduleRows = irregularSchedules;
      const sectionNames = [...new Set(irregularSchedules.map(s => s.section_name))].join(', ');
      section = {
        id: null,
        name: sectionNames || 'Mixed Sections',
        schedule_type: 'irregular',
        status: 'open'
      };
    } else {
      if (enrollment.section_id) {
        const [sectionRows] = await db.query(`SELECT * FROM sections WHERE id = ?`, [enrollment.section_id]);
        section = sectionRows[0] || null;
        const [regularSchedules] = await db.query(
          `SELECT sc.*, sub.code as subject_code, sub.name as subject_name, sub.units, sub.type, sc.instructor, r.name as room_name
           FROM schedules sc
           JOIN subjects sub ON sc.subject_id = sub.id
           LEFT JOIN rooms r ON sc.room_id = r.id
           WHERE sc.section_id = ?`,
          [enrollment.section_id]
        );
        scheduleRows = regularSchedules;
      }
    }

    res.json({
      enrollment,
      section,
      schedule: scheduleRows,
    });
  } catch (err) {
    console.error('getCurrentEnrollmentForAdmin error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// --- Student: Get all available sections (even with pending enrollment) ---
const getAllAvailableSections = async (req, res) => {
  try {
    const studentNumericId = await resolveStudentIdStrict(req.student.id);
    
    // Get all OPEN sections for student's course, filter by normalized year level
    const studentYear = normalizeYearLevel(req.student.year_level);
    let sections = [];
    [sections] = await db.query(
      `SELECT * FROM sections WHERE course_id = ? AND status = 'open'`,
      [req.student.course_id]
    );
    sections = sections.filter(sec => normalizeYearLevel(sec.year_level) === studentYear);

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
    
    let section = null;
    let scheduleRows = [];
    
    if (enrollment.enrollment_type === 'irregular') {
      // Handle irregular enrollment - fetch subjects from irregular_enrollments table
      const [irregularSchedules] = await db.query(
        `SELECT 
          sc.*, 
          sub.code as subject_code, 
          sub.name as subject_name, 
          sub.units, 
          sub.type,
          sc.instructor, 
          r.name as room_name,
          sec.name as section_name
         FROM irregular_enrollments ie
         JOIN schedules sc ON ie.schedule_id = sc.id
         JOIN subjects sub ON ie.subject_id = sub.id
         JOIN sections sec ON ie.section_id = sec.id
         LEFT JOIN rooms r ON sc.room_id = r.id
         WHERE ie.enrollment_id = ?`,
        [enrollment.id]
      );
      scheduleRows = irregularSchedules;
      
      // For irregular enrollment, create a virtual section object with actual section names
      const sectionNames = [...new Set(irregularSchedules.map(s => s.section_name))].join(', ');
      section = {
        id: null,
        name: sectionNames || 'Mixed Sections',
        schedule_type: 'irregular',
        status: 'open'
      };
    } else {
      // Handle regular enrollment
      if (enrollment.section_id) {
        const [sectionRows] = await db.query(`SELECT * FROM sections WHERE id = ?`, [enrollment.section_id]);
        section = sectionRows[0] || null;
        
        // Get schedule for this section
        const [regularSchedules] = await db.query(
          `SELECT sc.*, sub.code as subject_code, sub.name as subject_name, sub.units, sub.type, sc.instructor, r.name as room_name
           FROM schedules sc
           JOIN subjects sub ON sc.subject_id = sub.id
           LEFT JOIN rooms r ON sc.room_id = r.id
           WHERE sc.section_id = ?`,
          [enrollment.section_id]
        );
        scheduleRows = regularSchedules;
      }
    }
    
    res.json({
      enrollment, // now includes reference_number and enrollment_type
      section,
      schedule: scheduleRows,
    });
  } catch (err) {
    console.error('getCurrentEnrollment error:', err);
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
  getAllAvailableSections,
  getCurrentEnrollment,
  getCurrentEnrollmentForAdmin,
  getAccountabilities,
  getGrades,
  getNotifications,
  markNotificationAsRead
};
