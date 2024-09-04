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

#Installation
-Prerequisites
-Node.js (v12 or higher)
-NPM (Node Package Manager)
-SQLite3

#Steps to Set Up Locally
1. Clone the repository: 
->  git clone https://github.com/your-repo/health-education-website.git
->  cd health-education-website 

2. Install the necessary dependencies:
->  npm install

3. Set up the database: Ensure that database.db exists in the root folder. 
If not, create it or migrate the database using the following:
->  npm run migrate

4. Start the server:
->  npm start

After starting the server, you can access the website 
by navigating to http://localhost:3000 in your browser.


!Precautions
- Activities pages: calendar only save, display and edit notes when there is activity date entered in the chosen date. 