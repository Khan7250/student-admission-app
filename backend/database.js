const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt = require('bcrypt');
const path = require('path');
const { createClient } = require('@libsql/client');
require('dotenv').config();

let dbInstance = null;
let isLibSQL = false;

// Wrapper to mimic the local sqlite driver API when using Turso
class LibsqlAdapter {
  constructor(client) {
    this.client = client;
  }
  
  async exec(sql) {
    await this.client.executeMultiple(sql);
  }
  
  async run(sql, params = []) {
    const res = await this.client.execute({ sql, args: params });
    return {
      lastID: res.lastInsertRowid ? Number(res.lastInsertRowid) : undefined,
      changes: res.rowsAffected
    };
  }
  
  async get(sql, params = []) {
    const res = await this.client.execute({ sql, args: params });
    return res.rows[0];
  }
  
  async all(sql, params = []) {
    const res = await this.client.execute({ sql, args: params });
    return res.rows;
  }
}

async function getDb() {
  if (!dbInstance) {
    const tursoUrl = process.env.TURSO_DATABASE_URL || "libsql://student-db-khan7250.aws-us-east-2.turso.io";
    const tursoToken = process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzU2Nzc2MzYsImlkIjoiMDE5ZDZlYTEtODQwMS03OTUwLTgyNzUtNjU0MGIzM2ZhZTllIiwicmlkIjoiMTZkZTkxNWMtYTc2Ny00YmI4LWExMDUtMDM0MTE1MDNjNGYxIn0.g97-7tb4GZhEX64h-lorowu-apLc7Q6E1wiBtDGsz8iLXNAL_WHpz8b9TZN95339hyH3-ZllmPuLf9PtRkwZAg";
    
    if (tursoUrl && tursoToken) {
      console.log("Connecting to Turso Cloud Database...");
      const client = createClient({
        url: tursoUrl,
        authToken: tursoToken,
      });
      dbInstance = new LibsqlAdapter(client);
      isLibSQL = true;
    } else {
      console.log("Connecting to Local SQLite DB...");
      const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');
      dbInstance = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });
      isLibSQL = false;
    }
  }
  return dbInstance;
}

async function initDb() {
  const db = await getDb();

  // Create Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'User'
    )
  `);

  // Create default admin user if not exists
  const adminExists = await db.get("SELECT * FROM Users WHERE role = 'Admin'");
  if (!adminExists) {
    const defaultPassword = 'admin'; // You should change this in production
    const hash = await bcrypt.hash(defaultPassword, 10);
    await db.run(
      "INSERT INTO Users (username, password_hash, role) VALUES (?, ?, ?)",
      ['admin', hash, 'Admin']
    );
    console.log("Default admin user created (admin/admin)");
  }

  // Create Sources table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `);

  // Create Courses table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_name TEXT UNIQUE NOT NULL
    )
  `);

  // Create Students table (Inquiries)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id INTEGER,
      entry_date TEXT NOT NULL,
      name TEXT,
      education TEXT,
      city TEXT,
      summary TEXT,
      status TEXT DEFAULT 'Open',
      next_followup_date TEXT,
      followup_remarks TEXT,
      FOREIGN KEY(source_id) REFERENCES Sources(id)
    )
  `);

  // Create PhoneNumbers table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS PhoneNumbers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      phone_number TEXT NOT NULL,
      FOREIGN KEY(student_id) REFERENCES Students(id)
    )
  `);

  // Create InterestedCourses table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS InterestedCourses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      FOREIGN KEY(student_id) REFERENCES Students(id),
      FOREIGN KEY(course_id) REFERENCES Courses(id)
    )
  `);

  // Create Enrollments table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      enrollment_date TEXT NOT NULL,
      FOREIGN KEY(student_id) REFERENCES Students(id),
      FOREIGN KEY(course_id) REFERENCES Courses(id)
    )
  `);

  // Create ReEnrollments table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ReEnrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      reenrollment_date TEXT NOT NULL,
      FOREIGN KEY(student_id) REFERENCES Students(id),
      FOREIGN KEY(course_id) REFERENCES Courses(id)
    )
  `);

  // Create Settings table (for branding like Logo)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  console.log("Database initialized successfully.");
  return db;
}

module.exports = {
  getDb,
  initDb
};
