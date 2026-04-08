const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken); // All endpoints require login

// --- Options Data for Dropdowns ---
router.get('/options', async (req, res) => {
  try {
    const db = await getDb();
    const courses = await db.all("SELECT * FROM Courses");
    const sources = await db.all("SELECT * FROM Sources");
    res.json({ courses, sources });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Dashboard Endpoints ---
router.get('/dashboard', async (req, res) => {
  try {
    const db = await getDb();
    const today = new Date().toISOString().split('T')[0];

    // Follow-ups due today
    const followUps = await db.all(`
      SELECT s.id, s.name, s.education, s.next_followup_date, s.followup_remarks, src.name as source_name,
             GROUP_CONCAT(DISTINCT c.course_name) as courses,
             GROUP_CONCAT(DISTINCT p.phone_number) as phone_numbers
      FROM Students s
      LEFT JOIN Sources src ON s.source_id = src.id
      LEFT JOIN InterestedCourses ic ON s.id = ic.student_id
      LEFT JOIN Courses c ON ic.course_id = c.id
      LEFT JOIN PhoneNumbers p ON s.id = p.student_id
      WHERE s.next_followup_date <= ? AND s.followup_acknowledged = 0 AND s.status NOT IN ('Closed', 'Enrolled')
      GROUP BY s.id
    `, [today]);

    // Summary counts
    const counts = await db.get(`
      SELECT 
        SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open_count,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'Enrolled' THEN 1 ELSE 0 END) as enrolled_count
      FROM Students
    `);

    res.json({ followUps, counts });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Inquiries / Students ---
// Search Students
router.get('/search', async (req, res) => {
  try {
    const { term } = req.query; // Search across multiple fields
    const db = await getDb();
    
    // Simple robust search pattern for SQLite using LIKE on concatenated fields or individual
    let query = `
      SELECT s.*, src.name as source_name,
             GROUP_CONCAT(DISTINCT c.course_name) as courses,
             GROUP_CONCAT(DISTINCT p.phone_number) as phone_numbers
      FROM Students s
      LEFT JOIN Sources src ON s.source_id = src.id
      LEFT JOIN InterestedCourses ic ON s.id = ic.student_id
      LEFT JOIN Courses c ON ic.course_id = c.id
      LEFT JOIN PhoneNumbers p ON s.id = p.student_id
    `;
    
    let params = [];
    if (term) {
      const likeTerm = `%${term}%`;
      query += ` WHERE s.name LIKE ? OR s.city LIKE ? OR p.phone_number LIKE ? OR src.name LIKE ? OR c.course_name LIKE ? OR s.id = ?`;
      params = [likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, term];
    }
    
    query += ` GROUP BY s.id ORDER BY s.entry_date DESC LIMIT 50`;
    
    const students = await db.all(query, params);
    res.json(students);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new student / inquiry
router.post('/', async (req, res) => {
  try {
    const { 
      source_id, entry_date, name, cell_numbers, education, city, 
      interested_courses, summary, next_followup_date, followup_remarks, status
    } = req.body;
    
    const db = await getDb();
    
    // 1. Check for duplicate cell numbers
    if (cell_numbers && cell_numbers.length > 0) {
      const placeholders = cell_numbers.map(() => '?').join(',');
      const duplicates = await db.all(`
        SELECT p.phone_number, s.name 
        FROM PhoneNumbers p 
        JOIN Students s ON p.student_id = s.id 
        WHERE p.phone_number IN (${placeholders})
      `, cell_numbers);
      
      if (duplicates.length > 0) {
        return res.status(409).json({ error: 'Duplicate phone number found', details: duplicates });
      }
    }

    // 2. Insert Student
    const sql = `
      INSERT INTO Students (source_id, entry_date, name, education, city, summary, status, next_followup_date, followup_remarks, followup_acknowledged)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;
    const today = new Date().toISOString().split('T')[0];
    const s_entry_date = entry_date || today;
    const s_status = status || 'Open';
    
    const result = await db.run(sql, [
      source_id || null, s_entry_date, name || '', education || '', city || '', 
      summary || '', s_status, next_followup_date || null, followup_remarks || ''
    ]);
    const studentId = result.lastID;

    // 3. Insert Phone Numbers
    if (cell_numbers && Array.isArray(cell_numbers)) {
      for (const phone of cell_numbers) {
        if (phone.trim() !== '') {
          await db.run("INSERT INTO PhoneNumbers (student_id, phone_number) VALUES (?, ?)", [studentId, phone.trim()]);
        }
      }
    }

    // 4. Insert Interested Courses
    if (interested_courses && Array.isArray(interested_courses)) {
      for (const courseId of interested_courses) {
        await db.run("INSERT INTO InterestedCourses (student_id, course_id) VALUES (?, ?)", [studentId, courseId]);
      }
    }

    res.status(201).json({ message: 'Inquiry added successfully', studentId });
  } catch (error) {
    console.error("Create inquiry error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update student record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      source_id, name, education, city, summary, status, 
      next_followup_date, followup_remarks, new_cell_numbers,
      add_interested_courses, remove_interested_courses,
      followup_acknowledged
    } = req.body;

    const db = await getDb();
    
    // Update core fields dynamically based on what's provided
    let updates = [];
    let params = [];
    const fields = { source_id, name, education, city, summary, status, next_followup_date, followup_remarks, followup_acknowledged };
    
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    }
    
    if (updates.length > 0) {
      params.push(id);
      await db.run(`UPDATE Students SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Handle cell numbers
    if (new_cell_numbers && Array.isArray(new_cell_numbers)) {
      await db.run("DELETE FROM PhoneNumbers WHERE student_id = ?", [id]);
      const uniquePhones = [...new Set(new_cell_numbers.map(p => p.trim()).filter(p => p !== ''))];
      for (const phone of uniquePhones) {
        await db.run("INSERT INTO PhoneNumbers (student_id, phone_number) VALUES (?, ?)", [id, phone]);
      }
    }

    // Handle courses updates
    if (add_interested_courses && Array.isArray(add_interested_courses)) {
      for (const courseId of add_interested_courses) {
        await db.run("INSERT OR IGNORE INTO InterestedCourses (student_id, course_id) VALUES (?, ?)", [id, courseId]);
      }
    }
    if (remove_interested_courses && Array.isArray(remove_interested_courses)) {
      for (const courseId of remove_interested_courses) {
        await db.run("DELETE FROM InterestedCourses WHERE student_id = ? AND course_id = ?", [id, courseId]);
      }
    }

    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Convert to Enrollment
router.post('/:id/enroll', async (req, res) => {
  try {
    const { id } = req.params;
    const { course_ids, enrollment_date } = req.body;
    
    if (!course_ids || !Array.isArray(course_ids) || course_ids.length === 0) {
      return res.status(400).json({ error: 'At least one course must be selected' });
    }

    const db = await getDb();
    const e_date = enrollment_date || new Date().toISOString().split('T')[0];

    // Mark student status as Enrolled
    await db.run("UPDATE Students SET status = 'Enrolled' WHERE id = ?", [id]);

    // Insert into Enrollments
    for (const courseId of course_ids) {
      await db.run("INSERT INTO Enrollments (student_id, course_id, enrollment_date) VALUES (?, ?, ?)", [id, courseId, e_date]);
    }

    res.json({ message: 'Student enrolled successfully' });
  } catch (error) {
    console.error("Enrollment error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Re-enrollment
router.post('/:id/reenroll', async (req, res) => {
  try {
    const { id } = req.params;
    const { course_ids, reenrollment_date } = req.body;
    
    if (!course_ids || !Array.isArray(course_ids) || course_ids.length === 0) {
      return res.status(400).json({ error: 'At least one course must be selected' });
    }

    const db = await getDb();
    const re_date = reenrollment_date || new Date().toISOString().split('T')[0];

    for (const courseId of course_ids) {
      await db.run("INSERT INTO ReEnrollments (student_id, course_id, reenrollment_date) VALUES (?, ?, ?)", [id, courseId, re_date]);
    }

    res.json({ message: 'Student re-enrolled successfully' });
  } catch (error) {
    console.error("Re-enrollment error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single student by ID with all details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    
    const student = await db.get(`
      SELECT s.*, src.name as source_name
      FROM Students s
      LEFT JOIN Sources src ON s.source_id = src.id
      WHERE s.id = ?
    `, [id]);
    
    if (!student) return res.status(404).json({ error: 'Student not found' });
    
    const phones = await db.all("SELECT * FROM PhoneNumbers WHERE student_id = ?", [id]);
    const interested = await db.all("SELECT ic.*, c.course_name FROM InterestedCourses ic JOIN Courses c ON ic.course_id = c.id WHERE ic.student_id = ?", [id]);
    const enrollments = await db.all("SELECT e.*, c.course_name FROM Enrollments e JOIN Courses c ON e.course_id = c.id WHERE e.student_id = ?", [id]);
    const reenrollments = await db.all("SELECT re.*, c.course_name FROM ReEnrollments re JOIN Courses c ON re.course_id = c.id WHERE re.student_id = ?", [id]);
    
    res.json({
      ...student,
      phone_numbers: phones,
      interested_courses: interested,
      enrollments,
      reenrollments
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
