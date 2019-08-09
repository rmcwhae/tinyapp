/* SERVER INITIALIZATION */
const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const { generateRandomString, getUserByEmail, urlsForUser, validShortUrl, filterVisitsByShortURL } = require('./helpers');
const serverStartTime = new Date();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['key1acnbcbbc', 'key2acnacnacn'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(methodOverride('_method'));

/* "DATABASES" (notice quotes…) */

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "x43d4r", totalVisits: 3, uniqueVisits: 0, date: serverStartTime },
  "9sm5xK": { longURL: "http://www.google.com", userID: "x43d4r", totalVisits: 3, uniqueVisits: 0, date: serverStartTime },
  "57fh37": { longURL: "http://www.engadget.com", userID: "gt7574", totalVisits: 3, uniqueVisits: 0, date: serverStartTime }
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
};//user a pw plaintext: stuff; user b pw plaintext: things

const allVisits = {
  'fghfy8': { visitorId: 'fghfy8', visitDate: serverStartTime, shortURLVisited: "b2xVn2" },
  '9ud75h': { visitorId: '9ud75h', visitDate: serverStartTime, shortURLVisited: "b2xVn2" },
  'f85ur7': { visitorId: 'f85ur7', visitDate: serverStartTime, shortURLVisited: "b2xVn2" },
  '85ht7r': { visitorId: '85ht7r', visitDate: serverStartTime, shortURLVisited: "9sm5xK" }
};

/* GET REQUEST ROUTING */

app.get("/", (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

app.get("/urls", (req, res) => {
  let userID = req.session.user_id;
  let templateVars = {
    user: users[userID],
    urls: urlsForUser(userID, urlDatabase),
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
  const userID = req.session.user_id;
  if (!userID) {
    res.status(403).send('Error: You must be logged in to view this page.');
  } else if (!validShortUrl(givenShortURL, urlDatabase)) {
    res.status(403).send('Error: Invalid Short URL.');
  } else if (userID !== urlDatabase[req.params.shortURL].userID) {
    res.status(403).send('Error: You do not have access to this short URL.');
  } else {
    let templateVars = {
      shortURL: givenShortURL,
      longURL: urlDatabase[givenShortURL].longURL,
      user: users[userID],
      uniqueVisits: urlDatabase[givenShortURL].uniqueVisits,
      date: urlDatabase[givenShortURL].date,
      allVisits: filterVisitsByShortURL(givenShortURL, allVisits),
      visits: urlDatabase[givenShortURL].totalVisits
    };
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  let givenShortURL = req.params.shortURL;
  if (!validShortUrl(givenShortURL, urlDatabase)) {
    res.status(403).send('Error: Invalid Short URL.');
  } else {
    const longURL = urlDatabase[givenShortURL].longURL;
    // add a newVisit entry
    let newVisit = {};
    let newVisitID = generateRandomString();
    newVisit.visitorId = newVisitID;
    newVisit.visitDate = new Date();
    newVisit.shortURLVisited = givenShortURL;
    allVisits[newVisitID] = newVisit;
    if (!req.cookies[givenShortURL]) {// no cookie from previous visits
      res.cookie(givenShortURL, new Date());
      urlDatabase[givenShortURL].uniqueVisits++;
    } else { //let's see how old this cookie is
      let now = new Date();
      let lastVisitTimeFromCookie = req.cookies[givenShortURL];// bad idea to store info in cookies and not server side, but this is just an exercise
      // below code adapted from https://stackoverflow.com/questions/7709803/javascript-get-minutes-between-two-dates
      let dateDifference = Date.parse(now) - Date.parse(lastVisitTimeFromCookie);
      let dateDifferenceInMinutes = Math.round(((dateDifference % 86400000) % 3600000) / 60000);
      if (dateDifferenceInMinutes > 30) {// for the same person/device visiting a website (existing cookie), give 30 min timeout before considering unique visits per https://matomo.org/faq/general/faq_21418/
        res.cookie(givenShortURL, new Date());
        urlDatabase[givenShortURL].uniqueVisits++;
      }
      res.cookie(givenShortURL, new Date());
    }
    urlDatabase[givenShortURL].totalVisits++;
    res.redirect(longURL);
  }
});

app.get('/register', (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    res.redirect('/urls');
  } else {
    let templateVars = {
      user: users[req.session.user_id]
    };
    res.render("urls_register", templateVars);
  }
});

app.get('/login', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_login", templateVars);
});

/* POST REQUEST ROUTING */

app.delete("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.status(403).send('Error: You must be logged in to view this page.');
  } else if (userID !== urlDatabase[req.params.shortURL].userID) {
    res.status(403).send('Error: You do not have access to this short URL.');
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.status(403).send('Error: You must be logged in to view this page.');
  } else {
    let newshortID = generateRandomString();
    let newURLObj = {};
    newURLObj.longURL = req.body["longURL"];
    newURLObj.userID = userID;
    newURLObj.totalVisits = 0;
    newURLObj.uniqueVisits = 0;
    newURLObj.date = new Date();
    urlDatabase[newshortID] = newURLObj;
    res.redirect('/urls/' + newshortID);
  }
});

app.put("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.status(403).send('Error: You must be logged in to perform this action.');
  } else if (userID !== urlDatabase[req.params.id].userID) {
    res.status(403).send('Error: You do not have access to this short URL.');
  } else {
    let shortcode = req.params.id;
    urlDatabase[shortcode].longURL = req.body["longURL"];//update previous long URL with new long URL
    res.redirect('/urls/');
  }
});

app.post('/login', (req, res) => {
  let inputEmail = req.body["email"];
  let inputPassword = req.body["password"];
  let existingUserID = getUserByEmail(inputEmail, users);
  if (!inputEmail || !inputPassword) {
    res.status(403).send('Error: Both fields in the form are required.');
  } else if (!existingUserID) {
    res.status(403).send('Error: Email address could not be found.');
  } else if (!bcrypt.compareSync(inputPassword, users[existingUserID].password)) {
    res.status(403).send('Error: Incorrect password.');
  } else {
    // eslint-disable-next-line camelcase
    req.session.user_id = existingUserID;
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  if (!req.body["password"] || !req.body["email"]) {
    res.status(400).send('All fields must be filled out. Please return to the previous page and enter all required form inputs.');
  } else if (getUserByEmail(req.body["email"], users)) {
    res.status(400).send('Error: Email address has already been registered. Please return to the previous page and use a different email address');
  } else {
    let newUserID = generateRandomString();
    users[newUserID] = {};
    users[newUserID].id = newUserID;
    users[newUserID].email = req.body["email"];
    users[newUserID].password = bcrypt.hashSync(req.body["password"], 10);
    // eslint-disable-next-line camelcase
    req.session.user_id = newUserID;
    res.redirect('/urls');
  }
});

/* RUN THE SERVER */

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});