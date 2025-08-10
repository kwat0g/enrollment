const { db } = require('../config/database');

// Ensure status column exists (works for MySQL 5.7+ by checking information_schema)
async function ensureStatusColumn() {
  try {
    const [rows] = await db.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'freshman_enrollments' AND COLUMN_NAME = 'status'`
    );
    if (!rows || rows.length === 0) {
      await db.query(
        "ALTER TABLE freshman_enrollments ADD COLUMN status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending'"
      );
    }
  } catch (e) {
    console.warn('Warning ensuring status column:', e.message || e);
  }
}

/**
 * GET /api/admin/freshman-enrollments
 * Returns PENDING records from freshman_enrollments table.
 */
async function getAllFreshmanEnrollments(req, res) {
  try {
    await ensureStatusColumn();
    const [rows] = await db.query(
      `SELECT id,
              student_id,
              course_id,
              first_name, middle_name, last_name, suffix,
              DATE_FORMAT(birthdate, '%Y-%m-%d') AS birthdate, sex, civil_status,
              nationality, place_of_birth, religion,
              email, mobile,
              region, province, city, barangay, address_line, zip,
              father_name, father_occupation, father_contact,
              mother_name, mother_occupation, mother_contact,
              guardian_name, guardian_relation, guardian_contact,
              year_level, admission_type,
              shs_name, shs_track, preferred_sched,
              consent,
              status
         FROM freshman_enrollments
        WHERE status = 'pending'`
    );
    res.json(rows);
  } catch (err) {
    console.error('getAllFreshmanEnrollments error:', err);
    res.status(500).json({ error: 'Failed to fetch freshman enrollments' });
  }
}

/**
 * POST /api/admin/freshman-enrollments/:id/accept
 */
async function acceptFreshmanEnrollment(req, res) {
  try {
    await ensureStatusColumn();
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    const [result] = await db.query(
      `UPDATE freshman_enrollments SET status='accepted' WHERE id=?`,
      [id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Enrollment not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('acceptFreshmanEnrollment error:', err);
    res.status(500).json({ error: 'Failed to accept enrollment' });
  }
}

/**
 * POST /api/admin/freshman-enrollments/:id/reject
 */
async function rejectFreshmanEnrollment(req, res) {
  try {
    await ensureStatusColumn();
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    const [result] = await db.query(
      `UPDATE freshman_enrollments SET status='rejected' WHERE id=?`,
      [id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Enrollment not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('rejectFreshmanEnrollment error:', err);
    res.status(500).json({ error: 'Failed to reject enrollment' });
  }
}

module.exports = { getAllFreshmanEnrollments, acceptFreshmanEnrollment, rejectFreshmanEnrollment };
/**
 * GET /api/admin/freshman-enrollments/:id
 * Returns full record for a single enrollment id
 */
async function getFreshmanEnrollmentById(req, res) {
  try {
    await ensureStatusColumn();
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    const [rows] = await db.query(
      `SELECT id,
              student_id,
              course_id,
              first_name, middle_name, last_name, suffix,
              DATE_FORMAT(birthdate, '%Y-%m-%d') AS birthdate, sex, civil_status,
              nationality, citizenship, place_of_birth, religion,
              email, mobile,
              region_code, province_code, city_code, barangay_code,
              region, province, city, barangay, address_line, zip,
              father_name, father_occupation, father_contact,
              mother_name, mother_occupation, mother_contact,
              guardian_name, guardian_relation, guardian_contact,
              shs_name, shs_track, preferred_sched,
              year_level, admission_type,
              consent,
              status,
              created_at, updated_at
         FROM freshman_enrollments
        WHERE id = ?
        LIMIT 1`,
      [id]
    );
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Enrollment not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getFreshmanEnrollmentById error:', err);
    res.status(500).json({ error: 'Failed to fetch enrollment details' });
  }
}

module.exports.getFreshmanEnrollmentById = getFreshmanEnrollmentById;
