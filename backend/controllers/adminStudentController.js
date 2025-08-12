// Admin Student Management Controller
const { db } = require('../config/database');

// Normalize year level to strict tokens: '1st' | '2nd' | '3rd' | '4th'
function normalizeYearLevel(v) {
  if (v == null) return null;
  const s = String(v).toLowerCase().trim();
  const digitMatch = s.match(/(1st|2nd|3rd|4th)|\b([1-4])\b/);
  if (digitMatch) {
    const g1 = digitMatch[1];
    const g2 = digitMatch[2];
    if (g1) return g1.replace(/\s*year$/, '').trim();
    if (g2) {
      const n = Number(g2);
      return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : '4th';
    }
  }
  if (/(first)/.test(s)) return '1st';
  if (/(second)/.test(s)) return '2nd';
  if (/(third)/.test(s)) return '3rd';
  if (/(fourth|forth)/.test(s)) return '4th';
  const stripped = s.replace(/year/gi, '').trim();
  if (/^1$/.test(stripped)) return '1st';
  if (/^2$/.test(stripped)) return '2nd';
  if (/^3$/.test(stripped)) return '3rd';
  if (/^4$/.test(stripped)) return '4th';
  return s;
}

// GET /api/admin/students
const getAllStudents = async (req, res) => {
  try {
    const [students] = await db.query(
      `SELECT s.id, s.student_id, s.first_name, s.last_name, s.middle_name, s.suffix, s.gender, s.address, s.contact_number, s.email, s.course_id, s.year_level, c.name as course_name
       FROM students s
       LEFT JOIN courses c ON s.course_id = c.id`
    );
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// POST /api/admin/students
const createStudent = async (req, res) => {
  try {
    const { student_id, first_name, last_name, middle_name, suffix, gender, address, contact_number, email, course_id, year_level } = req.body;
    const requiredFields = [
      { key: 'student_id', label: 'Student ID' },
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'middle_name', label: 'Middle Name' },
      { key: 'gender', label: 'Gender' },
      { key: 'address', label: 'Address' },
      { key: 'contact_number', label: 'Contact Number' },
      { key: 'email', label: 'Email' },
      { key: 'course_id', label: 'Course' },
      { key: 'year_level', label: 'Year Level' }
    ];
    for (const field of requiredFields) {
      if (!req.body[field.key]) {
        return res.status(400).json({ error: `${field.label} is required.` });
      }
    }
    await db.query(
      'INSERT INTO students (student_id, first_name, last_name, middle_name, suffix, gender, address, contact_number, email, course_id, year_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [student_id, first_name, last_name, middle_name, suffix || '', gender, address, contact_number, email, course_id, normalizeYearLevel(year_level)]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// PUT /api/admin/students/:student_id
const updateStudent = async (req, res) => {
  try {
    const { first_name, last_name, middle_name, suffix, gender, address, contact_number, email, course_id, year_level } = req.body;
    const { student_id } = req.params;
    if (!first_name || !last_name || !middle_name || !gender || !address || !contact_number || !email || !course_id || !year_level) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    await db.query(
      'UPDATE students SET first_name=?, last_name=?, middle_name=?, suffix=?, gender=?, address=?, contact_number=?, email=?, course_id=?, year_level=? WHERE student_id=?',
      [first_name, last_name, middle_name, suffix || '', gender, address, contact_number, email, course_id, normalizeYearLevel(year_level), student_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// DELETE /api/admin/students/:student_id
const deleteStudent = async (req, res) => {
  try {
    const { student_id } = req.params;
    await db.query('DELETE FROM students WHERE student_id=?', [student_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// GET /api/admin/students/next-id
const getNextStudentId = async (req, res) => {
  try {
    // Find the maximum student_id that starts with 2025-
    const [rows] = await db.query(
      "SELECT student_id FROM students WHERE student_id LIKE '2025-%' ORDER BY student_id DESC LIMIT 1"
    );
    let nextId;
    let lastNum = 0;
    if (rows.length > 0) {
      const lastId = rows[0].student_id;
      lastNum = parseInt(lastId.slice(5), 10);
      // If lastNum is less than 1, start at 1
      if (lastNum < 1) {
        lastNum = 1;
      } else {
        lastNum += 1;
      }
    } else {
      lastNum = 1;
    }
    nextId = `2025-${lastNum.toString().padStart(5, '0')}`;
    res.json({ nextId });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getNextStudentId,
};
