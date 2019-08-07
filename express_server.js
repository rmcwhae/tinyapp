/* SERVER INITIALIZATION */
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

/* "DATABASES" (notice quotes…) */

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "x43d4r", visits: 0 },
  "9sm5xK": { longURL: "http://www.google.com", userID: "x43d4r", visits: 0 },
  "57fh37": { longURL: "http://www.engadget.com", userID: "gt7574", visits: 0 }
};

const users = {
  "x43d4r": {
    id: "x43d4r",
    email: "russell@a.com",
    password: "$2b$10$IRUSZoB4dctyflA4lmWhJukbQS6nMZ1FhiBLE6Ka7VCRyrjMbACqS"
  },
  "gt7574": {
    id: "gt7574",
    email: "russell@b.com",
    password: "$2b$10$LemPBJdGHiuYS5gz1LmrLeAx1TZa4mTyqK5R61OmRQvMlobgMq4Oy"
  }
};//user a pw: stuff; user b pw: things

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

const urlsForUser = function(id) {
  const ret = {};
  for (let url in urlDatabase) {
    if (id === urlDatabase[url].userID) {
      ret[url] = { "longURL": urlDatabase[url].longURL, visits: urlDatabase[url].visits };
    }
  }
  return ret;
};

const validShortUrl = function(shortURL) {
  for (let url in urlDatabase) {
    if (shortURL === url) {
      return true;
    }
  }
  return false;
};

/* GET REQUEST ROUTING */

app.get("/", (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  //filter stuff here
  let userID = req.session.user_id;
  let templateVars = {
    user: users[userID],
    urls: urlsForUser(userID),
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  if (!templateVars.user) {
    res.redirect('/login');
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  let givenShortURL = req.params.shortURL;
  if (!validShortUrl(givenShortURL)) {
    res.status(403).send('Error: Invalid Short URL.');
  } else {
    let templateVars = {
      shortURL: givenShortURL,
      longURL: urlDatabase[givenShortURL].longURL,
      user: users[req.session.user_id],
      visits: urlDatabase[givenShortURL].visits
    };
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  let givenShortURL = req.params.shortURL;
  if (!validShortUrl(givenShortURL)) {
    res.status(403).send('Error: Invalid Short URL.');
  } else {
    const longURL = urlDatabase[givenShortURL].longURL;
    //update visits count
    urlDatabase[givenShortURL].visits++;
    res.redirect(longURL);
  }
});

app.get('/register', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_register", templateVars);
});

app.get('/login', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_login", templateVars);
});

/* POST REQUEST ROUTING */

app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.user_id;// check for cookie and returns userID
  if (!userID) {
    res.redirect('/urls');
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

app.post("/urls", (req, res) => {
  // console.log(req.body);  // Log the POST request body to the console
  const userID = req.session.user_id;// check for cookie and returns userID
  // console.log('uderID', userID);
  if (!userID) {
    res.redirect('/urls');
  } else {
    let newshortID = generateRandomString();
    let newURLObj = {};
    newURLObj.longURL = req.body["longURL"];
    newURLObj.userID = userID;
    urlDatabase[newshortID] = newURLObj;
    // console.log(urlDatabase);
    res.redirect('/urls/' + newshortID);
  }
});

app.post("/urls/:id", (req, res) => {
  // console.log(req.body);  // Log the POST request body to the console
  const userID = req.session.user_id;// check for cookie and returns userID
  if (!userID) {
    res.redirect('/urls');
  } else {
    let shortcode = req.params.id;
    urlDatabase[shortcode].longURL = req.body["longURL"];//update previous long URL with data from form
    res.redirect('/urls/');
  }
});

app.post('/login', (req, res) => {
  let inputEmail = req.body["email"];
  let inputPassword = req.body["password"];
  let existingUserID = '';
  for (let userID in users) {
    if (users[userID].email === inputEmail) {
      existingUserID = userID;
    }
  }
  if (!checkForExistingEmail(inputEmail, users)) {
    res.status(403).send('Error: Email address could not be found.');
  } else if (!bcrypt.compareSync(inputPassword, users[existingUserID].password)) {
    res.status(403).send('Error: Incorrect password.');
  } else {
    // login success!
    // res.cookie('user_id', existingUserID);
    // eslint-disable-next-line camelcase
    req.session.user_id = existingUserID;
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  // res.clearCookie('user_id');
  req.session = null;
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
  users[newUserID].password = bcrypt.hashSync(req.body["password"], 10);
  // console.log(users);
  // eslint-disable-next-line camelcase
  req.session.user_id = newUserID;
  res.redirect('/urls');
});