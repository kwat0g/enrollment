const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('../config/database');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../middleware/auth');

// --- Student Login: fetch primary info from freshman_enrollments ---
// Expects: { studentId, lastName } where studentId is the student's string ID stored in freshman_enrollments.student_id
// Returns a token and a user object containing ALL freshman_enrollments fields (plus legacy fields for compatibility)
const studentLogin = async (req, res) => {
  const { studentId, lastName } = req.body;
  if (!studentId || !lastName) {
    return res.status(400).json({ error: 'Student ID and Last Name are required.' });
  }
  try {
    const sid = String(studentId).trim();
    const lname = String(lastName).trim();
    // Find the freshman_enrollments row by provided credentials (forgiving on casing/spacing)
    const [feRows] = await db.query(
      `SELECT fe.*, c.name AS course_name, c.code AS course_code
       FROM freshman_enrollments fe
       LEFT JOIN courses c ON fe.course_id = c.id
       WHERE TRIM(fe.student_id) = TRIM(?)
         AND LOWER(TRIM(fe.last_name)) = LOWER(TRIM(?))
       ORDER BY 
         (CASE fe.status WHEN 'accepted' THEN 2 WHEN 'pending' THEN 1 ELSE 0 END) DESC,
         fe.id DESC
       LIMIT 1`,
      [sid, lname]
    );
    if (!feRows.length) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const fe = feRows[0];

    // Prepare token: id will be the numeric primary key of freshman_enrollments (fe.id)
    const token = jwt.sign(
      {
        id: fe.id || null,
        student_id: fe.student_id, // string ID from freshman_enrollments
        role: 'student',
        year_level: fe.year_level || null,
        course_id: fe.course_id || null,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const user = {
      // IDs
      id: fe.student_id || null,
      student_id: studentId,
      // Name
      first_name: fe.first_name ?? null,
      middle_name: fe.middle_name ?? null,
      last_name: fe.last_name ?? null,
      suffix: fe.suffix ?? null,
      // Personal
      birthdate: fe.birthdate ?? null,
      sex: fe.sex ?? null,
      civil_status: fe.civil_status ?? null,
      nationality: fe.nationality ?? null,
      citizenship: fe.citizenship ?? null,
      place_of_birth: fe.place_of_birth ?? null,
      religion: fe.religion ?? null,
      // Contact & Address
      email: fe.email ?? null,
      mobile: fe.mobile ?? null,
      region_code: fe.region_code ?? null,
      province_code: fe.province_code ?? null,
      city_code: fe.city_code ?? null,
      barangay_code: fe.barangay_code ?? null,
      region: fe.region ?? null,
      province: fe.province ?? null,
      city: fe.city ?? null,
      barangay: fe.barangay ?? null,
      address_line: fe.address_line ?? null,
      zip: fe.zip ?? null,
      // Parents/Guardian
      father_name: fe.father_name ?? null,
      father_occupation: fe.father_occupation ?? null,
      father_contact: fe.father_contact ?? null,
      mother_name: fe.mother_name ?? null,
      mother_occupation: fe.mother_occupation ?? null,
      mother_contact: fe.mother_contact ?? null,
      guardian_name: fe.guardian_name ?? null,
      guardian_relation: fe.guardian_relation ?? null,
      guardian_contact: fe.guardian_contact ?? null,
      // Academic/Program
      shs_name: fe.shs_name ?? null,
      shs_track: fe.shs_track ?? null,
      preferred_sched: fe.preferred_sched ?? null,
      year_level: fe.year_level ?? null,
      admission_type: fe.admission_type ?? null,
      course_id: fe.course_id ?? null,
      course_name: fe.course_name ?? null,
      course_code: fe.course_code ?? null,
      // Consent/Meta
      consent: fe.consent ?? null,
      status: fe.status ?? null,
      created_at: fe.created_at ?? null,
      updated_at: fe.updated_at ?? null,
      // Legacy/back-compat fields expected by frontend
      gender: fe.sex ?? null,
      contact_number: fe.mobile ?? null,
      address: fe.address_line ?? null,
      role: 'student',
    };

    return res.json({ token, user });
  } catch (err) {
    console.error('studentLogin error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// --- Admin Login Endpoint ---
const adminLogin = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials.' });
  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ? LIMIT 1', [username]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials.' });
    const admin = rows[0];
    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials.' });
    const token = jwt.sign({ id: admin.id, username: admin.username, role: 'admin' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ token, user: { id: admin.id, username: admin.username, role: 'admin' } });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Token Refresh Endpoint ---
const refreshToken = async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token is required.' });
  }

  try {
    // Verify the existing token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Generate a new token with the same payload but new expiration
    const newToken = jwt.sign(
      {
        id: decoded.id,
        student_id: decoded.student_id,
        username: decoded.username,
        role: decoded.role,
        year_level: decoded.year_level,
        course_id: decoded.course_id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ 
      token: newToken,
      message: 'Token refreshed successfully'
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please login again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    console.error('Token refresh error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  studentLogin,
  adminLogin,
  refreshToken
};
