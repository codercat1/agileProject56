const express = require('express');
const router = express.Router();

// Home page
router.get('/', (req, res) => {
    res.render('health_tracker', { username: 'Username' });
});

// Monthly Record
router.get('/activities', (req, res) => {
    res.render('activities');
});

// All Topics
router.get('/all-topics', (req, res) => {
    res.render('all_topics');
});

// contents
router.get('/contents', (req, res) => {
    res.render('contents');
});

// Login/Signup
router.get('/login', (req, res) => {
    res.render('login');
});

// Posting
router.get('/posting', (req, res) => {
    res.render('posting');
});

// Profile
router.get('/profile', (req, res) => {
    res.render('profile', { username: 'Username' });
});

// top_discussion
router.get('/top_discussion', (req, res) => {
    res.render('top_discussion');
});

module.exports = router;
