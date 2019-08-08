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
  let ret = undefined;
  for (let userID in objectToCheckIn) {
    if (emailToCheck === objectToCheckIn[userID]["email"]) {
      ret = userID;
    }
  }
  return ret;
};

const urlsForUser = function(id, objectToCheckIn) {
  const filteredURLs = {};
  for (let url in objectToCheckIn) {
    if (id === objectToCheckIn[url].userID) {
      filteredURLs[url] = objectToCheckIn[url];
    }
  }
  return filteredURLs;
};

const validShortUrl = function(shortURL, objectToCheckIn) {
  for (let url in objectToCheckIn) {
    if (shortURL === url) {
      return true;
    }
  }
  return false;
};

const filterVisitsByShortURL = function(shortURLid, objectToCheckIn, countOnlyFlag) {
  let filteredVisits = {};
  let filteredCount = 0;
  for (let visit in objectToCheckIn) {
    if (objectToCheckIn[visit].shortURLVisited === shortURLid) {
      filteredVisits[visit] = objectToCheckIn[visit];
      filteredCount++;
    }
  }
  if (countOnlyFlag) {
    return filteredCount;
  }
  return filteredVisits;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  urlsForUser,
  validShortUrl,
  filterVisitsByShortURL
};