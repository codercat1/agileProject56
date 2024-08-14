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
  
  // create articles table for contents
  db.run(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create posts table
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      post_id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      title TEXT NOT NULL,
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      content TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0
    )
  `);

  // Create comments table
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      commenter_name TEXT NOT NULL,
      comment_text TEXT NOT NULL,
      comment_date DATETIME DEFAULT CURRENT_TIMESTAMP
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

  // Insert dummy data for posts
  db.run(`INSERT INTO posts (username, title, content, published_at) VALUES ('Junjie', 'Test Title', 'Testing', ?)`);

  // Insert dummy users
  const hashedPassword1 = await bcrypt.hash('password1', 10);
  const hashedPassword2 = await bcrypt.hash('password2', 10);
  db.run(`INSERT INTO users (username, email, password, user) VALUES ('John Doe', 'john@gmail.com', ?)`, [hashedPassword1]);
  db.run(`INSERT INTO users (username, email, password, user) VALUES ('Jane Smith', 'jane@gmail.com', ?)`, [hashedPassword2]);
  
  // Insert dummy health data for John Doe
  db.run(`INSERT INTO health_stats (user_id, calories, steps, mvpa, sleep) VALUES (1, 2000, 8000, 45, 7)`);
  db.run(`INSERT INTO health_stats (user_id, calories, steps, mvpa, sleep) VALUES (1, 2200, 9000, 60, 6.5)`);

  // Insert dummy health data for Jane Smith
  db.run(`INSERT INTO health_stats (user_id, calories, steps, mvpa, sleep) VALUES (2, 1800, 7000, 30, 8)`);
  db.run(`INSERT INTO health_stats (user_id, calories, steps, mvpa, sleep) VALUES (2, 1900, 7500, 35, 7.5)`);

  // Insert dummy friends data for John Doe
  db.run(`INSERT INTO friends (user_id, friend_id, friend_name, message) VALUES (1, 2, 'Jane Smith', 'Great workout buddy!')`);
  db.run(`INSERT INTO friends (user_id, friend_id, friend_name, message) VALUES (1, 1, 'Self', 'Stay motivated!')`);

  // Insert dummy friends data for Jane Smith
  db.run(`INSERT INTO friends (user_id, friend_id, friend_name, message) VALUES (2, 1, 'John Doe', 'Inspiring runner!')`);
  db.run(`INSERT INTO friends (user_id, friend_id, friend_name, message) VALUES (2, 2, 'Self', 'Keep going!')`, (err) => {
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
