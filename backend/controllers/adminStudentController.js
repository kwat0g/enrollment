// Admin Student Management Controller
const { db } = require('../config/database');

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
      [student_id, first_name, last_name, middle_name, suffix || '', gender, address, contact_number, email, course_id, year_level]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// PUT /api/admin/students/:student_id
const updateStudent = async (req, res) => {
  try {
    const { first_name, last_name, course_id, year_level } = req.body;
    const { student_id } = req.params;
    if (!first_name || !last_name || !course_id || !year_level) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    await db.query(
      'UPDATE students SET first_name=?, last_name=?, course_id=?, year_level=? WHERE student_id=?',
      [first_name, last_name, course_id, year_level, student_id]
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
