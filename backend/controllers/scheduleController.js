const { db } = require('../config/database');
const { getSectionEnrollmentStatus } = require('../utils/helpers');

// --- Admin: Assign subjects to a section (Enhanced) ---
const assignSubjectsToSection = async (req, res) => {
  const { subjectIds, validateOnly = false, mode = 'add', instructors = {} } = req.body;
  const sectionId = req.params.sectionId;
  
  try {
    // Enhanced validation
    if (!sectionId || isNaN(sectionId)) {
      return res.status(400).json({ error: 'Invalid section ID provided.' });
    }
    
    if (!Array.isArray(subjectIds)) {
      return res.status(400).json({ error: 'Subject IDs must be provided as an array.' });
    }

    // Get section info with course details
    const [sectionRows] = await db.query(
      `SELECT s.*, c.name as course_name, c.code as course_code 
       FROM sections s 
       JOIN courses c ON s.course_id = c.id 
       WHERE s.id = ?`, 
      [sectionId]
    );
    if (!sectionRows.length) {
      return res.status(404).json({ error: 'Section not found.' });
    }
    const section = sectionRows[0];
    
    // Enhanced status checks
    if (section.status === 'open') {
      return res.status(400).json({ 
        error: 'Cannot modify subjects: section is currently open for enrollment.',
        details: 'Close the section first to make changes.'
      });
    }
    
    // Check enrollment status with more detailed feedback
    const studentsEnrolled = await getSectionEnrollmentStatus(sectionId);
    if (studentsEnrolled === 'approved') {
      const [enrolledCount] = await db.query(
        'SELECT COUNT(*) as count FROM enrollments WHERE section_id = ? AND status = "approved"',
        [sectionId]
      );
      return res.status(400).json({ 
        error: 'Cannot modify subjects: students are already enrolled in this section.',
        details: `${enrolledCount[0].count} student(s) currently enrolled.`
      });
    }
    if (studentsEnrolled === 'pending') {
      const [pendingCount] = await db.query(
        'SELECT COUNT(*) as count FROM enrollments WHERE section_id = ? AND status = "pending"',
        [sectionId]
      );
      return res.status(400).json({ 
        error: 'Cannot modify subjects: there are pending enrollments for this section.',
        details: `${pendingCount[0].count} pending enrollment(s) found.`
      });
    }
    
    // Get current subjects with detailed info
    const [currentSchedules] = await db.query(
      `SELECT DISTINCT s.subject_id, sub.code, sub.name 
       FROM schedules s 
       JOIN subjects sub ON s.subject_id = sub.id 
       WHERE s.section_id = ?`, 
      [sectionId]
    );
    const currentSubjectIds = currentSchedules.map(s => s.subject_id);
    const newSubjectIds = subjectIds || [];
    
    // Enhanced subject validation
    if (newSubjectIds.length > 0) {
      const [subjects] = await db.query(
        'SELECT * FROM subjects WHERE id IN (?)',
        [newSubjectIds]
      );
      
      if (subjects.length !== newSubjectIds.length) {
        const foundIds = subjects.map(s => s.id);
        const missingIds = newSubjectIds.filter(id => !foundIds.includes(id));
        return res.status(400).json({ 
          error: 'Some subjects were not found.',
          details: `Missing subject IDs: ${missingIds.join(', ')}`
        });
      }
      
      // Check subject compatibility with enhanced feedback
      const incompatibleSubjects = subjects.filter(subject => 
        subject.year_level !== section.year_level || subject.course_id !== section.course_id
      );
      
      if (incompatibleSubjects.length > 0) {
        const details = incompatibleSubjects.map(s => 
          `${s.code} (Year ${s.year_level}, Course ID ${s.course_id})`
        ).join(', ');
        return res.status(400).json({ 
          error: `Subjects incompatible with section (${section.course_code} Year ${section.year_level}).`,
          details: `Incompatible subjects: ${details}`
        });
      }
      
      // Check for duplicate subjects within the same section
      const duplicates = newSubjectIds.filter((id, index) => newSubjectIds.indexOf(id) !== index);
      if (duplicates.length > 0) {
        return res.status(400).json({ 
          error: 'Duplicate subjects detected in assignment.',
          details: `Duplicate subject IDs: ${duplicates.join(', ')}`
        });
      }
    }
    
    // If validation only, return success
    if (validateOnly) {
      return res.json({ 
        valid: true, 
        message: 'Subjects are valid for assignment.',
        section: {
          id: section.id,
          name: section.name,
          course: section.course_name,
          year_level: section.year_level
        }
      });
    }
    
    // Determine changes with detailed tracking
    // FIX: Change logic to be additive (only add new subjects) to prevent NULL values in existing subjects
    let toRemove = [];
    let toAdd = [];
    let unchanged = [];
    
    if (mode === 'replace') {
      // Only use replacement mode when explicitly requested (e.g., from edit modal)
      toRemove = currentSubjectIds.filter(id => !newSubjectIds.includes(id));
      toAdd = newSubjectIds.filter(id => !currentSubjectIds.includes(id));
      unchanged = currentSubjectIds.filter(id => newSubjectIds.includes(id));
    } else {
      // Default additive mode: only add new subjects, don't remove existing ones
      toRemove = []; // Don't remove any existing subjects
      toAdd = newSubjectIds.filter(id => !currentSubjectIds.includes(id));
      unchanged = currentSubjectIds; // All existing subjects remain unchanged
    }
    
    // Transaction for atomic operations
    await db.query('START TRANSACTION');
    
    try {
      // Remove schedules for subjects being removed (only in replace mode)
      if (toRemove.length > 0) {
        const [removedSubjects] = await db.query(
          'SELECT code, name FROM subjects WHERE id IN (?)',
          [toRemove]
        );
        
        for (const subjectId of toRemove) {
          await db.query('DELETE FROM schedules WHERE section_id = ? AND subject_id = ?', [sectionId, subjectId]);
        }
      }

      // Add new subjects with enhanced template logic
      const addedSubjects = [];
      if (toAdd.length > 0) {
        const [subjects] = await db.query(
          'SELECT * FROM subjects WHERE id IN (?)',
          [toAdd]
        );
        
        for (const subject of subjects) {
          // Enhanced template search - look for similar subjects first
          let scheduleTemplate = null;
          
          // 1. Try exact subject template
          const [exactTemplate] = await db.query(
            'SELECT * FROM schedules WHERE subject_id = ? AND section_id = 0 LIMIT 1',
            [subject.id]
          );
          
          if (exactTemplate.length > 0) {
            scheduleTemplate = exactTemplate[0];
          } else {
            // 2. Try similar subject in same course/year
            const [similarTemplate] = await db.query(
              `SELECT sch.* FROM schedules sch 
               JOIN subjects sub ON sch.subject_id = sub.id 
               WHERE sub.course_id = ? AND sub.year_level = ? AND sub.type = ? 
               AND sch.section_id = 0 
               ORDER BY sch.id DESC LIMIT 1`,
              [subject.course_id, subject.year_level, subject.type]
            );
            
            if (similarTemplate.length > 0) {
              scheduleTemplate = similarTemplate[0];
            }
          }

          // Use template data or intelligent defaults
          const room_id = scheduleTemplate ? scheduleTemplate.room_id : null;
          const day = scheduleTemplate ? scheduleTemplate.day : '';
          const start_time = scheduleTemplate ? scheduleTemplate.start_time : '';
          const end_time = scheduleTemplate ? scheduleTemplate.end_time : '';
          const type = scheduleTemplate ? scheduleTemplate.type : subject.type || 'Lec';

          // Enhanced conflict checking
          if (room_id && day && start_time && end_time) {
            const conflictMsg = await checkRoomScheduleConflict(room_id, day, start_time, end_time, sectionId);
            if (conflictMsg) {
              await db.query('ROLLBACK');
              return res.status(400).json({ 
                error: `Schedule conflict for ${subject.code}: ${conflictMsg}`,
                subject: subject.code
              });
            }
          }

          // Get instructor for this subject (if provided)
          const instructor = instructors[subject.id] || '';
          
          // Insert schedule
          await db.query(
            'INSERT INTO schedules (section_id, subject_id, room_id, day, start_time, end_time, type, instructor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [sectionId, subject.id, room_id, day, start_time, end_time, type, instructor]
          );
          
          addedSubjects.push({
            id: subject.id,
            code: subject.code,
            name: subject.name,
            hasTemplate: !!scheduleTemplate
          });
        }
      }
      
      await db.query('COMMIT');
      
      // Return detailed success response
      res.json({ 
        success: true,
        changes: {
          added: addedSubjects.length,
          removed: toRemove.length,
          unchanged: unchanged.length
        },
        details: {
          addedSubjects,
          message: `Successfully updated section assignments. ${addedSubjects.length} subjects added, ${toRemove.length} removed.`
        }
      });
      
    } catch (transactionErr) {
      await db.query('ROLLBACK');
      throw transactionErr;
    }
    
  } catch (err) {
    console.error('Error in assignSubjectsToSection:', err);
    res.status(500).json({ 
      error: 'Server error occurred while assigning subjects.',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Please try again later.'
    });
  }
};

