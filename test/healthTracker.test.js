const sqlite3 = require('sqlite3').verbose();

let db;

// Setup in-memory database before each test
beforeEach((done) => {
  db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
      console.error('Error opening test database:', err.message);
    } else {
      // Initialize tables similar to your main `database.js`
      db.serialize(() => {
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

// Close the database after each test
afterEach((done) => {
  db.close((err) => {
    if (err) {
      console.error('Error closing test database:', err.message);
    }
    done();
  });
});

// Test case: Insert and retrieve health stats
test('Insert and retrieve health stats for a user', (done) => {
  // Insert a test user
  db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, ['John Doe', 'john@example.com', 'password123'], function (err) {
    if (err) {
      done(err);
    } else {
      const userId = this.lastID;

      // Insert health stats for the user
      db.run(`
        INSERT INTO health_stats (user_id, calories, steps, mvpa, sleep, date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)`, [userId, 2000, 8000, 45, 7, '2024-07-25', 'Feeling good'], function (err) {
        if (err) {
          done(err);
        } else {
          // Retrieve health stats to validate insertion
          db.get(`SELECT * FROM health_stats WHERE user_id = ?`, [userId], (err, row) => {
            if (err) {
              done(err);
            } else {
              // Validate data
              expect(row.calories).toBe(2000);
              expect(row.steps).toBe(8000);
              expect(row.mvpa).toBe(45);
              expect(row.sleep).toBe(7);
              expect(row.date).toBe('2024-07-25');
              expect(row.notes).toBe('Feeling good');
              done();
            }
          });
        }
      });
    }
  });
});
