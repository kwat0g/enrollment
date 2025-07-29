const { db } = require('../config/database');

// --- Admin: Get courses ---
const getCourses = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, code, name FROM courses');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: List subjects for a course and year level ---
const getSubjects = async (req, res) => {
  const { course_id, year_level } = req.query;
  try {
    let query = 'SELECT * FROM subjects WHERE 1=1';
    const params = [];
    if (course_id) { query += ' AND course_id = ?'; params.push(course_id); }
    if (year_level) { query += ' AND year_level = ?'; params.push(year_level); }
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Add subject ---
const createSubject = async (req, res) => {
  const { code, name, units, type, course_id, year_level, instructor } = req.body;
  const requiredFields = [
    { key: 'code', label: 'Subject code' },
    { key: 'name', label: 'Subject name' },
    { key: 'units', label: 'Units' },
    { key: 'type', label: 'Subject type' },
    { key: 'course_id', label: 'Course' },
    { key: 'year_level', label: 'Year level' }
  ];
  for (const field of requiredFields) {
    if (!req.body[field.key] || (field.key === 'units' && (isNaN(Number(req.body.units)) || Number(req.body.units) <= 0))) {
      return res.status(400).json({ error: `${field.label} is required.` });
    }
  }
  // Instructor is not strictly required, but trim it if present
  const trimmedInstructor = instructor ? instructor.toString().trim() : '';
  try {
    // Check for duplicate code with same type
    const [existing] = await db.query('SELECT * FROM subjects WHERE code = ? AND type = ?', [code.toString().trim(), type.toString().trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ error: `Subject code '${code}' already exists with type '${type}'. Please use a different code or type.` });
    }
    await db.query('INSERT INTO subjects (code, name, units, type, course_id, year_level, instructor) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [code.toString().trim(), name.toString().trim(), Number(units), type.toString().trim(), course_id, year_level, trimmedInstructor]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Edit subject ---
const updateSubject = async (req, res) => {
  const { code, name, units, instructor } = req.body;
  
  // More lenient validation - check for empty strings and convert units to number
  const trimmedCode = code ? code.toString().trim() : '';
  const trimmedName = name ? name.toString().trim() : '';
  const trimmedInstructor = instructor ? instructor.toString().trim() : '';
  
  const errors = [];
  if (!trimmedCode) {
    errors.push('Subject code is required');
  }
  
  if (!trimmedName) {
    errors.push('Subject name is required');
  }
  
  let unitsNumber;
  try {
    unitsNumber = Number(units);
  } catch (e) {
    errors.push('Units must be a valid number');
  }
  
  if (!unitsNumber || unitsNumber <= 0) {
    errors.push('Units must be a positive number');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ 
      error: `Missing required fields: ${errors.join(', ')}` 
    });
  }
  
  try {
    // Get the current subject's data for validation
    const [currentSubject] = await db.query(
      'SELECT s.*, sc.type FROM subjects s LEFT JOIN schedules sc ON s.id = sc.subject_id WHERE s.id = ?',
      [req.params.id]
    );
    
    if (!currentSubject.length) {
      return res.status(404).json({ error: 'Subject not found.' });
    }
    
    // Check for duplicate code with same type (excluding current subject)
    const [existingSubjects] = await db.query(
      'SELECT s.*, sc.type FROM subjects s LEFT JOIN schedules sc ON s.id = sc.subject_id WHERE s.code = ? AND s.id != ?',
      [trimmedCode, req.params.id]
    );
    
    if (existingSubjects.length > 0) {
      const existingSubject = existingSubjects[0];
      if (existingSubject.type === currentSubject[0].type) {
        return res.status(400).json({ 
          error: `Subject code '${trimmedCode}' already exists with the same type '${existingSubject.type}'. Please use a different code or type.` 
        });
      }
    }
    
    // Update only the basic subject fields (code, name, units, instructor)
    await db.query('UPDATE subjects SET code=?, name=?, units=?, instructor=? WHERE id=?', [trimmedCode, trimmedName, unitsNumber, trimmedInstructor, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Delete subject ---
const deleteSubject = async (req, res) => {
  try {
    // Check if subject is assigned to any section (has schedules)
    const [schedules] = await db.query('SELECT * FROM schedules WHERE subject_id = ?', [req.params.id]);
    if (schedules.length > 0) {
      return res.status(400).json({ error: 'Cannot delete subject: it is assigned to one or more sections.' });
    }
    await db.query('DELETE FROM subjects WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Get single subject ---
const getSubject = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM subjects WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Subject not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

module.exports = {
  getCourses,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubject
};