// --- Admin: Remove a single subject from a section ---
const removeSubjectFromSection = async (req, res) => {
  const sectionId = req.params.sectionId;
  const subjectId = req.params.subjectId;
  
  try {
    // Get section info
    const [sectionRows] = await db.query('SELECT * FROM sections WHERE id = ?', [sectionId]);
    if (!sectionRows.length) {
      return res.status(404).json({ error: 'Section not found.' });
    }
    const section = sectionRows[0];

    // Check if section is open - prevent removing subjects if open
    if (section.status === 'open') {
      return res.status(400).json({ error: 'Cannot remove subject: section is currently open for enrollment.' });
    }

    // Check if students are enrolled or pending
    const studentsEnrolled = await getSectionEnrollmentStatus(sectionId);
    if (studentsEnrolled === 'approved') {
      return res.status(400).json({ error: 'Cannot remove subject: students are already enrolled in this section for the current term.' });
    }
    if (studentsEnrolled === 'pending') {
      return res.status(400).json({ error: 'Cannot remove subject: there are pending enrollments for this section in the current term.' });
    }

    // Check if subject is assigned to this section
    const [schedules] = await db.query('SELECT * FROM schedules WHERE section_id = ? AND subject_id = ?', [sectionId, subjectId]);
    const isAssigned = schedules.length > 0;
    if (!isAssigned) {
      return res.status(404).json({ error: 'Subject not assigned to this section.' });
    }

    // Delete the schedule row for this section/subject
    await db.query('DELETE FROM schedules WHERE section_id = ? AND subject_id = ?', [sectionId, subjectId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Clean up mismatched schedules (utility endpoint) ---
const cleanupMismatchedSchedules = async (req, res) => {
  try {
    // Delete schedules where subject's year_level or course_id does not match the section
    const [result] = await db.query(`
      DELETE sc FROM schedules sc
      JOIN subjects sub ON sc.subject_id = sub.id
      JOIN sections sec ON sc.section_id = sec.id
      WHERE sub.year_level != sec.year_level OR sub.course_id != sec.course_id
    `);
    res.json({ success: true, deleted_count: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Bulk assign schedules to a section ---
const bulkAssignSchedules = async (req, res) => {
  const sectionId = req.params.sectionId;
  const { schedules } = req.body;
  if (!Array.isArray(schedules) || schedules.length === 0) {
    return res.status(400).json({ error: 'No schedules provided.' });
  }
  try {
    for (const sched of schedules) {
      const { subject_id, day, start_time, end_time, room, type, instructor } = sched;
      if (!subject_id || !day || !start_time || !end_time || !room || !type) {
        return res.status(400).json({ error: 'Missing required schedule fields.' });
      }
      // Find or create room
      let roomId = null;
      if (room) {
        const [roomRows] = await db.query('SELECT id FROM rooms WHERE name = ?', [room]);
        if (roomRows.length) {
          roomId = roomRows[0].id;
        } else {
          const [insertResult] = await db.query('INSERT INTO rooms (name) VALUES (?)', [room]);
          roomId = insertResult.insertId;
        }
      }
      await db.query(
        'INSERT INTO schedules (section_id, subject_id, room_id, day, start_time, end_time, type, instructor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [sectionId, subject_id, roomId, day, start_time, end_time, type, instructor || '']
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// Enhanced Helper: Check for room schedule conflict
async function checkRoomScheduleConflict(roomId, day, start_time, end_time, excludeSectionId = null) {
  if (!roomId || !day || !start_time || !end_time) {
    return null; // No conflict if incomplete schedule
  }
  
  // Helper: convert HH:mm to minutes for better comparison
  const toMinutes = t => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  
  const s1 = toMinutes(start_time), e1 = toMinutes(end_time);
  
  // Validate time range
  if (s1 >= e1) {
    return 'Invalid time range: start time must be before end time.';
  }
  
  // Query existing schedules, excluding the current section if specified
  let query = 'SELECT sch.*, sec.name as section_name FROM schedules sch JOIN sections sec ON sch.section_id = sec.id WHERE sch.room_id = ? AND sch.day = ?';
  let params = [roomId, day];
  
  if (excludeSectionId) {
    query += ' AND sch.section_id != ?';
    params.push(excludeSectionId);
  }
  
  const [existingSchedules] = await db.query(query, params);
  
  for (const existing of existingSchedules) {
    const s2 = toMinutes(existing.start_time), e2 = toMinutes(existing.end_time);
    
    // Check for time overlap (with 15-minute buffer for room transitions)
    const bufferMinutes = 15;
    if ((s1 < e2 + bufferMinutes) && (s2 < e1 + bufferMinutes)) {
      const [roomInfo] = await db.query('SELECT name FROM rooms WHERE id = ?', [roomId]);
      const roomName = roomInfo[0]?.name || `Room ID ${roomId}`;
      
      return `Schedule conflict in ${roomName} on ${day.toUpperCase()}: ` +
             `${existing.section_name} is scheduled from ${existing.start_time} to ${existing.end_time}. ` +
             `Please choose a different time slot (consider 15-minute buffer for transitions).`;
    }
  }
  
  return null; // No conflict
}

// --- Admin: Assign subjects to a section with schedules (robust, partial update) ---
const assignWithSchedules = async (req, res) => {
  const sectionId = req.params.sectionId;
  const { subjectIds, schedules, mode = 'add', instructors = {} } = req.body;
  
  if (!Array.isArray(subjectIds) || subjectIds.length === 0 || !Array.isArray(schedules) || schedules.length === 0) {
    return res.status(400).json({ error: 'Subjects and schedules are required.' });
  }
  try {
    // Get all current schedules for this section
    const [currentSchedules] = await db.query('SELECT * FROM schedules WHERE section_id = ?', [sectionId]);
    const currentSubjectIds = currentSchedules.map(s => s.subject_id.toString());
    const newSubjectIds = subjectIds.map(String);

    // FIX: Only remove subjects when in 'replace' mode to prevent NULL values bug
    let toRemove = [];
    if (mode === 'replace') {
      // Delete schedules for subjects that are no longer assigned (only in replace mode)
      toRemove = currentSubjectIds.filter(id => !newSubjectIds.includes(id));
      for (const subjectId of toRemove) {
        await db.query('DELETE FROM schedules WHERE section_id = ? AND subject_id = ?', [sectionId, subjectId]);
      }
    }
    // In 'add' mode (default), we don't remove any existing subjects

    // For each schedule in the request, update if exists, else insert
    for (const sched of schedules) {
      const { subject_id, day, start_time, end_time, room, type } = sched;
      if (!subject_id || !day || !start_time || !end_time || !room || !type) {
        return res.status(400).json({ error: 'Missing required schedule fields.' });
      }
      // Find or create room
      let roomId = null;
      if (room) {
        const [roomRows] = await db.query('SELECT id FROM rooms WHERE name = ?', [room]);
        if (roomRows.length) {
          roomId = roomRows[0].id;
        } else {
          const [insertResult] = await db.query('INSERT INTO rooms (name) VALUES (?)', [room]);
          roomId = insertResult.insertId;
        }
      }
      
      // Get instructor for this subject (if provided)
      const instructor = instructors[subject_id] || '';
      
      // Check if schedule exists
      const [existing] = await db.query('SELECT id FROM schedules WHERE section_id = ? AND subject_id = ?', [sectionId, subject_id]);
      
      if (existing.length) {
        // Update existing schedule
        await db.query(
          'UPDATE schedules SET room_id=?, day=?, start_time=?, end_time=?, type=?, instructor=? WHERE section_id=? AND subject_id=?',
          [roomId, day, start_time, end_time, type, instructor, sectionId, subject_id]
        );
      } else {
        // Insert new schedule
        await db.query(
          'INSERT INTO schedules (section_id, subject_id, room_id, day, start_time, end_time, type, instructor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [sectionId, subject_id, roomId, day, start_time, end_time, type, instructor]
        );
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Get subject and schedule by section and subject ID ---
const getSectionSubjectSchedule = async (req, res) => {
  try {
    // Get subject
    const [subjectRows] = await db.query('SELECT * FROM subjects WHERE id = ?', [req.params.subjectId]);
    if (!subjectRows.length) {
      return res.status(404).json({ error: 'Subject not found.' });
    }
    const subject = subjectRows[0];

    // Get schedule for this section/subject
    const [scheduleRows] = await db.query('SELECT * FROM schedules WHERE section_id = ? AND subject_id = ?', [req.params.sectionId, req.params.subjectId]);
    let schedule = null;
    let room = null;
    if (scheduleRows.length > 0) {
      schedule = scheduleRows[0];
      if (schedule.room_id) {
        const [roomRows] = await db.query('SELECT name FROM rooms WHERE id = ?', [schedule.room_id]);
        if (roomRows.length) room = roomRows[0].name;
      }
    }

    res.json({ ...subject, schedule, room });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Get schedule for a subject (for editing in SubjectManagement.vue) ---
const getSubjectSchedule = async (req, res) => {
  try {
    const subjectId = req.params.subjectId || req.params.id;
    if (!subjectId) {
      return res.status(400).json({ error: 'Invalid subject ID.' });
    }
    // Get the first schedule for this subject (if any)
    const [scheduleRows] = await db.query('SELECT * FROM schedules WHERE subject_id = ? LIMIT 1', [subjectId]);
    let schedule = null;
    let room = null;
    if (scheduleRows.length > 0) {
      schedule = scheduleRows[0];
      if (schedule.room_id) {
        const [roomRows] = await db.query('SELECT name FROM rooms WHERE id = ?', [schedule.room_id]);
        if (roomRows.length) room = roomRows[0].name;
      }
    }
    res.json({
      type: schedule ? schedule.type : '',
      day: schedule ? schedule.day : '',
      start_time: schedule ? schedule.start_time : '',
      end_time: schedule ? schedule.end_time : '',
      room: room || ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Update or insert schedule for a subject (for SubjectManagement.vue) ---
const updateSubjectSchedule = async (req, res) => {
  try {
    const subjectId = req.params.subjectId || req.params.id;
    if (!subjectId) {
      return res.status(400).json({ error: 'Invalid subject ID.' });
    }
    const { type, day, start_time, end_time, room } = req.body;
    // Find or create room
    let roomId = null;
    if (room) {
      // Try to find by name first
      const [roomRows] = await db.query('SELECT id FROM rooms WHERE name = ?', [room]);
      if (roomRows.length) {
        roomId = roomRows[0].id;
      } else {
        // Create new room
        const [insertResult] = await db.query('INSERT INTO rooms (name) VALUES (?)', [room]);
        roomId = insertResult.insertId;
      }
    }
    // Check for room conflicts using helper
    const conflictMsg = await checkRoomScheduleConflict(roomId, day, start_time, end_time);
    if (conflictMsg) {
      return res.status(400).json({ error: conflictMsg });
    }
    // Check if schedule exists for this subject
    const [existingSchedules] = await db.query('SELECT * FROM schedules WHERE subject_id = ? LIMIT 1', [subjectId]);
    if (existingSchedules.length > 0) {
      // Update existing
      await db.query(
        'UPDATE schedules SET room_id = ?, day = ?, start_time = ?, end_time = ?, type = ? WHERE subject_id = ?',
        [roomId, day, start_time, end_time, type, subjectId]
      );
      res.json({ success: true, updated: true });
    } else {
      // Insert new (section_id = 0 for template)
      await db.query(
        'INSERT INTO schedules (section_id, subject_id, room_id, day, start_time, end_time, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [0, subjectId, roomId, day, start_time, end_time, type]
      );
      res.json({ success: true, inserted: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// ... (rest of the code remains the same)
const getSubjectSchedules = async (req, res) => {
  try {
    const subjectId = req.params.subjectId || req.params.id;
    if (!subjectId) {
      return res.status(400).json({ error: 'Invalid subject ID.' });
    }
    // Get all schedules for this subject
    const [scheduleRows] = await db.query('SELECT * FROM schedules WHERE subject_id = ?', [subjectId]);
    const schedules = [];
    for (const schedule of scheduleRows) {
      let room = null;
      if (schedule.room_id) {
        const [roomRows] = await db.query('SELECT name FROM rooms WHERE id = ?', [schedule.room_id]);
        if (roomRows.length) room = roomRows[0].name;
      }
      schedules.push({
        id: schedule.id,
        section_id: schedule.section_id,
        type: schedule.type || '',
        day: schedule.day || '',
        start_time: schedule.start_time || '',
        end_time: schedule.end_time || '',
        room: room || ''
      });
    }
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Get all schedules for a subject with subject, section, and room info (LEFT JOIN) ---
const getSubjectFullSchedules = async (req, res) => {
  try {
    const subjectId = req.params.subjectId || req.params.id;
    if (!subjectId) {
      return res.status(400).json({ error: 'Invalid subject ID.' });
    }
    const [rows] = await db.query(`
      SELECT 
        sc.id AS schedule_id,
        sc.day,
        sc.start_time,
        sc.end_time,
        sc.type,
        sub.id AS subject_id,
        sub.code AS subject_code,
        sub.name AS subject_name,
        sec.id AS section_id,
        sec.name AS section_name,
        r.id AS room_id,
        r.name AS room_name
      FROM schedules sc
      LEFT JOIN subjects sub ON sc.subject_id = sub.id
      LEFT JOIN sections sec ON sc.section_id = sec.id
      LEFT JOIN rooms r ON sc.room_id = r.id
      WHERE sc.subject_id = ?
    `, [subjectId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Get all schedules with subject and room info (for prefill) ---
const getAllSchedulesFull = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        sc.id AS schedule_id,
        sc.day,
        sc.start_time,
        sc.end_time,
        sc.type,
        sub.id AS subject_id,
        sub.code AS subject_code,
        sub.name AS subject_name,
        sub.units AS subject_units,
        r.id AS room_id,
        r.name AS room_name
      FROM schedules sc
      LEFT JOIN subjects sub ON sc.subject_id = sub.id
      LEFT JOIN rooms r ON sc.room_id = r.id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

module.exports = {
  assignSubjectsToSection,
  removeSubjectFromSection,
  cleanupMismatchedSchedules,
  bulkAssignSchedules,
  assignWithSchedules,
  getSectionSubjectSchedule,
  getSubjectSchedule,
  updateSubjectSchedule,
  getSubjectSchedules,
  getSubjectFullSchedules,
  getAllSchedulesFull
};
