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

        // Create posts table
        db.run(`
          CREATE TABLE IF NOT EXISTS posts (
            post_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            username TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            likes INTEGER DEFAULT 0,
            views INTEGER DEFAULT 0,
            image_url TEXT,
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

// Mock route to create a post
app.post('/create-post', (req, res) => {
  const { user_id, username, title, content, image_url } = req.body;
  db.run(`
    INSERT INTO posts (user_id, username, title, content, image_url)
    VALUES (?, ?, ?, ?, ?)`, [user_id, username, title, content, image_url], function (err) {
    if (err) {
      return res.status(500).send('Error creating post');
    }
    res.status(201).send({ post_id: this.lastID });
  });
});

// Mock route to retrieve posts
app.get('/posts', (req, res) => {
  db.all(`SELECT * FROM posts ORDER BY published_at DESC`, [], (err, rows) => {
    if (err) {
      return res.status(500).send('Error retrieving posts');
    }
    res.status(200).json(rows);
  });
});

// Mock route to add a comment to a post
app.post('/add-comment', (req, res) => {
  const { post_id, commenter_name, comment_text } = req.body;
  db.run(`
    INSERT INTO comments (post_id, commenter_name, comment_text)
    VALUES (?, ?, ?)`, [post_id, commenter_name, comment_text], function (err) {
    if (err) {
      return res.status(500).send('Error adding comment');
    }
    res.status(201).send({ comment_id: this.lastID });
  });
});

// Mock route to retrieve comments for a post
app.get('/comments/:post_id', (req, res) => {
  const { post_id } = req.params;
  db.all(`SELECT * FROM comments WHERE post_id = ? ORDER BY comment_date ASC`, [post_id], (err, rows) => {
    if (err) {
      return res.status(500).send('Error retrieving comments');
    }
    res.status(200).json(rows);
  });
});

// Test cases

// Test creating a post
test('Create a post and validate storage', (done) => {
  // Insert a test user
  db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, ['John Doe', 'john@example.com', 'password123'], function (err) {
    if (err) {
      done(err);
    } else {
      const userId = this.lastID;

      request(app)
        .post('/create-post')
        .send({
          user_id: userId,
          username: 'John Doe',
          title: 'First Post',
          content: 'This is the content of the first post.',
          image_url: 'http://example.com/image.png'
        })
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);

          const postId = res.body.post_id;

          // Retrieve the post to validate insertion
          db.get(`SELECT * FROM posts WHERE post_id = ?`, [postId], (err, row) => {
            if (err) return done(err);

            // Validate data
            expect(row.title).toBe('First Post');
            expect(row.content).toBe('This is the content of the first post.');
            expect(row.username).toBe('John Doe');
            expect(row.image_url).toBe('http://example.com/image.png');
            done();
          });
        });
    }
  });
});

// Test retrieving posts
test('Retrieve posts and validate the response', (done) => {
  // Insert a test user and a post
  db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, ['John Doe', 'john@example.com', 'password123'], function (err) {
    if (err) {
      done(err);
    } else {
      const userId = this.lastID;

      db.run(`
        INSERT INTO posts (user_id, username, title, content, image_url)
        VALUES (?, ?, ?, ?, ?)`, [userId, 'John Doe', 'First Post', 'This is the content of the first post.', 'http://example.com/image.png'], function (err) {
        if (err) return done(err);

        request(app)
          .get('/posts')
          .expect(200)
          .expect((res) => {
            const data = res.body[0];
            expect(data.title).toBe('First Post');
            expect(data.content).toBe('This is the content of the first post.');
            expect(data.username).toBe('John Doe');
            expect(data.image_url).toBe('http://example.com/image.png');
          })
          .end(done);
      });
    }
  });
});

// Test adding a comment to a post
test('Add a comment to a post and validate storage', (done) => {
  // Insert a test user and a post
  db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, ['John Doe', 'john@example.com', 'password123'], function (err) {
    if (err) {
      done(err);
    } else {
      const userId = this.lastID;

      db.run(`
        INSERT INTO posts (user_id, username, title, content, image_url)
        VALUES (?, ?, ?, ?, ?)`, [userId, 'John Doe', 'First Post', 'This is the content of the first post.', 'http://example.com/image.png'], function (err) {
        if (err) return done(err);

        const postId = this.lastID;

        request(app)
          .post('/add-comment')
          .send({
            post_id: postId,
            commenter_name: 'Jane Doe',
            comment_text: 'Great post!'
          })
          .expect(201)
          .end((err, res) => {
            if (err) return done(err);

            const commentId = res.body.comment_id;

            // Retrieve the comment to validate insertion
            db.get(`SELECT * FROM comments WHERE comment_id = ?`, [commentId], (err, row) => {
              if (err) return done(err);

              // Validate data
              expect(row.commenter_name).toBe('Jane Doe');
              expect(row.comment_text).toBe('Great post!');
              expect(row.post_id).toBe(postId);
              done();
            });
          });
      });
    }
  });
});

// Test retrieving comments for a post
test('Retrieve comments for a post and validate the response', (done) => {
  // Insert a test user, a post, and a comment
  db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, ['John Doe', 'john@example.com', 'password123'], function (err) {
    if (err) {
      done(err);
    } else {
      const userId = this.lastID;

      db.run(`
        INSERT INTO posts (user_id, username, title, content, image_url)
        VALUES (?, ?, ?, ?, ?)`, [userId, 'John Doe', 'First Post', 'This is the content of the first post.', 'http://example.com/image.png'], function (err) {
        if (err) return done(err);

        const postId = this.lastID;

        db.run(`
          INSERT INTO comments (post_id, commenter_name, comment_text)
          VALUES (?, ?, ?)`, [postId, 'Jane Doe', 'Great post!'], function (err) {
          if (err) return done(err);

          request(app)
            .get(`/comments/${postId}`)
            .expect(200)
            .expect((res) => {
            const data = res.body[0];
            expect(data.commenter_name).toBe('Jane Doe');
            expect(data.comment_text).toBe('Great post!');
            expect(data.post_id).toBe(postId);
          })
          .end(done);
        });
      });
    }
  });
});
