const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../db'); // Assuming you created db.js for modularization
const multer = require('multer');
const path = require('path');

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

// Set storage engine for multer
const storage = multer.diskStorage({
  destination: './uploads/', // Directory to save the uploaded files
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // Limit file size to 1MB
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
}).single('image'); // 'image' should match the name attribute in your form

// Check file type function
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}

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

// Updated Posting route to include user_id
router.post('/posting', upload, (req, res) => {
  const { title, body } = req.body;
  const userId = req.session.userId; // Get the user ID from the session
  const username = req.session.username; // Get the username from the session
  const publishedAt = new Date().toISOString(); // Get current date and time

  // Check if title and body are provided
  if (!title || !body) {
      return res.status(400).send('Title and body are required');
  }

  // Ensure user is authenticated
  if (!userId) {
    return res.status(401).send('User not authenticated');
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null; // Check if image was uploaded

  db.run(
    'INSERT INTO posts (user_id, title, content, image_url, username, published_at) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, title, body, imageUrl, username, publishedAt],
    (err) => {
      if (err) {
        console.error('Database insert error:', err.message);
        return res.status(500).send(err.message);
      }
      res.redirect('/posting');
    }
  );
});

// Comments Routes
router.post('/post/:post_id/comment', (req, res) => {
  const postId = req.params.post_id;
  const commenterName = req.session.username;
  const commentText = req.body.comment_text;
  const commentDate = new Date().toISOString();

  const query = `INSERT INTO comments (post_id, commenter_name, comment_text, comment_date) VALUES (?, ?, ?, ?)`;
  db.run(query, [postId, commenterName, commentText, commentDate], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error adding comment');
    } else {
      res.redirect('/posting');
    }
  });
});

router.post('/communities/physical-health/:post_id/comment', (req, res) => {
  const postId = req.params.post_id;
  const commenterName = req.session.username;
  const commentText = req.body.comment_text;
  const commentDate = new Date().toISOString();

  const query = `INSERT INTO community_comments (post_id, commenter_name, category, comment_text, comment_date) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [postId, commenterName, 'physical-health', commentText, commentDate], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error adding comment');
    } else {
      res.redirect('/communities/physical-health');
    }
  });
});

router.post('/communities/mental-health/:post_id/comment', (req, res) => {
  const postId = req.params.post_id;
  const commenterName = req.session.username;
  const commentText = req.body.comment_text;
  const commentDate = new Date().toISOString();

  const query = `INSERT INTO community_comments (post_id, commenter_name, category, comment_text, comment_date) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [postId, commenterName, 'mental-health', commentText, commentDate], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error adding comment');
    } else {
      res.redirect('/communities/mental-health');
    }
  });
});

router.post('/communities/general-diseases/:post_id/comment', (req, res) => {
  const postId = req.params.post_id;
  const commenterName = req.session.username;
  const commentText = req.body.comment_text;
  const commentDate = new Date().toISOString();

  const query = `INSERT INTO community_comments (post_id, commenter_name, category, comment_text, comment_date) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [postId, commenterName, 'general-diseases', commentText, commentDate], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error adding comment');
    } else {
      res.redirect('/communities/general-diseases');
    }
  });
});

router.post('/communities/human-body/:post_id/comment', (req, res) => {
  const postId = req.params.post_id;
  const commenterName = req.session.username;
  const commentText = req.body.comment_text;
  const commentDate = new Date().toISOString();

  const query = `INSERT INTO community_comments (post_id, commenter_name, category, comment_text, comment_date) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [postId, commenterName, 'human-body', commentText, commentDate], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error adding comment');
    } else {
      res.redirect('/communities/human-body');
    }
  });
});

