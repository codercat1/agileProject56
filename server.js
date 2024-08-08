const express = require('express');
const path = require('path');
const session = require('express-session'); // Add this line
const indexRouter = require('./routes/index');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultSecretKey', // Use the environment variable
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true } // Set to true if using HTTPS
}));

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Use the routes defined in "routes/index.js"
app.use('/', indexRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
