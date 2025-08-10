const { db } = require('../config/database');

// Basic server-side validation helpers
function isNonEmptyString(v) { return typeof v === 'string' && v.trim().length > 0; }
function isNullableString(v) { return v === null || v === undefined || typeof v === 'string'; }
function isEmail(v) { return typeof v === 'string' && /.+@.+\..+/.test(v); }
function isMobilePH(v) { return typeof v === 'string' && /^09\d{9}$/.test(v); }

// Insert freshman enrollment (public)
// Expects body fields aligned with FreshmanEnrollment.vue
async function submitFreshmanEnrollment(req, res) {
  try {
    const b = req.body || {};

    // Required minimal fields (match frontend required validations)
    const required = [
      'first_name','last_name','birthdate','sex','civil_status','nationality','place_of_birth','religion',
      'email','mobile','region_code','city_code','barangay_code','address_line','zip',
      'father_name','father_occupation','father_contact',
      'mother_name','mother_occupation','mother_contact',
      'guardian_name','guardian_relation','guardian_contact',
      'year_level','admission_type'
    ];

    for (const key of required) {
      if (!isNonEmptyString(String(b[key] ?? ''))) {
        return res.status(400).json({ error: `Missing or invalid field: ${key}` });
      }
    }
    if (!isEmail(b.email)) return res.status(400).json({ error: 'Invalid email format' });
    // Frontend uses 11-digit PH numbers starting with 09
    if (!isMobilePH(b.mobile)) return res.status(400).json({ error: 'Invalid mobile number' });
    if (!isMobilePH(b.father_contact)) return res.status(400).json({ error: 'Invalid father_contact' });
    if (!isMobilePH(b.mother_contact)) return res.status(400).json({ error: 'Invalid mother_contact' });
    if (!isMobilePH(b.guardian_contact)) return res.status(400).json({ error: 'Invalid guardian_contact' });

    // Optional numeric references (nullable)
    const student_id = b.student_id != null && b.student_id !== '' ? Number(b.student_id) : null;
    const course_id = b.course_id != null && b.course_id !== '' ? Number(b.course_id) : null;
    if (student_id !== null && Number.isNaN(student_id)) return res.status(400).json({ error: 'student_id must be a number or null' });
    if (course_id !== null && Number.isNaN(course_id)) return res.status(400).json({ error: 'course_id must be a number or null' });

    // Map fields to DB columns
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
                ?,?,?,
                ?,?,
                ?)
    `;

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
    ];

    const [result] = await db.query(sql, params);
    return res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('submitFreshmanEnrollment error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

module.exports = { submitFreshmanEnrollment };
