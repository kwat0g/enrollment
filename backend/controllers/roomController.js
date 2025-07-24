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

module.exports = {
  getAllRooms,
  getRoomSchedules
};
