const { db } = require('../config/database');

/**
 * Create a notification for a student.
 * @param {number} studentId - The student's numeric ID
 * @param {string} message - The notification message
 * @param {string} [type] - Notification type (e.g., 'info', 'error', 'enrollment')
 * @returns {Promise<void>}
 */
async function createNotification(studentId, message, type = 'info') {
  await db.query(
    'INSERT INTO notifications (student_id, message, type, is_read, created_at) VALUES (?, ?, ?, 0, NOW())',
    [studentId, message, type]
  );
}

module.exports = { createNotification };
