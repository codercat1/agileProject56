const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../db'); // Assuming you created db.js for modularization

// Middleware to inject user data into all routes
router.use((req, res, next) => {
  if (req.session.userId) {
    db.get('SELECT * FROM users WHERE id = ?', [req.session.userId], (err, userRow) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Database error');
      }
      res.locals.user = userRow;
      next();
    });
  } else {
    next();
  }
});



// Home page
router.get('/', (req, res) => {
  if (!req.session.userId) {
    res.redirect('/login');
  } else {
    res.redirect(`/health_tracker/${req.session.userId}`);
  }
});

// Monthly Record
router.get('/activities', (req, res) => {
  res.render('activities');
});

// Contents
router.get('/contents', (req, res) => {
  res.render('contents');
});


// Posting page
router.get('/posting', (req, res) => {
  db.all('SELECT * FROM posts ORDER BY published_at DESC', (err, posts) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Database error');
    }

    db.all('SELECT * FROM comments ORDER BY comment_date ASC', (err, comments) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Database error');
      }

      res.render('posting', { posts, comments });
    });
  });
});

router.post('/posting', (req, res) => {
  const { title, body } = req.body;
  const username = req.session.username || 'default_username'; // Replace with actual user logic
  const publishedAt = new Date().toISOString(); // Get current date and time

  db.run('INSERT INTO posts (title, content, username, published_at) VALUES (?, ?, ?, ?)', [title, body, username, publishedAt], (err) => {
      if (err) {
          return res.status(500).send(err.message);
      }
      res.redirect('/posting');
  });
});

// Comments Route
router.post('/post/:post_id/comment', (req, res) => {
  const postId = req.params.post_id;
  const commenterName = req.session.username;  // Assuming you have user sessions
  const commentText = req.body.comment_text;
  const commentDate = new Date().toISOString();

  const query = `INSERT INTO comments (post_id, commenter_name, comment_text, comment_date) VALUES (?, ?, ?, ?)`;
  db.run(query, [postId, commenterName, commentText, commentDate], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error adding comment');
    } else {
      res.redirect('/posting');  // Redirect back to the posting page
    }
  });
});

// Likes route
router.post('/post/:post_id/like', (req, res) => {
  const postId = req.params.post_id;
  const userId = req.session.userId;  // Assuming you have user sessions

  // Check if user has already liked the post
  db.get('SELECT * FROM likes WHERE post_id = ? AND user_id = ?', [postId, userId], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Database error');
    }
    if (row) {
      // User has already liked this post
      return res.status(400).send('You have already liked this post');
    }

    // Add like to the database
    db.run('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [postId, userId], (err) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Database error');
      }

      // Increment like count on the post
      db.run('UPDATE posts SET likes = likes + 1 WHERE post_id = ?', [postId], (err) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send('Database error');
        }
        res.redirect('/posting');
      });
    });
  });
});

// Top Discussion
router.get('/top_discussion', (req, res) => {
  res.render('top_discussion');
});

// Login page
router.get('/login', (req, res) => {
  res.render('login');
});

// Signup page
router.get('/signup', (req, res) => {
  res.render('signup');
});

// Signup route
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const username = email.split('@')[0];

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword], function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        res.status(400).send('Email already exists. Please login.');
      } else {
        console.error(err.message);
        res.status(500).send('Database error');
      }
    } else {
      req.session.userId = this.lastID;
      req.session.username = username;
      res.redirect(`/profile/${this.lastID}`);
    }
  });
});

// Login route
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Database error');
    } else if (row && await bcrypt.compare(password, row.password)) {
      req.session.userId = row.id;
      req.session.username = row.username; // Store username in session
      req.session.role = row.role; // Store role in session
      res.redirect(`/profile/${row.id}`);
    } else {
      res.status(401).send('Invalid email or password');
    }
  });
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/');
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});


// Profile route
router.get('/profile/:id', (req, res) => {
  const userId = req.params.id;

  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, userRow) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Database error');
    } else {
      db.all('SELECT * FROM health_stats WHERE user_id = ?', [userId], (err, healthRows) => {
        if (err) {
          console.error(err.message);
          res.status(500).send('Database error');
        } else {
          db.all('SELECT * FROM friends WHERE user_id = ?', [userId], (err, friendRows) => {
            if (err) {
              console.error(err.message);
              res.status(500).send('Database error');
            } else {
              res.render('profile', { user: userRow, healthStats: healthRows, friends: friendRows });
            }
          });
        }
      });
    }
  });
});

// Health Tracker route
router.get('/health_tracker/:id', (req, res) => {
  const userId = req.params.id;

  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, userRow) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Database error');
    } else {
      db.get('SELECT * FROM health_stats WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId], (err, statsRow) => {
        if (err) {
          console.error(err.message);
          res.status(500).send('Database error');
        } else {
          const stats = statsRow || { calories: 0, steps: 0, mvpa: 0, sleep: 0 };
          res.render('health_tracker', { user: userRow, stats });
        }
      });
    }
  });
});

// Handle form submission for health data
router.post('/health_tracker/:id', (req, res) => {
  const userId = req.params.id;
  const { calories, steps, mvpa, sleep } = req.body;

  db.run('INSERT INTO health_stats (user_id, calories, steps, mvpa, sleep) VALUES (?, ?, ?, ?, ?)', [userId, calories, steps, mvpa, sleep], function(err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Database error');
    } else {
      res.redirect(`/health_tracker/${userId}`);
    }
  });
});

