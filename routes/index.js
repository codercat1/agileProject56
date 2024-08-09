const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../db'); // Assuming you created db.js for modularization

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

// All Topics
router.get('/all-topics', (req, res) => {
  res.render('all_topics');
});

// Contents
router.get('/contents', (req, res) => {
  res.render('contents');
});


// Posting
router.get('/posting', (req, res) => {
  res.render('posting');
});


// Top Discussion
router.get('/top_discussion', (req, res) => {
  res.render('top_discussion');
});

// Login
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
router.get('/physical-health', (req, res) => {
  const articles = [
      { id: 1, title: 'Benefits of Exercise', publicationDate: '2024-07-15T12:00:00Z' },
      { id: 2, title: 'Healthy Eating Habits', publicationDate: '2024-08-01T15:30:00Z' },
      { id: 3, title: 'Mental Health and Fitness', publicationDate: '2024-08-05T10:00:00Z' }
  ];

  res.render('contents/physical-health', {
      heading: 'Physical Health',
      articles
  });
});

// Mental Health Page
router.get('/mental-health', (req, res) => {
  const articles = [
      { id: 1, title: 'Benefits of Exercise', publicationDate: '2024-07-15T12:00:00Z' },
      { id: 2, title: 'Healthy Eating Habits', publicationDate: '2024-08-01T15:30:00Z' },
      { id: 3, title: 'Mental Health and Fitness', publicationDate: '2024-08-05T10:00:00Z' }
  ];

  res.render('contents/mental-health', {
      heading: 'Mental Health',
      articles
  });
});

// General Disease Page
router.get('/general-disease', (req, res) => {
  const articles = [
      { id: 1, title: 'Benefits of Exercise', publicationDate: '2024-07-15T12:00:00Z' },
      { id: 2, title: 'Healthy Eating Habits', publicationDate: '2024-08-01T15:30:00Z' },
      { id: 3, title: 'Mental Health and Fitness', publicationDate: '2024-08-05T10:00:00Z' }
  ];

  res.render('contents/general-disease', {
      heading: 'General Disease',
      articles
  });
});

// Physical Health Page
router.get('/human-body', (req, res) => {
  const articles = [
      { id: 1, title: 'Benefits of Exercise', publicationDate: '2024-07-15T12:00:00Z' },
      { id: 2, title: 'Healthy Eating Habits', publicationDate: '2024-08-01T15:30:00Z' },
      { id: 3, title: 'Mental Health and Fitness', publicationDate: '2024-08-05T10:00:00Z' }
  ];

  res.render('contents/human-body', {
      heading: 'Human Body',
      articles
  });
});

// Physical Health Page
router.get('/medicine', (req, res) => {
  const articles = [
      { id: 1, title: 'Benefits of Exercise', publicationDate: '2024-07-15T12:00:00Z' },
      { id: 2, title: 'Healthy Eating Habits', publicationDate: '2024-08-01T15:30:00Z' },
      { id: 3, title: 'Mental Health and Fitness', publicationDate: '2024-08-05T10:00:00Z' }
  ];

  res.render('contents/medicine', {
      heading: 'Medicine',
      articles
  });
});

// Physical Health Page
router.get('/fitness', (req, res) => {
  const articles = [
      { id: 1, title: 'Benefits of Exercise', publicationDate: '2024-07-15T12:00:00Z' },
      { id: 2, title: 'Healthy Eating Habits', publicationDate: '2024-08-01T15:30:00Z' },
      { id: 3, title: 'Mental Health and Fitness', publicationDate: '2024-08-05T10:00:00Z' }
  ];

  res.render('contents/fitness', {
      heading: 'fitness',
      articles
  });
});



module.exports = router;