router.post('/communities/medicine/:post_id/comment', (req, res) => {
  const postId = req.params.post_id;
  const commenterName = req.session.username;
  const commentText = req.body.comment_text;
  const commentDate = new Date().toISOString();

  const query = `INSERT INTO community_comments (post_id, commenter_name, category, comment_text, comment_date) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [postId, commenterName, 'medicine', commentText, commentDate], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error adding comment');
    } else {
      res.redirect('/communities/medicine');
    }
  });
});

router.post('/communities/fitness/:post_id/comment', (req, res) => {
  const postId = req.params.post_id;
  const commenterName = req.session.username;
  const commentText = req.body.comment_text;
  const commentDate = new Date().toISOString();

  const query = `INSERT INTO community_comments (post_id, commenter_name, category, comment_text, comment_date) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [postId, commenterName, 'fitness', commentText, commentDate], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error adding comment');
    } else {
      res.redirect('/communities/fitness');
    }
  });
});

// Likes route for My Feed page
router.post('/post/:post_id/like', (req, res) => {
  const postId = req.params.post_id;
  const userId = req.session.userId;

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

// Likes route for Physical Health community page
router.post('/communities/physical-health/:post_id/like', (req, res) => {
  const postId = req.params.post_id;
  const userId = req.session.userId;

  // Check if user has already liked the post
  db.get('SELECT * FROM community_likes WHERE post_id = ? AND user_id = ?', [postId, userId], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Database error');
    }
    if (row) {
      // User has already liked this post
      return res.status(400).send('You have already liked this post');
    }

    // Add like to the database
    db.run('INSERT INTO community_likes (post_id, user_id) VALUES (?, ?)', [postId, userId], (err) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Database error');
      }

      // Increment like count on the post
      db.run('UPDATE community_posts SET likes = likes + 1 WHERE post_id = ?', [postId], (err) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send('Database error');
        }
        res.redirect('/communities/physical-health');
      });
    });
  });
});

// Likes route for Mental Health community page
router.post('/communities/mental-health/:post_id/like', (req, res) => {
  const postId = req.params.post_id;
  const userId = req.session.userId;

  // Check if user has already liked the post
  db.get('SELECT * FROM community_likes WHERE post_id = ? AND user_id = ?', [postId, userId], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Database error');
    }
    if (row) {
      // User has already liked this post
      return res.status(400).send('You have already liked this post');
    }

    // Add like to the database
    db.run('INSERT INTO community_likes (post_id, user_id) VALUES (?, ?)', [postId, userId], (err) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Database error');
      }

      // Increment like count on the post
      db.run('UPDATE community_posts SET likes = likes + 1 WHERE post_id = ?', [postId], (err) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send('Database error');
        }
        res.redirect('/communities/mental-health');
      });
    });
  });
});

// Likes route for General Diseases community page
router.post('/communities/general-diseases/:post_id/like', (req, res) => {
  const postId = req.params.post_id;
  const userId = req.session.userId;

  // Check if user has already liked the post
  db.get('SELECT * FROM community_likes WHERE post_id = ? AND user_id = ?', [postId, userId], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Database error');
    }
    if (row) {
      // User has already liked this post
      return res.status(400).send('You have already liked this post');
    }

    // Add like to the database
    db.run('INSERT INTO community_likes (post_id, user_id) VALUES (?, ?)', [postId, userId], (err) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Database error');
      }

      // Increment like count on the post
      db.run('UPDATE community_posts SET likes = likes + 1 WHERE post_id = ?', [postId], (err) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send('Database error');
        }
        res.redirect('/communities/general-diseases');
      });
    });
  });
});

// Likes route for Human Body community page
router.post('/communities/human-body/:post_id/like', (req, res) => {
  const postId = req.params.post_id;
  const userId = req.session.userId;

  // Check if user has already liked the post
  db.get('SELECT * FROM community_likes WHERE post_id = ? AND user_id = ?', [postId, userId], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Database error');
    }
    if (row) {
      // User has already liked this post
      return res.status(400).send('You have already liked this post');
    }

    // Add like to the database
    db.run('INSERT INTO community_likes (post_id, user_id) VALUES (?, ?)', [postId, userId], (err) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Database error');
      }

      // Increment like count on the post
      db.run('UPDATE community_posts SET likes = likes + 1 WHERE post_id = ?', [postId], (err) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send('Database error');
        }
        res.redirect('/communities/human-body');
      });
    });
  });
});

