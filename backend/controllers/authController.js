const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { db } = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');

// --- Login endpoint (fix: do not use resolveStudentIdStrict here, allow login by student_id string and last_name) ---
const studentLogin = async (req, res) => {
  const { studentId, lastName } = req.body;
  if (!studentId || !lastName) {
    return res.status(400).json({ error: 'Student ID and Last Name are required.' });
  }
  try {
    const [rows] = await db.query(
      `SELECT s.id, s.student_id, s.last_name, s.first_name, s.middle_name, s.suffix, s.gender, s.address, s.contact_number, s.email, s.year_level, s.course_id, c.name as course_name, c.code as course_code
       FROM students s
       JOIN courses c ON s.course_id = c.id
       WHERE s.student_id = ? AND s.last_name = ? LIMIT 1`,
      [studentId, lastName]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const student = rows[0];
    // You may want to keep the eligibility check
    const token = jwt.sign(
      {
        id: student.id, // numeric id
        student_id: student.student_id, // string id
        role: 'student',
        year_level: student.year_level,
        course_id: student.course_id,
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({
      token,
      user: {
        id: student.id,
        student_id: student.student_id,
        last_name: student.last_name,
        first_name: student.first_name,
        middle_name: student.middle_name,
        suffix: student.suffix,
        gender: student.gender,
        address: student.address,
        contact_number: student.contact_number,
        email: student.email,
        year_level: student.year_level,
        course_id: student.course_id,
        course_name: student.course_name,
        course_code: student.course_code,
        role: 'student',
      },
    });
  } catch (err) {
    console.error(err);
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
    const token = jwt.sign({ id: admin.id, username: admin.username, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
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
      { expiresIn: '1d' }
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
