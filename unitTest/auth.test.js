const request = require('supertest');
const bcrypt = require('bcrypt');
const session = require('express-session');
const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();

// Setup the Express app
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup session middleware
app.use(session({
  secret: 'secret_key',
  resave: false,
  saveUninitialized: true,
}));

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

// Mock registration route
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, [username, email, hashedPassword], (err) => {
    if (err) {
      return res.status(500).send('Error registering user');
    }
    res.status(201).send('User registered');
  });
});

// Mock login route
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) {
      return res.status(401).send('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send('Invalid credentials');
    }
    req.session.userId = user.id;
    res.status(200).send('Login successful');
  });
});

// Mock logout route
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.status(200).send('Logout successful');
  });
});

// Test cases

// Registration test
test('User registration should hash the password and store the user in the database', async () => {
  const response = await request(app)
    .post('/register')
    .send({ username: 'John Doe', email: 'john@example.com', password: 'password123' });

  expect(response.status).toBe(201);

  db.get(`SELECT * FROM users WHERE email = ?`, ['john@example.com'], (err, user) => {
    expect(user).not.toBeNull();
    expect(user.username).toBe('John Doe');
    expect(bcrypt.compareSync('password123', user.password)).toBe(true);
  });
});

// Login test
test('User should be able to log in with correct credentials', async () => {
  const hashedPassword = await bcrypt.hash('password123', 10);
  db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, ['John Doe', 'john@example.com', hashedPassword]);

  const response = await request(app)
    .post('/login')
    .send({ email: 'john@example.com', password: 'password123' });

  expect(response.status).toBe(200);
  expect(response.text).toBe('Login successful');
});

// Session management test
test('Session should be created on login and destroyed on logout', async () => {
  const hashedPassword = await bcrypt.hash('password123', 10);
  db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, ['John Doe', 'john@example.com', hashedPassword]);

  const loginResponse = await request(app)
    .post('/login')
    .send({ email: 'john@example.com', password: 'password123' });

  expect(loginResponse.status).toBe(200);

  const sessionCookie = loginResponse.headers['set-cookie'][0];

  const logoutResponse = await request(app)
    .post('/logout')
    .set('Cookie', sessionCookie);

  expect(logoutResponse.status).toBe(200);
  expect(logoutResponse.text).toBe('Logout successful');
});

module.exports = app;
