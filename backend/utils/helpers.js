const { db } = require('../config/database');

// Ensure a mirror row exists in students for FK satisfaction
async function ensureStudentsMirrorByStudentId(sid) {
  const studentIdStr = String(sid || '').trim();
  if (!studentIdStr) throw new Error('Student identifier is required');
  // If already exists, return its id
  let [rows] = await db.query('SELECT id FROM students WHERE student_id = ? LIMIT 1', [studentIdStr]);
  if (rows.length) return rows[0].id;
  // Pull minimal data from freshman_enrollments
  const [feRows] = await db.query(
    'SELECT student_id, first_name, last_name, middle_name, course_id FROM freshman_enrollments WHERE student_id = ? LIMIT 1',
    [studentIdStr]
  );
  if (!feRows.length) throw new Error('Student not found');
  const fe = feRows[0];
  // Try to create a minimal students row; tolerate schemas that may not have all columns
  try {
    const [result] = await db.query(
      'INSERT INTO students (student_id, first_name, last_name, middle_name, course_id) VALUES (?, ?, ?, ?, ?)',
      [fe.student_id, fe.first_name || null, fe.last_name || null, fe.middle_name || null, fe.course_id || null]
    );
    return result.insertId;
  } catch (e) {
    // Fallback: try inserting only student_id if strict schema
    try {
      const [result2] = await db.query('INSERT INTO students (student_id) VALUES (?)', [fe.student_id]);
      return result2.insertId;
    } catch (e2) {
      // As a last resort, re-check if another process inserted it
      [rows] = await db.query('SELECT id FROM students WHERE student_id = ? LIMIT 1', [studentIdStr]);
      if (rows.length) return rows[0].id;
      throw e2;
    }
  }
}

// --- Helper: Resolve the numeric student PK that matches the FOREIGN KEY target (students.id) ---
// This system now uses freshman_enrollments as the source of truth, but the enrollments FK
// still references students(id). Therefore, we must return students.id here.
async function resolveStudentIdStrict(studentIdOrString) {
  // If a numeric ID is provided, assume it is already the correct FK target (students.id)
  if (typeof studentIdOrString === 'number') {
    return studentIdOrString;
  }
  const sid = String(studentIdOrString || '').trim();
  if (!sid) throw new Error('Student identifier is required');

  // 1) Prefer exact match in students table by student_id (string)
  let [rows] = await db.query('SELECT id FROM students WHERE student_id = ? LIMIT 1', [sid]);
  if (rows.length) return rows[0].id;

  // 2) If not found, auto-create a mirror students row from freshman_enrollments to satisfy FK
  try {
    const newId = await ensureStudentsMirrorByStudentId(sid);
    return newId;
  } catch (_) { /* continue to step 3 */ }

  // 3) As a last attempt, allow matching students by legacy numeric id if a numeric string was passed
  if (/^\d+$/.test(sid)) {
    [rows] = await db.query('SELECT id FROM students WHERE id = ? LIMIT 1', [Number(sid)]);
    if (rows.length) return rows[0].id;
  }

  throw new Error('Student not found');
}

// Helper: Check if students are enrolled or pending in a section (any year/semester)
async function getSectionEnrollmentStatus(sectionId) {
  const [enrollments] = await db.query(
    "SELECT status FROM enrollments WHERE section_id = ? AND (status = 'approved' OR status = 'pending')",
    [sectionId]
  );
  if (enrollments.some(e => e.status === 'approved')) return 'approved';
  if (enrollments.some(e => e.status === 'pending')) return 'pending';
  return 'none';
}

module.exports = {
  resolveStudentIdStrict,
  ensureStudentsMirrorByStudentId,
  getSectionEnrollmentStatus
};
