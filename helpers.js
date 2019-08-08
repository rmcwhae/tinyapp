/* FUNCTION DECLARATIONS */

const generateRandomString = function() {// adapted from https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
  let ret = "";
  let length = 6;//could also pass in as argument
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    ret += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return ret;
};

const getUserByEmail = function(emailToCheck, objectToCheckIn) {
  let ret = '';
  for (let userID in objectToCheckIn) {
    if (emailToCheck === objectToCheckIn[userID]["email"]) {
      ret = userID;
    }
  }
  return ret;
};

const urlsForUser = function(id, objectToCheckIn) {
  const ret = {};
  for (let url in objectToCheckIn) {
    if (id === objectToCheckIn[url].userID) {
      ret[url] = { "longURL": objectToCheckIn[url].longURL, visits: objectToCheckIn[url].visits, date: objectToCheckIn[url].date };
    }
  }
  return ret;
};

const validShortUrl = function(shortURL, objectToCheckIn) {
  for (let url in objectToCheckIn) {
    if (shortURL === url) {
      return true;
    }
  }
  return false;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  urlsForUser,
  validShortUrl
};