// Physical Health Page
router.get('/contents/physical-health', (req, res) => {
  // Query to fetch published articles related to physical health, ordered by publication date
  const articlesSql = 'SELECT id, title, published_at FROM articles WHERE category = "physical-health" ORDER BY published_at DESC';
  
  db.all(articlesSql, (err, articlesRows) => {
      if (err) {
          // Log and handle database error
          console.error(err.message);
          res.status(500).send('Internal Server Error');
          return;
      }

      // Map database query results to a more structured format for rendering
      const articles = articlesRows.map(row => ({
          id: row.id,
          title: row.title,
          publicationDate: row.published_at
      }));

      // Render the physical health page with fetched data
      res.render('contents/physical-health', {
          heading: 'Physical Health',
          articles
      });
  });
});

// Mental Health Page
router.get('/contents/mental-health', (req, res) => {
  // Query to fetch published articles related to physical health, ordered by publication date
  const articlesSql = 'SELECT id, title, published_at FROM articles WHERE category = "mental-health" ORDER BY published_at DESC';
  
  db.all(articlesSql, (err, articlesRows) => {
      if (err) {
          // Log and handle database error
          console.error(err.message);
          res.status(500).send('Internal Server Error');
          return;
      }

      // Map database query results to a more structured format for rendering
      const articles = articlesRows.map(row => ({
          id: row.id,
          title: row.title,
          publicationDate: row.published_at
      }));

      // Render the physical health page with fetched data
      res.render('contents/mental-health', {
          heading: 'Mental Health',
          articles
      });
  });
});

// General Disease Page
router.get('/contents/general-disease', (req, res) => {
  // Query to fetch published articles related to physical health, ordered by publication date
  const articlesSql = 'SELECT id, title, published_at FROM articles WHERE category = "general-disease" ORDER BY published_at DESC';
  
  db.all(articlesSql, (err, articlesRows) => {
      if (err) {
          // Log and handle database error
          console.error(err.message);
          res.status(500).send('Internal Server Error');
          return;
      }

      // Map database query results to a more structured format for rendering
      const articles = articlesRows.map(row => ({
          id: row.id,
          title: row.title,
          publicationDate: row.published_at
      }));

      // Render the physical health page with fetched data
      res.render('contents/general-disease', {
          heading: 'General Disease',
          articles
      });
  });
});

// Human Body Page
router.get('/contents/human-body', (req, res) => {
  // Query to fetch published articles related to physical health, ordered by publication date
  const articlesSql = 'SELECT id, title, published_at FROM articles WHERE category = "human-body" ORDER BY published_at DESC';
  
  db.all(articlesSql, (err, articlesRows) => {
      if (err) {
          // Log and handle database error
          console.error(err.message);
          res.status(500).send('Internal Server Error');
          return;
      }

      // Map database query results to a more structured format for rendering
      const articles = articlesRows.map(row => ({
          id: row.id,
          title: row.title,
          publicationDate: row.published_at
      }));

      // Render the physical health page with fetched data
      res.render('contents/human-body', {
          heading: 'Human Body',
          articles
      });
  });
});

// Medicine Page
router.get('/contents/medicine', (req, res) => {
  // Query to fetch published articles related to physical health, ordered by publication date
  const articlesSql = 'SELECT id, title, published_at FROM articles WHERE category = "medicine" ORDER BY published_at DESC';
  
  db.all(articlesSql, (err, articlesRows) => {
      if (err) {
          // Log and handle database error
          console.error(err.message);
          res.status(500).send('Internal Server Error');
          return;
      }

      // Map database query results to a more structured format for rendering
      const articles = articlesRows.map(row => ({
          id: row.id,
          title: row.title,
          publicationDate: row.published_at
      }));

      // Render the physical health page with fetched data
      res.render('contents/medicine', {
          heading: 'Medicine',
          articles
      });
  });
});

// Fitness Page
router.get('/contents/fitness', (req, res) => {
  // Query to fetch published articles related to physical health, ordered by publication date
  const articlesSql = 'SELECT id, title, published_at FROM articles WHERE category = "fitness" ORDER BY published_at DESC';
  
  db.all(articlesSql, (err, articlesRows) => {
      if (err) {
          // Log and handle database error
          console.error(err.message);
          res.status(500).send('Internal Server Error');
          return;
      }

      // Map database query results to a more structured format for rendering
      const articles = articlesRows.map(row => ({
          id: row.id,
          title: row.title,
          publicationDate: row.published_at
      }));

      // Render the physical health page with fetched data
      res.render('contents/fitness', {
          heading: 'Fitness',
          articles
      });
  });
});

// Function to call create session for admin
function isAdmin(req, res, next) {
  if (req.session.role === 'admin') {
    return next();
  } else {
    res.status(403).send('Forbidden: You do not have permission to access this page');
  }
}

router.get('/admin/home', isAdmin, (req, res) => {
  res.render('admin-home');
});

// Admin Publish GET Route
router.get('/admin/publish', isAdmin, (req, res) => {
  res.render('admin-publish');
});

// Admin Publish POST Route
router.post('/admin/publish', isAdmin, (req, res) => {
  const { title, contents, category } = req.body;

  const sql = `INSERT INTO articles (title, content, category) VALUES (?, ?, ?)`;
  const params = [title, contents, category];

  db.run(sql, params, function(err) {
    if (err) {
      console.error('Error inserting article:', err.message);
      return res.status(500).send('An error occurred while publishing the article.');
    }
    res.redirect('/admin/home'); // Redirect to the Admin Home page after successful insertion
  });
});


module.exports = router;
