// Admin Course Management Controller
const { db } = require('../config/database');

// GET /api/admin/courses
const getAllCourses = async (req, res) => {
  try {
    const [courses] = await db.query('SELECT * FROM courses');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// POST /api/admin/courses
const createCourse = async (req, res) => {
  try {
    // Sanitize inputs
    const codeRaw = req.body.code;
    const nameRaw = req.body.name;
    const code = typeof codeRaw === 'string' ? codeRaw.trim() : '';
    const name = typeof nameRaw === 'string' ? nameRaw.trim() : '';
    const requiredFields = [
      { key: 'code', label: 'Course code' },
      { key: 'name', label: 'Course name' }
    ];
    for (const field of requiredFields) {
      if (!(field.key === 'code' ? code : name)) {
        return res.status(400).json({ error: `${field.label} is required.` });
      }
    }
    // Validate alphanumeric only (no spaces or special chars)
    const alnum = /^[A-Za-z0-9]+$/;
    if (!alnum.test(code)) {
      return res.status(400).json({ error: 'Course code must contain only letters and numbers.' });
    }
    if (!alnum.test(name)) {
      return res.status(400).json({ error: 'Course name must contain only letters and numbers.' });
    }
    // Check uniqueness
    const [existing] = await db.query('SELECT * FROM courses WHERE code = ?', [code]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Course code already exists.' });
    }
    await db.query('INSERT INTO courses (code, name) VALUES (?, ?)', [code, name]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// PUT /api/admin/courses/:id
const updateCourse = async (req, res) => {
  try {
    // Sanitize inputs
    const codeRaw = req.body.code;
    const nameRaw = req.body.name;
    const code = typeof codeRaw === 'string' ? codeRaw.trim() : '';
    const name = typeof nameRaw === 'string' ? nameRaw.trim() : '';
    const { id } = req.params;
    const requiredFields = [
      { key: 'code', label: 'Course code' },
      { key: 'name', label: 'Course name' }
    ];
    for (const field of requiredFields) {
      if (!(field.key === 'code' ? code : name)) {
        return res.status(400).json({ error: `${field.label} is required.` });
      }
    }
    // Validate alphanumeric only (no spaces or special chars)
    const alnum = /^[A-Za-z0-9]+$/;
    if (!alnum.test(code)) {
      return res.status(400).json({ error: 'Course code must contain only letters and numbers.' });
    }
    if (!alnum.test(name)) {
      return res.status(400).json({ error: 'Course name must contain only letters and numbers.' });
    }
    // Check uniqueness (ignore self)
    const [existing] = await db.query('SELECT * FROM courses WHERE code = ? AND id != ?', [code, id]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Course code already exists.' });
    }
    await db.query('UPDATE courses SET code=?, name=? WHERE id=?', [code, name, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// DELETE /api/admin/courses/:id
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    // Prevent delete if any sections reference this course
    const [rows] = await db.query('SELECT COUNT(*) AS cnt FROM sections WHERE course_id = ?', [id]);
    if (rows && rows[0] && rows[0].cnt > 0) {
      return res.status(409).json({ error: 'Cannot delete this course because it is used by one or more sections.' });
    }
    await db.query('DELETE FROM courses WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) {
    // Gracefully map FK errors from the DB driver if any slip through
    if (err && (err.code === 'ER_ROW_IS_REFERENCED' || err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451)) {
      return res.status(409).json({ error: 'Cannot delete this course because it is used by one or more sections.' });
    }
    console.error('deleteCourse error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
};