// Likes route for Medicine community page
router.post('/communities/medicine/:post_id/like', (req, res) => {
  const postId = req.params.post_id;
  const userId = req.session.userId;

  // Check if user has already liked the post
  db.get('SELECT * FROM community_likes WHERE post_id = ? AND user_id = ?', [postId, userId], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Database error');
    }
    if (row) {
      // User has already liked this post
      return res.status(400).send('You have already liked this post');
    }

    // Add like to the database
    db.run('INSERT INTO community_likes (post_id, user_id) VALUES (?, ?)', [postId, userId], (err) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Database error');
      }

      // Increment like count on the post
      db.run('UPDATE community_posts SET likes = likes + 1 WHERE post_id = ?', [postId], (err) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send('Database error');
        }
        res.redirect('/communities/medicine');
      });
    });
  });
});

// Likes route for Fitness community page
router.post('/communities/fitness/:post_id/like', (req, res) => {
  const postId = req.params.post_id;
  const userId = req.session.userId;

  // Check if user has already liked the post
  db.get('SELECT * FROM community_likes WHERE post_id = ? AND user_id = ?', [postId, userId], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Database error');
    }
    if (row) {
      // User has already liked this post
      return res.status(400).send('You have already liked this post');
    }

    // Add like to the database
    db.run('INSERT INTO community_likes (post_id, user_id) VALUES (?, ?)', [postId, userId], (err) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Database error');
      }

      // Increment like count on the post
      db.run('UPDATE community_posts SET likes = likes + 1 WHERE post_id = ?', [postId], (err) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send('Database error');
        }
        res.redirect('/communities/fitness');
      });
    });
  });
});

// Communities Homepage
router.get('/communities', (req, res) => {
  res.render('communities');
});

// Physical Health Community page
router.post('/communities/physical-health', (req, res) => {
  const { title, body } = req.body;
  const userId = req.session.userId; // Get the user ID from the session
  const username = req.session.username; // Get the username from the session
  const publishedAt = new Date().toISOString(); // Get current date and time

  // Check if title and body are provided
  if (!title || !body) {
      return res.status(400).send('Title and body are required');
  }

  // Ensure user is authenticated
  if (!userId) {
    return res.status(401).send('User not authenticated');
  }

  db.run(
    'INSERT INTO community_posts (category, user_id, title, content, username, published_at) VALUES (?, ?, ?, ?, ?, ?)',
    ['physical-health', userId, title, body, username, publishedAt],
    (err) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.redirect('/communities/physical-health');
    }
  );
});

router.get('/communities/physical-health', (req, res) => {
  db.all('SELECT * FROM community_posts WHERE category = "physical-health" ORDER BY published_at DESC', (err, community_posts) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Database error');
    }

    db.all('SELECT * FROM community_comments WHERE category = "physical-health" ORDER BY comment_date ASC', (err, community_comments) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Database error');
      }
      res.render('communities/physical-health', { community_posts, community_comments });
    });
  });
});

// Mental Health Community page
router.post('/communities/mental-health', (req, res) => {
  const { title, body } = req.body;
  const userId = req.session.userId; // Get the user ID from the session
  const username = req.session.username; // Get the username from the session
  const publishedAt = new Date().toISOString(); // Get current date and time

  // Check if title and body are provided
  if (!title || !body) {
      return res.status(400).send('Title and body are required');
  }

  // Ensure user is authenticated
  if (!userId) {
    return res.status(401).send('User not authenticated');
  }

  db.run(
    'INSERT INTO community_posts (category, user_id, title, content, username, published_at) VALUES (?, ?, ?, ?, ?, ?)',
    ['mental-health', userId, title, body, username, publishedAt],
    (err) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.redirect('/communities/mental-health');
    }
  );
});

