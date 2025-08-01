const { db } = require('../config/database');

// --- Admin: Get all rooms ---
const getAllRooms = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, capacity, type, facilities, status FROM rooms ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Get all schedules for a room (optionally filtered by day) ---
const getRoomSchedules = async (req, res) => {
  const roomIdentifier = req.params.id; // Can be room ID or room name
  const { day } = req.query;
  
  try {
    // Try to find room by name first (since frontend sends room names)
    let roomQuery = 'SELECT id, name FROM rooms WHERE name = ?';
    let roomParams = [roomIdentifier];
    
    let [roomRows] = await db.query(roomQuery, roomParams);
    
    // If not found by name and identifier is numeric, try by ID
    if (!roomRows.length && !isNaN(roomIdentifier)) {
      roomQuery = 'SELECT id, name FROM rooms WHERE id = ?';
      roomParams = [parseInt(roomIdentifier)];
      [roomRows] = await db.query(roomQuery, roomParams);
    }
    
    if (!roomRows.length) {
      return res.json([]);
    }
    
    const room = roomRows[0];
    const roomId = room.id;
    
    // Get all schedules for this room (optionally filter by day)
    let query = `
      SELECT s.*, 
             sub.code as subject_code, 
             sub.name as subject_name, 
             sec.name as section_name 
      FROM schedules s 
      LEFT JOIN subjects sub ON s.subject_id = sub.id 
      LEFT JOIN sections sec ON s.section_id = sec.id 
      WHERE s.room_id = ?
    `;
    
    const params = [roomId];
    if (day) {
      query += ' AND s.day = ?';
      params.push(day);
    }
    
    console.log('Final query:', query);
    console.log('Query params:', params);
    
    const [schedules] = await db.query(query, params);
    
    res.json(schedules);
  } catch (err) {
    console.error('Error in getRoomSchedules:', err);
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Create room ---
const createRoom = async (req, res) => {
  let { name, capacity, type, facilities, status } = req.body;
  // Per-field validation
  if (!name || !name.trim()) return res.status(400).json({ error: 'Room name is required.' });
  if (capacity == null || isNaN(Number(capacity)) || Number(capacity) < 1) return res.status(400).json({ error: 'Room capacity must be a positive number.' });
  if (!type || !type.trim()) return res.status(400).json({ error: 'Room type is required.' });
  if (facilities == null) facilities = '';
  if (!status) status = 'active';
  if (!['active', 'inactive'].includes(status)) return res.status(400).json({ error: 'Room status must be active or inactive.' });
  try {
    // Check uniqueness
    const [rows] = await db.query('SELECT id FROM rooms WHERE name = ?', [name.trim()]);
    if (rows.length) return res.status(400).json({ error: 'Room name already exists.' });
    await db.query('INSERT INTO rooms (name, capacity, type, facilities, status) VALUES (?, ?, ?, ?, ?)', [name.trim(), Number(capacity), type.trim(), facilities.toString(), status]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Update room ---
const updateRoom = async (req, res) => {
  let { name, capacity, type, facilities, status } = req.body;
  // Per-field validation
  if (!name || !name.trim()) return res.status(400).json({ error: 'Room name is required.' });
  if (capacity == null || isNaN(Number(capacity)) || Number(capacity) < 1) return res.status(400).json({ error: 'Room capacity must be a positive number.' });
  if (!type || !type.trim()) return res.status(400).json({ error: 'Room type is required.' });
  if (facilities == null) facilities = '';
  if (!status) status = 'active';
  if (!['active', 'inactive'].includes(status)) return res.status(400).json({ error: 'Room status must be active or inactive.' });
  try {
    // Check uniqueness (excluding current room)
    const [rows] = await db.query('SELECT id FROM rooms WHERE name = ? AND id != ?', [name.trim(), req.params.id]);
    if (rows.length) return res.status(400).json({ error: 'Room name already exists.' });
    await db.query('UPDATE rooms SET name = ?, capacity = ?, type = ?, facilities = ?, status = ? WHERE id = ?', [name.trim(), Number(capacity), type.trim(), facilities.toString(), status, req.params.id]);
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
