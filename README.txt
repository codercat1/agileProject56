###Health Education Website
##Project Overview##
This project is a health education website that provides various functionalities for tracking health activities, posting health-related content, and accessing health information. The website has an integrated calendar and user profile management system, among other features.

#Features
-User Authentication (login, register)
-Posting health-related content
-Health activity tracker
-Calendar for tracking activities
-Profile management
-Sidebar for navigation (customizable and toggleable with hamburger button)
-Database integration for persistent data storage

1. Install the necessary dependencies:
copy this line to install the necessary dependencies
-> npm install node.js sqlite3 bcrypt multer express express-session ejs

node.js
sqlite3
bcrypt
multer
express
express-session
ejs

2. Set up the database: Ensure that database.db exists in the root folder. 
If not, create it or migrate the database using the following:
->  node database.js

3. Start the server:
->  npm run start

After starting the server, you can access the website 
by navigating to http://localhost:3000 in your browser.


!Precautions
- Activities pages: calendar only save, display and edit notes when there is activity date entered in the chosen date. 

Admin Account Log In Details
email: admin@example.com
password: admin_password

Only admin dashboard button can be seen by admin account via bottom of the contents page,
normal users will not have the admin dashboard button appearing on the bottom of their contents page