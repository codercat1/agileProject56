const request = require('supertest');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

let db;

// Middleware setup for JSON parsing
app.use(express.json());

app.get('/get-health-data', (req, res) => {
  const { date } = req.query;
  db.all(`SELECT * FROM health_stats WHERE date = ?`, [date], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows);
    }
  });
});

// Set up in-memory SQLite database before tests
beforeAll((done) => {
  db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
      console.error('Error opening test database:', err.message);
    } else {
      db.serialize(() => {
        // Create users and health_stats tables
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'user'
          )
        `);

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

// Insert test data before each test
beforeEach((done) => {
  db.serialize(() => {
    // Insert test user and health data
    db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, ['John Doe', 'john@example.com', 'password123']);
    db.run(`INSERT INTO health_stats (user_id, calories, steps, mvpa, sleep, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [1, 2000, 8000, 45, 7, '2024-07-25', 'Feeling good'], done);
  });
});

// Close the database after all tests
afterAll((done) => {
  db.close((err) => {
    if (err) {
      console.error('Error closing test database:', err.message);
    }
    done();
  });
});

// Test case: Check that the endpoint retrieves the correct data
test('GET /get-health-data retrieves health data for a selected date', async () => {
  const response = await request(app).get('/get-health-data').query({ date: '2024-07-25' });
  expect(response.status).toBe(200);
  expect(response.body).toHaveLength(1); // Ensure one record is returned
  expect(response.body[0].calories).toBe(2000);
  expect(response.body[0].steps).toBe(8000);
  expect(response.body[0].mvpa).toBe(45);
  expect(response.body[0].sleep).toBe(7);
  expect(response.body[0].date).toBe('2024-07-25');
  expect(response.body[0].notes).toBe('Feeling good');
});
