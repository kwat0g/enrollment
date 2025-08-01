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
    const { code, name } = req.body;
    const requiredFields = [
      { key: 'code', label: 'Course code' },
      { key: 'name', label: 'Course name' }
    ];
    for (const field of requiredFields) {
      if (!req.body[field.key]) {
        return res.status(400).json({ error: `${field.label} is required.` });
      }
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
    const { code, name } = req.body;
    const { id } = req.params;
    const requiredFields = [
      { key: 'code', label: 'Course code' },
      { key: 'name', label: 'Course name' }
    ];
    for (const field of requiredFields) {
      if (!req.body[field.key]) {
        return res.status(400).json({ error: `${field.label} is required.` });
      }
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
    await db.query('DELETE FROM courses WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
};
