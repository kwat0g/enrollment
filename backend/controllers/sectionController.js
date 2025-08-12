const { db } = require('../config/database');
const { getSectionEnrollmentStatus } = require('../utils/helpers');

// --- Admin: Get all sections ---
const getAllSections = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT s.*, s.schedule_type, c.name as course_name FROM sections s LEFT JOIN courses c ON s.course_id = c.id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Create section ---
const createSection = async (req, res) => {
  const { name, year_level, course_id, schedule_type, status } = req.body;
  const requiredFields = [
    { key: 'name', label: 'Section name' },
    { key: 'year_level', label: 'Year level' },
    { key: 'course_id', label: 'Course' },
    { key: 'status', label: 'Status' }
  ];
  for (const field of requiredFields) {
    if (!req.body[field.key]) {
      return res.status(400).json({ error: `${field.label} is required.` });
    }
  }
  try {
    await db.query('INSERT INTO sections (name, year_level, course_id, schedule_type, status) VALUES (?, ?, ?, ?, ?)', [name, year_level, course_id, schedule_type, status]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Update section ---
const updateSection = async (req, res) => {
  const { name, year_level, course_id, schedule_type, status } = req.body;
  if (!name || !year_level || !course_id || !status) return res.status(400).json({ error: 'Missing required fields.' });
  try {
    // Fetch current section data
    const [currentSections] = await db.query('SELECT * FROM sections WHERE id = ?', [req.params.id]);
    if (!currentSections.length) {
      return res.status(404).json({ error: 'Section not found.' });
    }
    const currentSection = currentSections[0];
    
    // Check if section is open - prevent editing if open
    if (currentSection.status === 'open') {
      return res.status(400).json({ error: 'Cannot edit section: section is currently open for enrollment.' });
    }
    
    // Check for enrolled or pending students - prevent editing if any exist
    const enrollmentStatus = await getSectionEnrollmentStatus(req.params.id);
    if (enrollmentStatus === 'approved') {
      return res.status(400).json({ error: 'Cannot edit section: students are already enrolled in this section for the current term.' });
    }
    if (enrollmentStatus === 'pending') {
      return res.status(400).json({ error: 'Cannot edit section: there are pending enrollments for this section in the current term.' });
    }
    
    await db.query('UPDATE sections SET name=?, year_level=?, course_id=?, schedule_type=?, status=? WHERE id=?', [name, year_level, course_id, schedule_type, status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Delete section ---
const deleteSection = async (req, res) => {
  try {
    // Check for enrollments (approved or pending) for the current term
    const status = await getSectionEnrollmentStatus(req.params.id);
    if (status === 'approved') {
      return res.status(400).json({ error: 'Cannot delete section: students are already enrolled for the current term.' });
    }
    if (status === 'pending') {
      return res.status(400).json({ error: 'Cannot delete section: there are pending enrollments for the current term.' });
    }
    await db.query('DELETE FROM sections WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Get section enrollment status ---
const getSectionStatus = async (req, res) => {
  try {
    const status = await getSectionEnrollmentStatus(req.params.id);
    res.json({ status });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Open/Close section ---
const updateSectionStatus = async (req, res) => {
  const { status } = req.body; // 'open' or 'closed'
  if (!['open', 'closed'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  try {
    // If opening, check if section has assigned subjects
    if (status === 'open') {
      console.log(`Checking subjects for section ${req.params.id}`);
      const [assignedSubjects] = await db.query('SELECT COUNT(*) as count FROM schedules WHERE section_id = ?', [req.params.id]);
      console.log(`Found ${assignedSubjects[0].count} assigned subjects for section ${req.params.id}`);
      if (assignedSubjects[0].count === 0) {
        console.log(`Blocking section ${req.params.id} from opening - no subjects assigned`);
        return res.status(400).json({ error: 'Cannot open section: no subjects are assigned to this section.' });
      }
      console.log(`Allowing section ${req.params.id} to open - has ${assignedSubjects[0].count} subjects`);
    }
    
    // If closing, check for pending enrollments
    if (status === 'closed') {
      const enrollmentStatus = await getSectionEnrollmentStatus(req.params.id);
      if (enrollmentStatus === 'pending') {
        return res.status(400).json({ error: 'Cannot close section: there are pending enrollments.' });
      }
    }
    await db.query('UPDATE sections SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Get schedules for a section ---
const getSectionSchedules = async (req, res) => {
  const sectionId = req.params.sectionId;
  try {
    const [scheduleRows] = await db.query(
      `SELECT sc.*, sub.code as subject_code, sub.name as subject_name, sub.units, r.name as room_name
       FROM schedules sc
       JOIN subjects sub ON sc.subject_id = sub.id
       LEFT JOIN rooms r ON sc.room_id = r.id
       WHERE sc.section_id = ?`,
      [sectionId]
    );
    res.json(scheduleRows);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Get enrollments for a section ---
const getSectionEnrollments = async (req, res) => {
  const sectionId = req.params.sectionId;
  try {
    const [enrollmentRows] = await db.query(
      `SELECT e.*, fe.student_id, fe.last_name, fe.first_name
       FROM enrollments e
       JOIN freshman_enrollments fe ON e.student_id = fe.id
       WHERE e.section_id = ? AND e.status IN ('pending', 'approved')`,
      [sectionId]
    );
    res.json(enrollmentRows);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

module.exports = {
  getAllSections,
  createSection,
  updateSection,
  deleteSection,
  getSectionStatus,
  updateSectionStatus,
  getSectionSchedules,
  getSectionEnrollments
};
