const { db } = require('../config/database');

// --- Admin: Get all accountabilities ---
const getAllAccountabilities = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM accountabilities ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Create accountability ---
const createAccountability = async (req, res) => {
  const { student_id, type, description, status, amount } = req.body;
  if (!student_id || !type || !description || !status) return res.status(400).json({ error: 'Missing required fields.' });
  try {
    await db.query(
      'INSERT INTO accountabilities (student_id, type, description, status, amount, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [student_id, type, description, status, amount || 0]
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

module.exports = {
  getAllAccountabilities,
  createAccountability,
  updateAccountability,
  deleteAccountability
};
