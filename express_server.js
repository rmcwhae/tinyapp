/* SERVER INITIALIZATION */
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

/* "DATABASES" (notice quotes…) */

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};

/* FUNCTION DEFINITIONS */

const generateRandomString = function() {// adapted from https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
  let ret = "";
  let length = 6;//could also pass in as argument
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    ret += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return ret;
};

const checkForExistingEmail = function(emailToCheck, objectToCheckIn) {
  for (let userID in objectToCheckIn) {
    if (emailToCheck === objectToCheckIn[userID]["email"]) {
      return true;
    }
  }
  return false;
};

/* GET REQUEST ROUTING */

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  // console.log(urlDatabase[req.params.shortURL]);
  const longURL = urlDatabase[req.params.shortURL];//grab long URL from object
  res.redirect(longURL);
});

app.get('/register', (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_register", templateVars);
});

/* POST REQUEST ROUTING */

app.post("/urls/:shortURL/delete", (req, res) => {
  // delete from object
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {
  // console.log(req.body);  // Log the POST request body to the console
  let newshortID = generateRandomString();
  urlDatabase[newshortID] = req.body["longURL"];
  // console.log(urlDatabase);
  res.redirect('/urls/' + newshortID);
});

app.post("/urls/:id", (req, res) => {
  // console.log(req.body);  // Log the POST request body to the console
  let shortcode = req.params.id;
  urlDatabase[shortcode] = req.body["longURL"];//update previous long URL with data from form
  res.redirect('/urls/');
});

app.post('/login', (req, res) => {
  res.cookie('username', req.body["username"]);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  // req.cookies["username"]
  res.clearCookie('username');
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  if (!req.body["password"] || !req.body["email"]) {
    res.status(400).send('All fields must be filled out. Please return to the previous page and enter all required form inputs.');
  }
  if (checkForExistingEmail(req.body["email"], users)) {
    res.status(400).send('Error: Email address has already been registered. Please return to the previous page and use a different email address');
  }
  let newUserID = generateRandomString();
  users[newUserID] = {};
  users[newUserID].id = newUserID;
  users[newUserID].email = req.body["email"];
  users[newUserID].password = req.body["password"];
  // console.log(users);
  res.cookie('user_id', newUserID);
  res.redirect('/urls');
});