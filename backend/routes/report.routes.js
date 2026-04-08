const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

// Report 1: Daily Follow-up Report
router.get('/daily-followups', async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });

    const db = await getDb();
    let query = `
      SELECT s.name as "Student Name", 
             GROUP_CONCAT(DISTINCT p.phone_number) as "Phone Number",
             s.education as "Education", 
             GROUP_CONCAT(DISTINCT c.course_name) as "Interested Course",
             src.name as "In Coming Source", 
             s.followup_remarks as "Follow Up Remarks",
             s.status as "Status",
             s.next_followup_date as "Next Follow-up"
      FROM Students s
      LEFT JOIN Sources src ON s.source_id = src.id
      LEFT JOIN InterestedCourses ic ON s.id = ic.student_id
      LEFT JOIN Courses c ON ic.course_id = c.id
      LEFT JOIN PhoneNumbers p ON s.id = p.student_id
      WHERE s.next_followup_date BETWEEN ? AND ?
    `;
    let params = [startDate, endDate];
    
    if (status) {
      query += ` AND s.status = ?`;
      params.push(status);
    }
    
    query += ` GROUP BY s.id ORDER BY s.next_followup_date ASC`;
    const results = await db.all(query, params);
    res.json(results);
  } catch (error) {
    console.error("Error in daily-followups report:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Report 2: Monthly Enrollment Report
router.get('/enrollments', async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });

    const db = await getDb();
    let query = `
      SELECT s.name as "Student Name", 
             GROUP_CONCAT(DISTINCT p.phone_number) as "Phone Number",
             c.course_name as "Enrolled Courses",
             e.enrollment_date as "Enrollment Date",
             src.name as "In Coming Source",
             s.status as "Status"
      FROM Enrollments e
      JOIN Students s ON e.student_id = s.id
      JOIN Courses c ON e.course_id = c.id
      LEFT JOIN Sources src ON s.source_id = src.id
      LEFT JOIN PhoneNumbers p ON s.id = p.student_id
      WHERE e.enrollment_date BETWEEN ? AND ?
    `;
    let params = [startDate, endDate];
    
    if (status) {
      query += ` AND s.status = ?`;
      params.push(status);
    }
    
    query += ` GROUP BY e.id ORDER BY e.enrollment_date DESC`;
    const results = await db.all(query, params);
    res.json(results);
  } catch (error) {
    console.error("Error in enrollments report:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Report 3 & 4: Monthly New Entry Report (optional status filter)
router.get('/new-entries', async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'startDate and endDate required' });

    const db = await getDb();
    let query = `
      SELECT s.id as id,
             s.name as "Student Name", 
             GROUP_CONCAT(DISTINCT p.phone_number) as "Phone Number",
             s.education as "Education", 
             GROUP_CONCAT(DISTINCT c.course_name) as "Interested Course",
             src.name as "In Coming Source", 
             s.followup_remarks as "Follow Up Remarks",
             s.status as "Status"
      FROM Students s
      LEFT JOIN Sources src ON s.source_id = src.id
      LEFT JOIN InterestedCourses ic ON s.id = ic.student_id
      LEFT JOIN Courses c ON ic.course_id = c.id
      LEFT JOIN PhoneNumbers p ON s.id = p.student_id
      WHERE s.entry_date BETWEEN ? AND ?
    `;
    let params = [startDate, endDate];

    if (status) {
      query += ` AND s.status = ?`;
      params.push(status);
    }
    query += ` GROUP BY s.id ORDER BY s.entry_date DESC`;

    const results = await db.all(query, params);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
