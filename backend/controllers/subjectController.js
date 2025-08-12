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
  const { code, name, units, type, course_id, year_level } = req.body;
  // Accept multiple aliases just in case frontend sends different key
  let categoryRaw = (req.body.category ?? req.body.subject_category ?? req.body.kind);
  if (typeof req.body.is_major === 'boolean') {
    categoryRaw = req.body.is_major ? 'major' : 'minor';
  }
  const category = typeof categoryRaw === 'string' ? categoryRaw.trim().toLowerCase() : undefined;
  // Debug log to trace branch selection
  console.log('[createSubject] body:', req.body, 'resolved category:', category);

  // Helper to map '1st'/'2nd'/'3rd'/'4th' -> '1'|'2'|'3'|'4'
  const yearDigit = (yl) => {
    if (!yl) return '';
    const m = String(yl).match(/(1st|2nd|3rd|4th|\b[1-4]\b)/i);
    if (!m) return '';
    const v = m[0].toLowerCase();
    if (v.startsWith('1')) return '1';
    if (v.startsWith('2')) return '2';
    if (v.startsWith('3')) return '3';
    if (v.startsWith('4')) return '4';
    return '';
  };

  // If a category is provided, we follow the new auto-creation flow
  if (category === 'major' || category === 'minor') {
    if (!name || !course_id || !year_level) {
      return res.status(400).json({ error: 'Name, course_id and year_level are required.' });
    }
    try {
      // Fetch course code
      const [[courseRow]] = await db.query('SELECT code FROM courses WHERE id = ?', [course_id]);
      if (!courseRow) return res.status(400).json({ error: 'Invalid course_id.' });
      const courseCode = String(courseRow.code || '').toUpperCase();
      // Prefix: last two letters of course code (letters only)
      const letters = courseCode.replace(/[^A-Z]/g, '');
      const prefix = letters.slice(-2) || letters || 'SB';
      const yd = yearDigit(year_level);
      if (!yd) return res.status(400).json({ error: 'Invalid year_level format.' });

      // Find next sequence NN for code like PREFIX + Y + NN (e.g., IT301)
      const likePattern = `${prefix}${yd}%`;
      const [rows] = await db.query(
        'SELECT code FROM subjects WHERE course_id = ? AND year_level = ? AND code LIKE ?',[course_id, year_level, likePattern]
      );
      let maxSeq = 0;
      const re = new RegExp(`^${prefix}${yd}(\\d{2})$`);
      for (const r of rows) {
        const m = String(r.code).toUpperCase().match(re);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxSeq) maxSeq = n;
        }
      }
      const nextSeq = String(maxSeq + 1).padStart(2, '0');
      const genCode = `${prefix}${yd}${nextSeq}`;

      if (category === 'major') {
        // Create Lec(1) and Lab(2) in a transaction
        const conn = await db.getConnection();
        try {
          await conn.beginTransaction();
          await conn.query('INSERT INTO subjects (code, name, units, type, course_id, year_level) VALUES (?, ?, ?, ?, ?, ?)',
            [genCode, String(name).trim(), 1, 'Lec', course_id, year_level]);
          await conn.query('INSERT INTO subjects (code, name, units, type, course_id, year_level) VALUES (?, ?, ?, ?, ?, ?)',
            [genCode, String(name).trim(), 2, 'Lab', course_id, year_level]);
          await conn.commit();
          conn.release();
          return res.json({ success: true, code: genCode, created: [{ type: 'Lec', units: 1 }, { type: 'Lab', units: 2 }] });
        } catch (e) {
          try { await conn.rollback(); } catch (_) {}
          try { conn.release(); } catch (_) {}
          return res.status(500).json({ error: e.message || 'Failed to create major subject.' });
        }
      } else {
        // Minor: admin must provide code, must NOT look like a major code
        const providedCode = (req.body.code || '').toString().trim().toUpperCase();
        if (!providedCode) {
          return res.status(400).json({ error: 'Subject code is required for minor subjects.' });
        }
        // Reject codes that match the major auto-generated pattern for this course/year (e.g., IT301)
        const majorLikeRe = new RegExp(`^${prefix}${yd}\\d{2}$`);
        if (majorLikeRe.test(providedCode)) {
          return res.status(400).json({ error: `Subject code '${providedCode}' is reserved for major subjects. Please use a different code format for minor.` });
        }
        // Ensure no duplicate with type Lec for same course/year and code
        const [exists] = await db.query('SELECT id FROM subjects WHERE code = ? AND type = ? AND course_id = ? AND year_level = ?', [providedCode, 'Lec', course_id, year_level]);
        if (exists.length) {
          return res.status(400).json({ error: `Subject code '${providedCode}' already exists.` });
        }
        await db.query('INSERT INTO subjects (code, name, units, type, course_id, year_level) VALUES (?, ?, ?, ?, ?, ?)',
          [providedCode, String(name).trim(), 3, 'Lec', course_id, year_level]);
        return res.json({ success: true, code: providedCode, created: [{ type: 'Lec', units: 3 }] });
      }
    } catch (err) {
      console.error('createSubject(category flow) error:', err, 'body:', req.body);
      return res.status(500).json({ error: err.message || 'Server error.' });
    }
  }

  // Fallback: preserve existing explicit creation behavior
  // If neither category nor explicit fields are present, guide the client
  if (!category && (!code || !type || !units)) {
    return res.status(400).json({
      error: 'Please select subject category (major/minor) and provide name, course_id, year_level — or send explicit code, type, units.'
    });
  }
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
      console.error('createSubject(explicit) missing field:', field.label, 'body:', req.body);
      return res.status(400).json({ error: `${field.label} is required.` });
    }
  }
  try {
    const [existing] = await db.query('SELECT * FROM subjects WHERE code = ? AND type = ? AND course_id = ? AND year_level = ?', [code.toString().trim(), type.toString().trim(), course_id, year_level]);
    if (existing.length > 0) {
      return res.status(400).json({ error: `Subject code '${code}' already exists with type '${type}'. Please use a different code or type.` });
    }
    await db.query('INSERT INTO subjects (code, name, units, type, course_id, year_level) VALUES (?, ?, ?, ?, ?, ?)', 
      [code.toString().trim(), name.toString().trim(), Number(units), type.toString().trim(), course_id, year_level]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Edit subject ---
const updateSubject = async (req, res) => {
  const { code, name, units } = req.body;
  
  // More lenient validation - check for empty strings and convert units to number
  const trimmedCode = code ? code.toString().trim() : '';
  const trimmedName = name ? name.toString().trim() : '';
  
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
    
    // Update only the basic subject fields (code, name, units)
    await db.query('UPDATE subjects SET code=?, name=?, units=? WHERE id=?', [trimmedCode, trimmedName, unitsNumber, req.params.id]);
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
