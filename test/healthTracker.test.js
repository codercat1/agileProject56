const request = require('supertest');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// In-memory SQLite database for testing
let db;
beforeEach((done) => {
  db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
      console.error('Error opening test database:', err.message);
    } else {
      db.serialize(() => {
        // Create users table
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'user'
          )
        `);

        // Create health_stats table
        db.run(`
          CREATE TABLE IF NOT EXISTS health_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            calories INTEGER,
            steps INTEGER,
            mvpa INTEGER,
            sleep INTEGER,
            date TEXT,
            notes TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `, done);
      });
    }
  });
});

// Close the database after each test
afterEach((done) => {
  db.close((err) => {
    if (err) {
      console.error('Error closing test database:', err.message);
    }
    done();
  });
});

// Mock route to insert health data
app.post('/insert-health-data', (req, res) => {
  const { user_id, calories, steps, mvpa, sleep, date, notes } = req.body;
  db.run(`
    INSERT INTO health_stats (user_id, calories, steps, mvpa, sleep, date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)`, [user_id, calories, steps, mvpa, sleep, date, notes], function (err) {
    if (err) {
      return res.status(500).send('Error inserting health data');
    }
    res.status(201).send('Health data inserted');
  });
});

// Mock route to retrieve health data by date
app.get('/get-health-data', (req, res) => {
  const { date } = req.query;
  db.all(`SELECT * FROM health_stats WHERE date = ?`, [date], (err, rows) => {
    if (err) {
      return res.status(500).send('Error retrieving health data');
    }
    res.status(200).json(rows);
  });
});

// Test cases

// Test inserting health data
test('Insert health data for a user and validate storage', (done) => {
  // Insert a test user
  db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, ['John Doe', 'john@example.com', 'password123'], function (err) {
    if (err) {
      done(err);
    } else {
      const userId = this.lastID;

      // Insert health stats for the user
      request(app)
        .post('/insert-health-data')
        .send({
          user_id: userId,
          calories: 2000,
          steps: 8000,
          mvpa: 45,
          sleep: 7,
          date: '2024-07-25',
          notes: 'Feeling good'
        })
        .expect(201)
        .end((err) => {
          if (err) return done(err);

          // Retrieve health stats to validate insertion
          db.get(`SELECT * FROM health_stats WHERE user_id = ?`, [userId], (err, row) => {
            if (err) return done(err);
            
            // Validate data
            expect(row.calories).toBe(2000);
            expect(row.steps).toBe(8000);
            expect(row.mvpa).toBe(45);
            expect(row.sleep).toBe(7);
            expect(row.date).toBe('2024-07-25');
            expect(row.notes).toBe('Feeling good');
            done();
          });
        });
    }
  });
});

// Test retrieving health data by date
test('Retrieve health data by date and validate the response', (done) => {
  // Insert a test user and health data
  db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, ['John Doe', 'john@example.com', 'password123'], function (err) {
    if (err) {
      done(err);
    } else {
      const userId = this.lastID;

      db.run(`
        INSERT INTO health_stats (user_id, calories, steps, mvpa, sleep, date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)`, [userId, 2000, 8000, 45, 7, '2024-07-25', 'Feeling good'], function (err) {
        if (err) return done(err);

        request(app)
          .get('/get-health-data')
          .query({ date: '2024-07-25' })
          .expect(200)
          .expect((res) => {
            const data = res.body[0];
            expect(data.calories).toBe(2000);
            expect(data.steps).toBe(8000);
            expect(data.mvpa).toBe(45);
            expect(data.sleep).toBe(7);
            expect(data.date).toBe('2024-07-25');
            expect(data.notes).toBe('Feeling good');
          })
          .end(done);
      });
    }
  });
});

module.exports = app;
