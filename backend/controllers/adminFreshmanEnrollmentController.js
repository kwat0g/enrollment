const { db } = require('../config/database');

// Ensure status column exists and supports the 'accepted' value
async function ensureStatusColumn() {
  try {
    // Check if column exists
    const [rows] = await db.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'freshman_enrollments' AND COLUMN_NAME = 'status'`
    );
    if (!rows || rows.length === 0) {
      await db.query(
        "ALTER TABLE freshman_enrollments ADD COLUMN status ENUM('pending','approved','accepted','rejected') NOT NULL DEFAULT 'pending'"
      );
      return;
    }
    // If exists but doesn't include 'accepted', modify ENUM to include it
    const colType = (rows[0].COLUMN_TYPE || '').toLowerCase();
    if (!colType.includes("'accepted'") || !colType.includes("'approved'")) {
      await db.query(
        "ALTER TABLE freshman_enrollments MODIFY COLUMN status ENUM('pending','approved','accepted','rejected') NOT NULL DEFAULT 'pending'"
      );
    }
  } catch (e) {
    console.warn('Warning ensuring status column:', e.message || e);
  }
}

/**
 * GET /api/admin/freshman-enrollments
 * Returns records from freshman_enrollments table filtered by status.
 * Default status is 'accepted' per admin requirement.
 * Example: /api/admin/freshman-enrollments?status=accepted
 */
async function getAllFreshmanEnrollments(req, res) {
  try {
    await ensureStatusColumn();
    const status = String((req.query.status || 'accepted')).toLowerCase();
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
        WHERE status = ?`,
      [status]
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

    // Use a connection for transaction
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Load enrollment
      const [enRows] = await conn.query(
        `SELECT * FROM freshman_enrollments WHERE id = ? FOR UPDATE`,
        [id]
      );
      if (!enRows || enRows.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(404).json({ error: 'Enrollment not found' });
      }
      const enrollment = enRows[0];

      // If already accepted and has a student_id (code), just return success
      if (String(enrollment.status).toLowerCase() === 'accepted' && enrollment.student_id) {
        await conn.commit();
        conn.release();
        return res.json({ success: true, student_code: enrollment.student_id });
      }

      // Build student code to store directly on enrollment (no insert into students)
      let studentCode = enrollment.student_id; // may already be set to a code
      if (!studentCode) {
        const yearPrefix = new Date().getFullYear();
        // Find the maximum existing code in freshman_enrollments for this year prefix
        const [rowsMax] = await conn.query(
          `SELECT student_id FROM freshman_enrollments WHERE student_id LIKE ? ORDER BY student_id DESC LIMIT 1`,
          [`${yearPrefix}-%`]
        );
        let nextNum = 1;
        if (rowsMax && rowsMax.length > 0 && rowsMax[0].student_id) {
          const last = rowsMax[0].student_id;
          const num = parseInt(String(last).slice(5), 10);
          nextNum = Number.isFinite(num) && num >= 1 ? num + 1 : 1;
        }
        studentCode = `${yearPrefix}-${String(nextNum).padStart(5, '0')}`;
      }

      // Map fields
      const first_name = enrollment.first_name;
      const last_name = enrollment.last_name;
      const middle_name = enrollment.middle_name || '';
      const suffix = enrollment.suffix || '';
      const gender = enrollment.sex || enrollment.gender || '';
      const email = enrollment.email || '';
      const contact_number = enrollment.mobile || '';
      const course_id = enrollment.course_id;
      const year_level = enrollment.year_level;
      // Compose address from available parts
      const parts = [
        enrollment.address_line,
        enrollment.barangay,
        enrollment.city,
        enrollment.province,
        enrollment.zip
      ].filter(Boolean);
      const address = parts.join(', ');

      // Update enrollment: set status accepted and set student_id to the code
      await conn.query(
        `UPDATE freshman_enrollments SET status='accepted', student_id = ? WHERE id = ?`,
        [studentCode, id]
      );

      await conn.commit();
      conn.release();
      return res.json({ success: true, student_code: studentCode });
    } catch (txErr) {
      try { await conn.rollback(); } catch (_) {}
      conn.release();
      throw txErr;
    }
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

// GET /api/admin/freshman-enrollments/by-student/:student_id
// Returns full record for a single student_id with status approved or accepted
async function getFreshmanEnrollmentByStudentId(req, res) {
  try {
    await ensureStatusColumn();
    const studentId = String(req.params.student_id || '').trim();
    if (!studentId) return res.status(400).json({ error: 'Invalid student_id' });
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
        WHERE student_id = ? AND status IN ('approved','accepted')
        LIMIT 1`,
      [studentId]
    );
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Enrollment not found for student' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getFreshmanEnrollmentByStudentId error:', err);
    res.status(500).json({ error: 'Failed to fetch enrollment by student_id' });
  }
}

module.exports.getFreshmanEnrollmentByStudentId = getFreshmanEnrollmentByStudentId;

// === CREATE (ADMIN) ===
// POST /api/admin/freshman-enrollments
// Inserts a freshman_enrollments row from admin with same payload as public
async function submitAdminFreshmanEnrollment(req, res) {
  try {
    const b = req.body || {}

    // Minimal required fields to match frontend validations
    const required = [
      'first_name','last_name','birthdate','sex','civil_status','nationality','place_of_birth','religion',
      'email','mobile','region_code','city_code','barangay_code','address_line','zip',
      'father_name','father_occupation','father_contact',
      'mother_name','mother_occupation','mother_contact',
      'guardian_name','guardian_relation','guardian_contact',
      'year_level','admission_type'
    ]

    const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0
    const isEmail = (v) => typeof v === 'string' && /.+@.+\..+/.test(v)
    const isMobilePH = (v) => typeof v === 'string' && /^09\d{9}$/.test(v)

    for (const key of required) {
      if (!isNonEmptyString(String(b[key] ?? ''))) {
        return res.status(400).json({ error: `Missing or invalid field: ${key}` })
      }
    }
    if (!isEmail(b.email)) return res.status(400).json({ error: 'Invalid email format' })
    if (!isMobilePH(b.mobile)) return res.status(400).json({ error: 'Invalid mobile number' })
    if (!isMobilePH(b.father_contact)) return res.status(400).json({ error: 'Invalid father_contact' })
    if (!isMobilePH(b.mother_contact)) return res.status(400).json({ error: 'Invalid mother_contact' })
    if (!isMobilePH(b.guardian_contact)) return res.status(400).json({ error: 'Invalid guardian_contact' })

    const student_id = b.student_id != null && b.student_id !== '' ? Number(b.student_id) : null
    const course_id = b.course_id != null && b.course_id !== '' ? Number(b.course_id) : null
    if (student_id !== null && Number.isNaN(student_id)) return res.status(400).json({ error: 'student_id must be a number or null' })
    if (course_id !== null && Number.isNaN(course_id)) return res.status(400).json({ error: 'course_id must be a number or null' })

    const sql = `
      INSERT INTO freshman_enrollments (
        student_id, course_id,
        first_name, middle_name, last_name, suffix, birthdate, sex, civil_status, nationality, citizenship, place_of_birth, religion,
        email, mobile, region_code, province_code, city_code, barangay_code, region, province, city, barangay, address_line, zip,
        father_name, father_occupation, father_contact,
        mother_name, mother_occupation, mother_contact,
        guardian_name, guardian_relation, guardian_contact,
        shs_name, shs_track, preferred_sched,
        year_level, admission_type,
        consent
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,
                ?,?,?,?,?,?,?,?,?,?,?,?,
                ?,?,?,
                ?,?,?,
                ?,?,?,
                ?,?, ?,
                ?,?,
                ?)
    `

    const params = [
      student_id, course_id,
      b.first_name?.trim(), b.middle_name ?? null, b.last_name?.trim(), b.suffix ?? null, b.birthdate, b.sex, b.civil_status, b.nationality, (b.citizenship ?? b.nationality), b.place_of_birth, b.religion,
      b.email, b.mobile, b.region_code, b.province_code ?? null, b.city_code, b.barangay_code, b.region ?? null, b.province ?? null, b.city ?? null, b.barangay ?? null, b.address_line, b.zip,
      b.father_name, b.father_occupation, b.father_contact,
      b.mother_name, b.mother_occupation, b.mother_contact,
      b.guardian_name, b.guardian_relation, b.guardian_contact,
      b.shs_name ?? null, b.shs_track ?? null, b.preferred_sched ?? null,
      b.year_level, b.admission_type,
      b.consent ? 1 : 0
    ]

    const [result] = await db.query(sql, params)
    return res.json({ success: true, id: result.insertId })
  } catch (err) {
    console.error('submitAdminFreshmanEnrollment error:', err)
    return res.status(500).json({ error: err.message || 'Server error' })
  }
}

module.exports.submitAdminFreshmanEnrollment = submitAdminFreshmanEnrollment;

// === UPDATE (ADMIN) ===
// PUT /api/admin/freshman-enrollments/by-student/:student_id
async function updateFreshmanEnrollmentByStudentId(req, res) {
  try {
    const studentId = String(req.params.student_id || '').trim()
    if (!studentId) return res.status(400).json({ error: 'Invalid student_id' })
    const b = req.body || {}

    // Build dynamic update statement with allowed columns
    const allowed = [
      'course_id',
      'first_name','middle_name','last_name','suffix','birthdate','sex','civil_status','nationality','citizenship','place_of_birth','religion',
      'email','mobile','region_code','province_code','city_code','barangay_code','region','province','city','barangay','address_line','zip',
      'father_name','father_occupation','father_contact',
      'mother_name','mother_occupation','mother_contact',
      'guardian_name','guardian_relation','guardian_contact',
      'shs_name','shs_track','preferred_sched',
      'year_level','admission_type',
      'consent'
    ]

    const sets = []
    const params = []
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(b, key)) {
        sets.push(`${key} = ?`)
        params.push(b[key])
      }
    }
    if (sets.length === 0) return res.status(400).json({ error: 'No updatable fields provided' })

    params.push(studentId)
    const sql = `UPDATE freshman_enrollments SET ${sets.join(', ')} WHERE student_id = ?`
    const [result] = await db.query(sql, params)
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Enrollment not found for student' })
    return res.json({ success: true })
  } catch (err) {
    console.error('updateFreshmanEnrollmentByStudentId error:', err)
    return res.status(500).json({ error: err.message || 'Server error' })
  }
}

module.exports.updateFreshmanEnrollmentByStudentId = updateFreshmanEnrollmentByStudentId;
