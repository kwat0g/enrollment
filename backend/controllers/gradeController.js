const { db } = require('../config/database');

// --- Admin: Get all grades ---
const getAllGrades = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT g.*, fe.student_id, fe.first_name, fe.last_name, sub.code as subject_code, sub.name as subject_name
      FROM grades g
      JOIN freshman_enrollments fe ON g.student_id = fe.id
      JOIN subjects sub ON g.subject_id = sub.id
      ORDER BY g.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Create grade ---
const createGrade = async (req, res) => {
  const { student_id, subject_id, school_year, semester, grade } = req.body;
  if (!student_id || !subject_id || !school_year || !semester || grade === undefined) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  try {
    await db.query(
      'INSERT INTO grades (student_id, subject_id, school_year, semester, grade, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [student_id, subject_id, school_year, semester, grade]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Update grade ---
const updateGrade = async (req, res) => {
  const { student_id, subject_id, school_year, semester, grade } = req.body;
  if (!student_id || !subject_id || !school_year || !semester || grade === undefined) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  try {
    await db.query(
      'UPDATE grades SET student_id = ?, subject_id = ?, school_year = ?, semester = ?, grade = ? WHERE id = ?',
      [student_id, subject_id, school_year, semester, grade, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Delete grade ---
const deleteGrade = async (req, res) => {
  try {
    await db.query('DELETE FROM grades WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Get grade statistics ---
const getGradeStatistics = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT subject_id, AVG(grade) as avg_grade FROM grades GROUP BY subject_id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

module.exports = {
  getAllGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  getGradeStatistics
};