router.get('/communities/mental-health', (req, res) => {
  db.all('SELECT * FROM community_posts WHERE category = "mental-health" ORDER BY published_at DESC', (err, community_posts) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Database error');
    }

    db.all('SELECT * FROM community_comments WHERE category = "mental-health" ORDER BY comment_date ASC', (err, community_comments) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Database error');
      }
      res.render('communities/mental-health', { community_posts, community_comments });
    });
  });
});

// General Diseases Community page
router.post('/communities/general-diseases', (req, res) => {
  const { title, body } = req.body;
  const userId = req.session.userId; // Get the user ID from the session
  const username = req.session.username; // Get the username from the session
  const publishedAt = new Date().toISOString(); // Get current date and time

  // Check if title and body are provided
  if (!title || !body) {
      return res.status(400).send('Title and body are required');
  }

  // Ensure user is authenticated
  if (!userId) {
    return res.status(401).send('User not authenticated');
  }

  db.run(
    'INSERT INTO community_posts (category, user_id, title, content, username, published_at) VALUES (?, ?, ?, ?, ?, ?)',
    ['general-diseases', userId, title, body, username, publishedAt],
    (err) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.redirect('/communities/general-diseases');
    }
  );
});

router.get('/communities/general-diseases', (req, res) => {
  db.all('SELECT * FROM community_posts WHERE category = "general-diseases" ORDER BY published_at DESC', (err, community_posts) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Database error');
    }

    db.all('SELECT * FROM community_comments WHERE category = "general-diseases" ORDER BY comment_date ASC', (err, community_comments) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Database error');
      }
      res.render('communities/general-diseases', { community_posts, community_comments });
    });
  });
});

// Human Body Community page
router.post('/communities/human-body', (req, res) => {
  const { title, body } = req.body;
  const userId = req.session.userId; // Get the user ID from the session
  const username = req.session.username; // Get the username from the session
  const publishedAt = new Date().toISOString(); // Get current date and time

  // Check if title and body are provided
  if (!title || !body) {
      return res.status(400).send('Title and body are required');
  }

  // Ensure user is authenticated
  if (!userId) {
    return res.status(401).send('User not authenticated');
  }

  db.run(
    'INSERT INTO community_posts (category, user_id, title, content, username, published_at) VALUES (?, ?, ?, ?, ?, ?)',
    ['human-body', userId, title, body, username, publishedAt],
    (err) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.redirect('/communities/human-body');
    }
  );
});

router.get('/communities/human-body', (req, res) => {
  db.all('SELECT * FROM community_posts WHERE category = "human-body" ORDER BY published_at DESC', (err, community_posts) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Database error');
    }

    db.all('SELECT * FROM community_comments WHERE category = "human-body" ORDER BY comment_date ASC', (err, community_comments) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Database error');
      }
      res.render('communities/human-body', { community_posts, community_comments });
    });
  });
});

// Medicine Community page
router.post('/communities/medicine', (req, res) => {
  const { title, body } = req.body;
  const userId = req.session.userId; // Get the user ID from the session
  const username = req.session.username; // Get the username from the session
  const publishedAt = new Date().toISOString(); // Get current date and time

  // Check if title and body are provided
  if (!title || !body) {
      return res.status(400).send('Title and body are required');
  }

  // Ensure user is authenticated
  if (!userId) {
    return res.status(401).send('User not authenticated');
  }

  db.run(
    'INSERT INTO community_posts (category, user_id, title, content, username, published_at) VALUES (?, ?, ?, ?, ?, ?)',
    ['medicine', userId, title, body, username, publishedAt],
    (err) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.redirect('/communities/medicine');
    }
  );
});

