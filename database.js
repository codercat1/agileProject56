//This file is responsible for database management, including creating tables and managing user data. It utilizes SQLite for database operations.

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

db.serialize(async () => {
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
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);


  // Add date column to health_stats table
  db.run(`ALTER TABLE health_stats ADD COLUMN date TEXT`, (err) => {
    if (err) {
        // This error will occur if the column already exists, which is fine
        if (err.message.includes('duplicate column name')) {
            console.log('The date column already exists in health_stats table.');
        } else {
            console.error('Error adding date column to health_stats table:', err.message);
        }
    } else {
        console.log('Date column added to health_stats table.');
    }
});



  // Create friends table
  db.run(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      friend_id INTEGER,
      friend_name TEXT,
      message TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (friend_id) REFERENCES users(id)
    )
  `);

  // Create articles table for contents
  db.run(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create posts table with user_id
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      post_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      title TEXT NOT NULL,
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      content TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create comments table
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      commenter_name TEXT NOT NULL,
      comment_text TEXT NOT NULL,
      comment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(post_id)
    )
  `);

  // Create likes table
  db.run(`
    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      user_id INTEGER,
      FOREIGN KEY (post_id) REFERENCES posts(post_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE (post_id, user_id)
    )
  `);

  // Create community_posts table
  db.run(`
    CREATE TABLE IF NOT EXISTS community_posts (
      post_id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      likes INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create community comments table
  db.run(`
    CREATE TABLE IF NOT EXISTS community_comments (
      comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      commenter_name TEXT NOT NULL,
      comment_text TEXT NOT NULL,
      comment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES community_posts(post_id)
    )
  `);

  // Create community likes table
  db.run(`
    CREATE TABLE IF NOT EXISTS community_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      user_id INTEGER,
      FOREIGN KEY (post_id) REFERENCES posts(post_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE (post_id, user_id)
    )
  `);

  
// Insert admin user
const hashedAdminPassword = await bcrypt.hash('admin_password', 10);
db.run(`INSERT OR IGNORE INTO users (username, email, password, role) VALUES ('Admin', 'admin@example.com', ?, 'admin')`, [hashedAdminPassword]);

// Insert dummy users
const hashedPassword1 = await bcrypt.hash('password1', 10);
const hashedPassword2 = await bcrypt.hash('password2', 10);
db.run(`INSERT OR IGNORE INTO users (username, email, password, role) VALUES ('John Doe', 'john@gmail.com', ?, 'user')`, [hashedPassword1]);
db.run(`INSERT OR IGNORE INTO users (username, email, password, role) VALUES ('Jane Smith', 'jane@gmail.com', ?, 'user')`, [hashedPassword2]);

// Insert dummy posts for John Doe
db.run(`INSERT OR IGNORE INTO posts (user_id, username, title, content, published_at) VALUES (2, 'John Doe', 'First Post', 'This is the content of John Doe''s first post.', ?)`, [new Date().toISOString()]);
db.run(`INSERT OR IGNORE INTO posts (user_id, username, title, content, published_at) VALUES (2, 'John Doe', 'Second Post', 'This is the content of John Doe''s second post.', ?)`, [new Date().toISOString()]);

// Insert dummy posts for Jane Smith
db.run(`INSERT OR IGNORE INTO posts (user_id, username, title, content, published_at) VALUES (3, 'Jane Smith', 'First Post', 'This is the content of Jane Smith''s first post.', ?)`, [new Date().toISOString()]);
db.run(`INSERT OR IGNORE INTO posts (user_id, username, title, content, published_at) VALUES (3, 'Jane Smith', 'Second Post', 'This is the content of Jane Smith''s second post.', ?)`, [new Date().toISOString()]);

// Insert dummy health data for John Doe
db.run(`INSERT OR IGNORE INTO health_stats (user_id, calories, steps, mvpa, sleep) VALUES (2, 2000, 8000, 45, 7)`);
db.run(`INSERT OR IGNORE INTO health_stats (user_id, calories, steps, mvpa, sleep) VALUES (2, 2200, 9000, 60, 6.5)`);

// Insert dummy health data for Jane Smith
db.run(`INSERT OR IGNORE INTO health_stats (user_id, calories, steps, mvpa, sleep) VALUES (3, 1800, 7000, 30, 8)`);
db.run(`INSERT OR IGNORE INTO health_stats (user_id, calories, steps, mvpa, sleep) VALUES (3, 1900, 7500, 35, 7.5)`);

// Insert dummy friends data for John Doe
db.run(`INSERT OR IGNORE INTO friends (user_id, friend_id, friend_name, message) VALUES (2, 3, 'Jane Smith', 'Great workout buddy!')`);
db.run(`INSERT OR IGNORE INTO friends (user_id, friend_id, friend_name, message) VALUES (2, 2, 'Self', 'Stay motivated!')`);

// Insert dummy friends data for Jane Smith
db.run(`INSERT OR IGNORE INTO friends (user_id, friend_id, friend_name, message) VALUES (3, 2, 'John Doe', 'Inspiring runner!')`);
db.run(`INSERT OR IGNORE INTO friends (user_id, friend_id, friend_name, message) VALUES (3, 3, 'Self', 'Keep going!')`, (err) => {
  if (err) {
    console.error(err.message);
  }
  db.close((err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('Database closed.');
    }
  });
});



});
