const { db } = require('../config/database');
const { resolveStudentIdStrict } = require('../utils/helpers');

// --- Student: Submit enrollment (pending) ---
const submitEnrollment = async (req, res) => {
  const { section_id, school_year, semester } = req.body;
  if (!section_id || !school_year || !semester) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  try {
    const studentNumericId = await resolveStudentIdStrict(req.student.id);
    // Check if already enrolled for this term (block only if status is 'pending' or 'approved')
    const [existing] = await db.query(
      'SELECT * FROM enrollments WHERE student_id = ? AND school_year = ? AND semester = ? AND status IN (?, ?)',
      [studentNumericId, school_year, semester, 'pending', 'approved']
    );
    if (existing.length) {
      return res.status(400).json({ error: 'Already enrolled for this term.' });
    }
    await db.query(
      `INSERT INTO enrollments (student_id, section_id, school_year, semester, status, date_applied) VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [studentNumericId, section_id, school_year, semester]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: List pending enrollments ---
const getPendingEnrollments = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.*, s.student_id, s.last_name, s.first_name, sec.name as section_name
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      JOIN sections sec ON e.section_id = sec.id
      WHERE e.status = 'pending'
      ORDER BY e.date_applied ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Approve enrollment ---
const approveEnrollment = async (req, res) => {
  // TODO: Add admin authentication/authorization as needed
  const enrollmentId = req.params.id;
  try {
    // Generate reference number: ENR-YYYYMMDD-<enrollment_id>
    const today = new Date();
    const dateStr = today.getFullYear().toString() + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    const referenceNumber = `ENR-${dateStr}-${enrollmentId}`;
    
    await db.query(
      'UPDATE enrollments SET status = ?, reference_number = ?, date_applied = NOW() WHERE id = ?',
      ['approved', referenceNumber, enrollmentId]
    );
    res.json({ success: true, reference_number: referenceNumber });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Reject enrollment ---
const { createNotification } = require('../utils/notification');
const rejectEnrollment = async (req, res) => {
  try {
    // Get enrollment info to find student_id
    const [enrollments] = await db.query('SELECT student_id FROM enrollments WHERE id = ?', [req.params.id]);
    if (!enrollments.length) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }
    const studentId = enrollments[0].student_id;
    await db.query('UPDATE enrollments SET status = ? WHERE id = ?', ['rejected', req.params.id]);
    // Create notification for the student
    await createNotification(studentId, 'Your enrollment request has been rejected by the administrator.', 'enrollment');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

module.exports = {
  submitEnrollment,
  getPendingEnrollments,
  approveEnrollment,
  rejectEnrollment
};