router.get('/communities/medicine', (req, res) => {
  db.all('SELECT * FROM community_posts WHERE category = "medicine" ORDER BY published_at DESC', (err, community_posts) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Database error');
    }

    db.all('SELECT * FROM community_comments WHERE category = "medicine" ORDER BY comment_date ASC', (err, community_comments) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Database error');
      }
      res.render('communities/medicine', { community_posts, community_comments });
    });
  });
});

// Fitness community page
router.post('/communities/fitness', (req, res) => {
  const { title, body } = req.body;
  const userId = req.session.userId; // Get the user ID from the session
  const username = req.session.username; // Get the username from the session
  const publishedAt = new Date().toISOString(); // Get current date and time

  // Check if title and body are provided
  if (!title || !body) {
      return res.status(400).send('Title and body are required');
  }

  // Ensure user is authenticated
  if (!userId) {
    return res.status(401).send('User not authenticated');
  }

  db.run(
    'INSERT INTO community_posts (category, user_id, title, content, username, published_at) VALUES (?, ?, ?, ?, ?, ?)',
    ['fitness', userId, title, body, username, publishedAt],
    (err) => {
      if (err) {
        return res.status(500).send(err.message);
      }
      res.redirect('/communities/fitness');
    }
  );
});

router.get('/communities/fitness', (req, res) => {
  db.all('SELECT * FROM community_posts WHERE category = "fitness" ORDER BY published_at DESC', (err, community_posts) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Database error');
    }

    db.all('SELECT * FROM community_comments WHERE category = "fitness" ORDER BY comment_date ASC', (err, community_comments) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Database error');
      }
      res.render('communities/fitness', { community_posts, community_comments });
    });
  });
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

// Updated profile route with joined query to fetch friend's username
router.get('/profile/:id', (req, res) => {
  const userId = req.params.id;
  const loggedInUserId = req.session.userId;

  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, userRow) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Database error');
    } else if (!userRow) {
      res.status(404).send('User not found');
    } else {
      db.all('SELECT * FROM posts WHERE user_id = ? ORDER BY published_at DESC', [userId], (err, userPosts) => {
        if (err) {
          console.error(err.message);
          res.status(500).send('Database error');
        } else {
          // Fetch friends with join
          db.all(`
            SELECT users.username, friends.id AS friendId 
            FROM friends 
            JOIN users ON friends.friend_id = users.id 
            WHERE friends.user_id = ?`, 
            [userId], 
            (err, friendRows) => {
              if (err) {
                console.error(err.message);
                res.status(500).send('Database error');
              } else {
                res.render('profile', { 
                  user: userRow, 
                  posts: userPosts, 
                  friends: friendRows,
                  loggedInUserId: loggedInUserId, // Pass loggedInUserId to the template
                });
              }
            }
          );
        }
      });
    }
  });
});


//route to search for friend
router.post('/search-friend', (req, res) => {
  const searchQuery = req.body.username; // Use body to get the search query

  db.all('SELECT id, username FROM users WHERE username LIKE ?', [`%${searchQuery}%`], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Server Error' });
    }

    // Send the results as a JSON response
    res.json({ results: rows || [] });

  });
});

// Route to handle adding a new friend
router.post('/add-friend', (req, res) => {
  const friendId = req.body.friendId;
  const userId = req.session.userId; // Assuming the user is logged in and userId is stored in session

  // Ensure that the user is logged in
  if (!userId) {
    return res.redirect('/login');
  }

  // Insert the new friend into the 'friends' table
  db.run('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)', [userId, friendId], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Database error');
    }
    
    // Redirect back to the profile page after adding a friend
    res.redirect(`/profile/${userId}`);
  });
});


// Route to handle removing a friend
router.post('/remove-friend/:id', (req, res) => {
  const friendId = req.params.id;
  const userId = req.session.userId; // Assuming the user is logged in and userId is stored in session

  // Ensure that the user is logged in
  if (!userId) {
    return res.redirect('/login');
  }

  // Delete the friend from the 'friends' table
  db.run('DELETE FROM friends WHERE id = ? AND user_id = ?', [friendId, userId], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Database error');
    }

    // Redirect back to the profile page after removing the friend
    res.redirect(`/profile/${userId}`);
  });
});

