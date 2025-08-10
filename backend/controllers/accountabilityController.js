const { db } = require('../config/database');

// --- Admin: Get all accountabilities ---
const getAllAccountabilities = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, s.student_id AS student_id_str, s.first_name, s.last_name
      FROM accountabilities a
      LEFT JOIN students s ON a.student_id = s.id
      ORDER BY a.id DESC
    `);
    // For backward compatibility, set student_id to string value for frontend
    const result = rows.map(row => ({
      ...row,
      student_id: row.student_id_str || row.student_id
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Create accountability ---
const createAccountability = async (req, res) => {
  const { student_id, type, description, status } = req.body;
  const amount = req.body.amount ?? 0;
  const requiredFields = [
    { key: 'student_id', label: 'Student' },
    { key: 'type', label: 'Type' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status' }
  ];
  for (const field of requiredFields) {
    if (!req.body[field.key]) {
      return res.status(400).json({ error: `${field.label} is required.` });
    }
  }

  try {
    // Resolve student identifier: accept numeric students.id or string students.student_id
    let resolvedStudentId = null;

    // If numeric, use directly
    if (String(student_id).trim() !== '' && !isNaN(Number(student_id))) {
      resolvedStudentId = Number(student_id);
      // Ensure student exists
      const [check] = await db.query('SELECT id FROM students WHERE id = ?', [resolvedStudentId]);
      if (!check.length) return res.status(400).json({ error: 'Student not found.' });
    } else {
      // Treat as string student_id (e.g., '2025-00001') and resolve to students.id
      const [rows] = await db.query('SELECT id FROM students WHERE student_id = ?', [String(student_id)]);
      if (!rows.length) return res.status(400).json({ error: 'Student not found.' });
      resolvedStudentId = rows[0].id;
    }

    // Basic validation/coercion for amount
    const amt = Number(amount) || 0;

    await db.query(
      'INSERT INTO accountabilities (student_id, type, description, status, amount) VALUES (?, ?, ?, ?, ?)',
      [resolvedStudentId, type, description, status, amt]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Update accountability ---
const updateAccountability = async (req, res) => {
  const { type, description, status, amount } = req.body;
  if (!type || !description || !status) return res.status(400).json({ error: 'Missing required fields.' });
  try {
    await db.query(
      'UPDATE accountabilities SET type = ?, description = ?, status = ?, amount = ? WHERE id = ?',
      [type, description, status, amount || 0, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Delete accountability ---
const deleteAccountability = async (req, res) => {
  try {
    await db.query('DELETE FROM accountabilities WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Mark accountability as cleared ---
const clearAccountability = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE accountabilities SET status = ? WHERE id = ?', ['cleared', id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

module.exports = {
  getAllAccountabilities,
  createAccountability,
  updateAccountability,
  deleteAccountability,
  clearAccountability
};
