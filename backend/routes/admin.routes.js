const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getDb } = require('../database');
const { verifyToken, verifyAdmin } = require('../middleware/auth.middleware');

// All admin routes must be protected
router.use(verifyToken);
router.use(verifyAdmin);

// --- User Management ---

router.get('/users', async (req, res) => {
  try {
    const db = await getDb();
    const users = await db.all("SELECT id, username, role FROM Users");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const db = await getDb();
    const userRole = role || 'User';
    
    // Check if user exists
    const existing = await db.get("SELECT id FROM Users WHERE username = ?", [username]);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await db.run(
      "INSERT INTO Users (username, password_hash, role) VALUES (?, ?, ?)",
      [username, hash, userRole]
    );

    res.status(201).json({ message: 'User created successfully', id: result.lastID });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update User info (Role/Status)
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // To suspend, send role='Suspended'. To unsuspend, send role='User'
    
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }
    
    const db = await getDb();
    await db.run("UPDATE Users SET role = ? WHERE id = ?", [role, id]);
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = await getDb();
    await db.run("DELETE FROM Users WHERE id = ?", [id]);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Course Management ---

router.get('/courses', async (req, res) => {
  try {
    const db = await getDb();
    const courses = await db.all("SELECT * FROM Courses");
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/courses', async (req, res) => {
  try {
    const { course_name } = req.body;
    if (!course_name) return res.status(400).json({ error: 'Course name required' });
    
    const db = await getDb();
    const result = await db.run("INSERT INTO Courses (course_name) VALUES (?)", [course_name]);
    res.status(201).json({ id: result.lastID, course_name });
  } catch (error) {
    res.status(500).json({ error: 'Could not create course. Might be a duplicate.' });
  }
});

router.put('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { course_name } = req.body;
    
    const db = await getDb();
    await db.run("UPDATE Courses SET course_name = ? WHERE id = ?", [course_name, id]);
    res.json({ message: 'Course updated' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Source Management ---

router.get('/sources', async (req, res) => {
  try {
    const db = await getDb();
    const sources = await db.all("SELECT * FROM Sources");
    res.json(sources);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/sources', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Source name required' });
    
    const db = await getDb();
    const result = await db.run("INSERT INTO Sources (name) VALUES (?)", [name]);
    res.status(201).json({ id: result.lastID, name });
  } catch (error) {
    res.status(500).json({ error: 'Could not create source. Might be a duplicate.' });
  }
});

router.put('/sources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    const db = await getDb();
    await db.run("UPDATE Sources SET name = ? WHERE id = ?", [name, id]);
    res.json({ message: 'Source updated' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
