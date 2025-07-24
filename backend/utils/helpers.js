const { db } = require('../config/database');

// --- Helper: Ensure numeric student_id for accountabilities ---
async function resolveStudentIdStrict(studentIdOrString) {
  if (typeof studentIdOrString === 'number') {
    return studentIdOrString;
  }
  // If it's a string, find the numeric id
  const [rows] = await db.query('SELECT id FROM students WHERE student_id = ? LIMIT 1', [studentIdOrString]);
  if (!rows.length) throw new Error('Student not found');
  return rows[0].id;
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
  getSectionEnrollmentStatus
};
