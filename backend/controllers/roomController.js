const { db } = require('../config/database');

// --- Admin: Get all rooms ---
const getAllRooms = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name FROM rooms ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Get all schedules for a room (optionally filtered by day) ---
const getRoomSchedules = async (req, res) => {
  const roomName = req.params.roomName;
  const { day } = req.query;
  try {
    // Find room id
    const [roomRows] = await db.query('SELECT id FROM rooms WHERE name = ?', [roomName]);
    if (!roomRows.length) return res.json([]);
    const roomId = roomRows[0].id;
    // Get all schedules for this room (optionally filter by day)
    let query = 'SELECT s.*, sub.code as subject_code, sub.name as subject_name, sec.name as section_name FROM schedules s LEFT JOIN subjects sub ON s.subject_id = sub.id LEFT JOIN sections sec ON s.section_id = sec.id WHERE s.room_id = ?';
    const params = [roomId];
    if (day) {
      query += ' AND s.day = ?';
      params.push(day);
    }
    const [schedules] = await db.query(query, params);
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Create room ---
const createRoom = async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Room name is required.' });
  try {
    // Check uniqueness
    const [rows] = await db.query('SELECT id FROM rooms WHERE name = ?', [name.trim()]);
    if (rows.length) return res.status(400).json({ error: 'Room name already exists.' });
    await db.query('INSERT INTO rooms (name) VALUES (?)', [name.trim()]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Update room ---
const updateRoom = async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Room name is required.' });
  try {
    // Check uniqueness (excluding current room)
    const [rows] = await db.query('SELECT id FROM rooms WHERE name = ? AND id != ?', [name.trim(), req.params.id]);
    if (rows.length) return res.status(400).json({ error: 'Room name already exists.' });
    await db.query('UPDATE rooms SET name = ? WHERE id = ?', [name.trim(), req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Delete room ---
const deleteRoom = async (req, res) => {
  try {
    // Check if any schedules exist for this room
    const [schedules] = await db.query('SELECT id FROM schedules WHERE room_id = ?', [req.params.id]);
    if (schedules.length > 0) {
      return res.status(400).json({ error: 'This room cannot be deleted because it is currently assigned to one or more sections or schedules.' });
    }
    await db.query('DELETE FROM rooms WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    // Handle MySQL foreign key constraint error
    if (
      (err && (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451)) ||
      /foreign key constraint/i.test(err.message)
    ) {
      return res.status(400).json({ error: 'This room cannot be deleted because it is currently assigned to one or more sections or schedules.' });
    }
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

module.exports = {
  getAllRooms,
  getRoomSchedules,
  createRoom,
  updateRoom,
  deleteRoom
};
