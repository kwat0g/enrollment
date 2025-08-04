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
    
    // Check if already enrolled for this term
    const [existing] = await db.query(
      'SELECT * FROM enrollments WHERE student_id = ? AND school_year = ? AND semester = ? AND status IN (?, ?)',
      [studentNumericId, school_year, semester, 'pending', 'approved']
    );
    
    if (existing.length) {
      // If there's an existing enrollment, update it instead of creating a new one
      await db.query(
        `UPDATE enrollments SET section_id = ?, status = 'pending', date_applied = NOW() WHERE student_id = ? AND school_year = ? AND semester = ?`,
        [section_id, studentNumericId, school_year, semester]
      );
    } else {
      // Create new enrollment
      await db.query(
        `INSERT INTO enrollments (student_id, section_id, school_year, semester, status, date_applied) VALUES (?, ?, ?, ?, 'pending', NOW())`,
        [studentNumericId, section_id, school_year, semester]
      );
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: List pending enrollments ---
const getPendingEnrollments = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        e.*, 
        s.student_id, 
        s.last_name, 
        s.first_name, 
        CASE 
          WHEN e.enrollment_type = 'irregular' THEN (
            SELECT GROUP_CONCAT(DISTINCT sec2.name SEPARATOR ', ')
            FROM irregular_enrollments ie
            JOIN sections sec2 ON ie.section_id = sec2.id
            WHERE ie.enrollment_id = e.id
          )
          ELSE COALESCE(sec.name, 'Unknown Section')
        END as section_name,
        e.enrollment_type
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      LEFT JOIN sections sec ON e.section_id = sec.id
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

// --- Student: Get all scheduled subjects for irregular enrollment ---
const getAllScheduledSubjects = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        sch.id,
        sch.subject_id,
        sch.section_id,
        sch.day,
        sch.start_time,
        sch.end_time,
        sch.room_id,
        sch.instructor,
        sub.code as subject_code,
        sub.name as subject_name,
        sub.units,
        sub.type,
        sec.name as section_name,
        sec.year_level,
        sec.course_id,
        r.name as room_name
      FROM schedules sch
      JOIN subjects sub ON sch.subject_id = sub.id
      JOIN sections sec ON sch.section_id = sec.id
      LEFT JOIN rooms r ON sch.room_id = r.id
      ORDER BY sub.code, sub.type, sec.name
    `);
    
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Student: Submit irregular enrollment ---
const submitIrregularEnrollment = async (req, res) => {
  console.log('DEBUG submitIrregularEnrollment payload:', req.body);
  const { subject_schedules, school_year, semester, enrollment_id } = req.body;

  if (!subject_schedules || !Array.isArray(subject_schedules) || subject_schedules.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid subject schedules.' });
  }

  if (!school_year || !semester) {
    return res.status(400).json({ error: 'Missing required fields: school_year, semester.' });
  }

  try {
    const studentNumericId = await resolveStudentIdStrict(req.student.id);

    if (enrollment_id) {
      // --- UPDATE EXISTING PENDING IRREGULAR ENROLLMENT ---
      // Verify the enrollment exists, belongs to student, is pending, and is irregular
      const [enrollments] = await db.query(
        'SELECT * FROM enrollments WHERE id = ? AND student_id = ? AND school_year = ? AND semester = ? AND status = ? AND enrollment_type = ?',
        [enrollment_id, studentNumericId, school_year, semester, 'pending', 'irregular']
      );
      if (!enrollments.length) {
        return res.status(400).json({ error: 'Pending irregular enrollment not found for update.' });
      }
      await db.query('START TRANSACTION');
      try {
        // Delete previous irregular_enrollments for this enrollment
        await db.query('DELETE FROM irregular_enrollments WHERE enrollment_id = ?', [enrollment_id]);
        // Insert new subject schedules
        for (const subjectSchedule of subject_schedules) {
          const { subject_id, schedule_id, section_id } = subjectSchedule;
          if (!subject_id || !schedule_id || !section_id) {
            throw new Error('Invalid subject schedule data.');
          }
          await db.query(
            `INSERT INTO irregular_enrollments (enrollment_id, subject_id, schedule_id, section_id)
             VALUES (?, ?, ?, ?)`,
            [enrollment_id, subject_id, schedule_id, section_id]
          );
        }
        await db.query('COMMIT');
        res.json({ success: true, enrollment_id });
      } catch (transactionErr) {
        await db.query('ROLLBACK');
        throw transactionErr;
      }
      return;
    }

    // --- CREATE NEW IRREGULAR ENROLLMENT ---
    // Check if already enrolled for this term
    const [existing] = await db.query(
      'SELECT * FROM enrollments WHERE student_id = ? AND school_year = ? AND semester = ? AND status IN (?, ?)',
      [studentNumericId, school_year, semester, 'pending', 'approved']
    );
    if (existing.length) {
      return res.status(400).json({ error: 'You already have an enrollment for this term.' });
    }
    await db.query('START TRANSACTION');
    try {
      // Use the first selected section as the primary section for the enrollment record
      const primarySectionId = subject_schedules[0].section_id;
      // Create enrollment record
      const [enrollmentResult] = await db.query(
        `INSERT INTO enrollments (student_id, section_id, school_year, semester, status, date_applied, enrollment_type)
         VALUES (?, ?, ?, ?, 'pending', NOW(), 'irregular')`,
        [studentNumericId, primarySectionId, school_year, semester]
      );
      const newEnrollmentId = enrollmentResult.insertId;
      // Insert irregular enrollment subjects
      for (const subjectSchedule of subject_schedules) {
        const { subject_id, schedule_id, section_id } = subjectSchedule;
        if (!subject_id || !schedule_id || !section_id) {
          throw new Error('Invalid subject schedule data.');
        }
        await db.query(
          `INSERT INTO irregular_enrollments (enrollment_id, subject_id, schedule_id, section_id)
           VALUES (?, ?, ?, ?)`,
          [newEnrollmentId, subject_id, schedule_id, section_id]
        );
      }
      await db.query('COMMIT');
      res.json({ success: true, enrollment_id: newEnrollmentId });
    } catch (transactionErr) {
      await db.query('ROLLBACK');
      throw transactionErr;
    }
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Get irregular enrollment details ---
const getIrregularEnrollmentDetails = async (req, res) => {
  try {
    const enrollmentId = req.params.id;
    
    // Get enrollment info
    const [enrollments] = await db.query(
      'SELECT * FROM enrollments WHERE id = ? AND enrollment_type = "irregular"',
      [enrollmentId]
    );
    
    if (!enrollments.length) {
      return res.status(404).json({ error: 'Irregular enrollment not found.' });
    }
    
    // Get irregular enrollment subjects
    const [subjects] = await db.query(
      `SELECT 
        ie.*,
        sc.day,
        sc.start_time,
        sc.end_time,
        sc.instructor,
        sub.code as subject_code,
        sub.name as subject_name,
        sub.units,
        sub.type,
        sec.name as section_name,
        r.name as room_name
       FROM irregular_enrollments ie
       JOIN schedules sc ON ie.schedule_id = sc.id
       JOIN subjects sub ON ie.subject_id = sub.id
       JOIN sections sec ON ie.section_id = sec.id
       LEFT JOIN rooms r ON sc.room_id = r.id
       WHERE ie.enrollment_id = ?
       ORDER BY sub.code, sub.type`,
      [enrollmentId]
    );
    
    res.json({
      enrollment: enrollments[0],
      subjects: subjects
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

module.exports = {
  submitEnrollment,
  getPendingEnrollments,
  approveEnrollment,
  rejectEnrollment,
  getAllScheduledSubjects,
  submitIrregularEnrollment,
  getIrregularEnrollmentDetails
};
