// server.js
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse incoming request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Helper function: load CSV file and parse its contents
function loadCSV() {
  const csvFilePath = path.join(__dirname, 'Class_List_MLBM.csv');
  const csvFile = fs.readFileSync(csvFilePath, 'utf8');
  const parsed = Papa.parse(csvFile, { header: true });
  return parsed.data;
}

// Helper function: update CSV file with new data
function saveCSV(data) {
  const csv = Papa.unparse(data);
  const csvFilePath = path.join(__dirname, 'Class_List_MLBM.csv');
  fs.writeFileSync(csvFilePath, csv, 'utf8');
}

// Login API endpoint
app.post('/api/login', (req, res) => {
  const { email, pgid } = req.body;
  if (!email || !pgid) {
    return res.status(400).json({ success: false, message: 'Email and PGID are required.' });
  }
  const users = loadCSV();
  // Perform a case-insensitive search for the email and exact match for pgid
  const user = users.find(u => 
    u["Email IDs"] && u["Email IDs"].trim().toLowerCase() === email.trim().toLowerCase() &&
    u["PGIDs"] === pgid
  );
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// Signup API endpoint
app.post('/api/signup', (req, res) => {
  const { name, email, pgid, group } = req.body;
  if (!name || !email || !pgid || !group) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }
  
  const users = loadCSV();
  // Check if email already exists (case-insensitive)
  const exists = users.find(u => u["Email IDs"] && u["Email IDs"].trim().toLowerCase() === email.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ success: false, message: "Email already registered." });
  }
  
  // Create a new user record
  const newUser = {
    "Name": name,
    "Email IDs": email,
    "PGIDs": pgid,
    "Group IDs": group
  };
  users.push(newUser);
  
  try {
    saveCSV(users);
    res.json({ success: true, message: "Signup successful!" });
  } catch (error) {
    console.error("Error updating CSV:", error);
    res.status(500).json({ success: false, message: "Server error during signup." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
