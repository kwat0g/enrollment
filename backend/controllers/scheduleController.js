const { db } = require('../config/database');
const { getSectionEnrollmentStatus } = require('../utils/helpers');

// --- Admin: Assign subjects to a section ---
const assignSubjectsToSection = async (req, res) => {
  const { subjectIds } = req.body;
  const sectionId = req.params.sectionId;
  
  try {
    // Get section info
    const [sectionRows] = await db.query('SELECT * FROM sections WHERE id = ?', [sectionId]);
    if (!sectionRows.length) {
      return res.status(404).json({ error: 'Section not found.' });
    }
    const section = sectionRows[0];
    
    // Check if section is open - prevent editing subjects if open
    if (section.status === 'open') {
      return res.status(400).json({ error: 'Cannot modify subjects: section is currently open for enrollment.' });
    }
    
    // Get current subjects assigned to this section
    const [currentSchedules] = await db.query('SELECT DISTINCT subject_id FROM schedules WHERE section_id = ?', [sectionId]);
    const currentSubjectIds = currentSchedules.map(s => s.subject_id);
    const newSubjectIds = subjectIds || [];
    
    // Determine what to add/remove
    const toRemove = currentSubjectIds.filter(id => !newSubjectIds.includes(id));
    const toAdd = newSubjectIds.filter(id => !currentSubjectIds.includes(id));

    // Check if students are enrolled or pending
    const studentsEnrolled = await getSectionEnrollmentStatus(sectionId);
    if (studentsEnrolled === 'approved') {
      return res.status(400).json({ error: 'Cannot modify subjects: students are already enrolled in this section for the current term.' });
    }
    if (studentsEnrolled === 'pending') {
      return res.status(400).json({ error: 'Cannot modify subjects: there are pending enrollments for this section in the current term.' });
    }

    // Remove schedules for subjects being removed
    if (toRemove.length > 0) {
      for (const subjectId of toRemove) {
        await db.query('DELETE FROM schedules WHERE section_id = ? AND subject_id = ?', [sectionId, subjectId]);
      }
    }

    // For each subject being added, copy template schedule or create new
    if (toAdd.length > 0) {
      // Get all subjects to be assigned
      const [subjects] = await db.query(
        'SELECT * FROM subjects WHERE id IN (?)',
        [toAdd]
      );
      // Filter subjects that match section's year_level and course_id
      const validSubjects = subjects.filter(subject => 
        subject.year_level === section.year_level && subject.course_id === section.course_id
      );
      if (validSubjects.length !== toAdd.length) {
        return res.status(400).json({ error: 'One or more subjects do not match the section\'s year level or course.' });
      }

      for (const subject of validSubjects) {
        // Try to copy template schedule first
        let scheduleRow = null;
        const [templateRows] = await db.query(
          'SELECT * FROM schedules WHERE subject_id = ? AND section_id = 0 LIMIT 1',
          [subject.id]
        );
        if (templateRows.length > 0) {
          scheduleRow = templateRows[0];
        }

        // Use template data or defaults
        const room_id = scheduleRow ? scheduleRow.room_id : null;
        const day = scheduleRow ? scheduleRow.day : '';
        const start_time = scheduleRow ? scheduleRow.start_time : '';
        const end_time = scheduleRow ? scheduleRow.end_time : '';
        const type = scheduleRow ? scheduleRow.type : subject.type || '';

        // Insert schedule for this section/subject
        await db.query(
          'INSERT INTO schedules (section_id, subject_id, room_id, day, start_time, end_time, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [sectionId, subject.id, room_id, day, start_time, end_time, type]
        );
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
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
      await db.query(
        'INSERT INTO schedules (section_id, subject_id, room_id, day, start_time, end_time, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [sectionId, subject_id, roomId, day, start_time, end_time, type]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error.' });
  }
};

// --- Admin: Assign subjects to a section with schedules (atomic) ---
const assignWithSchedules = async (req, res) => {
  const sectionId = req.params.sectionId;
  const { subjectIds, schedules } = req.body;
  if (!Array.isArray(subjectIds) || subjectIds.length === 0 || !Array.isArray(schedules) || schedules.length === 0) {
    return res.status(400).json({ error: 'Subjects and schedules are required.' });
  }
  
  try {
    // Remove all existing schedules for this section
    await db.query('DELETE FROM schedules WHERE section_id = ?', [sectionId]);

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
      // Check for room conflicts
      const [existingSchedules] = await db.query('SELECT * FROM schedules WHERE room_id = ? AND day = ?', [roomId, day]);
      // Helper: convert HH:mm to minutes
      const toMinutes = t => {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      const s1 = toMinutes(start_time), e1 = toMinutes(end_time);
      for (const existing of existingSchedules) {
        const s2 = toMinutes(existing.start_time), e2 = toMinutes(existing.end_time);
        if (s1 < e2 && s2 < e1) {
          return res.status(400).json({
            error: `Room conflict: ${room} is already booked on ${day} from ${existing.start_time} to ${existing.end_time}.`
          });
        }
      }
      await db.query(
        'INSERT INTO schedules (section_id, subject_id, room_id, day, start_time, end_time, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [sectionId, subject_id, roomId, day, start_time, end_time, type]
      );
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
    // Get the first schedule for this subject (if any)
    const [scheduleRows] = await db.query('SELECT * FROM schedules WHERE subject_id = ? LIMIT 1', [req.params.id]);
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
    const subjectId = req.params.id;
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

// --- Admin: Get all schedules for a subject (for SubjectManagement.vue, advanced) ---
const getSubjectSchedules = async (req, res) => {
  try {
    // Get all schedules for this subject
    const [scheduleRows] = await db.query('SELECT * FROM schedules WHERE subject_id = ?', [req.params.id]);
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
    `, [req.params.id]);
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