// route to get health data & notes for a specific date
router.get('/get-health-data', (req, res) => {
  const date = req.query.date;

  console.log(`Fetching health data for date: ${date}`);

  // Query the database for health stats on the specified date
  db.all('SELECT * FROM health_stats WHERE date = ?', [date], (err, rows) => {
      if (err) {
          console.error('Error fetching health data:', err.message);
          return res.status(500).json({ error: 'Failed to retrieve health data' });
      }

      console.log('Health data fetched:', rows);
      // Return the health stats as JSON
      res.json(rows);
  });
});

// route to save notes for a specific date
router.post('/save-notes', (req, res) => {
  const { date, notes } = req.body;

  //debug to check note saved 
  console.log(`Saving note for date: ${date}`);
  console.log(`Note content: ${notes}`);

  db.run('UPDATE health_stats SET notes = ? WHERE date = ?', [notes, date], function (err) {
      if (err) {
          console.error('Error saving note:', err.message);
          return res.status(500).json({ error: 'Failed to save notes' });
      }

      console.log('Note saved successfully');
      res.json({ success: true });
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
      db.all('SELECT * FROM health_stats WHERE user_id = ? ORDER BY id DESC', [userId], (err, healthRows) => {
        if (err) {
          console.error(err.message);
          res.status(500).send('Database error');
        } else {
          const stats = healthRows[0] || { calories: 0, steps: 0, mvpa: 0, sleep: 0 };
          db.all('SELECT * FROM friends WHERE user_id = ?', [userId], (err, friendRows) => {
            if (err) {
              console.error(err.message);
              res.status(500).send('Database error');
            } else {
              res.render('health_tracker', { user: userRow, stats, healthStats: healthRows, friends: friendRows });
            }
          });
        }
      });
    }
  });
});

// Handle form submission for health data
router.post('/health_tracker/:id', (req, res) => {
  const userId = req.params.id;
  const { calories, steps, mvpa, sleep, stat_date } = req.body;

  db.run('INSERT INTO health_stats (user_id, calories, steps, mvpa, sleep, date) VALUES (?, ?, ?, ?, ?, ?)', [userId, calories, steps, mvpa, sleep, stat_date], function(err) {    if (err) {
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

// Route to render the admin home page
router.get('/admin/home', isAdmin, (req, res) => {
  const query = `SELECT id, title, category, content, published_at FROM articles ORDER BY published_at DESC`;

  db.all(query, [], (err, articles) => {
    if (err) {
      return res.status(500).send(`Internal Server Error: ${err.message}`);
    }

    res.render('admin/admin-home', { user: req.session.user, articles });
  });
});

// Route to handle article deletion
router.post('/admin/delete/:id', isAdmin, (req, res) => {
  const articleId = req.params.id;

  const deleteQuery = `DELETE FROM articles WHERE id = ?`;

  db.run(deleteQuery, articleId, function(err) {
    if (err) {
      return res.status(500).send(`Internal Server Error: ${err.message}`);
    }

    res.redirect('/admin/home');
  });
});


// Admin Publish GET Route
router.get('/admin/publish', isAdmin, (req, res) => {
  res.render('admin/admin-publish');
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
    res.redirect('/admin/home'); 
  });
});

router.get('/article/:id', (req, res) => {
  const articleId = req.params.id;

  // Query the database to find the article by ID
  db.get('SELECT * FROM articles WHERE id = ?', [articleId], (err, row) => {
      if (err) {
          console.error(err.message);
          return res.status(500).send('Server error');
      }

      if (!row) {
          return res.status(404).send('Article not found');
      }

      // Render the article-view.ejs template with the article data
      res.render('contents/article-view.ejs', { article: row });
  });
});


module.exports = router;