/* FUNCTION DECLARATIONS */

const generateRandomString = function() {
  // adapted from https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
  let randomString = '';
  const length = 6; //could also pass in as argument
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    randomString += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return randomString;
};

const getUserByEmail = function(emailToCheck, objectToCheckIn) {
  let user;
  for (let userID in objectToCheckIn) {
    if (emailToCheck === objectToCheckIn[userID]['email']) {
      user = userID;
    }
  }
  return user;
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

const filterVisitsByShortURL = function(shortURLid, objectToCheckIn) {
  let filteredVisits = {};
  for (let visit in objectToCheckIn) {
    if (objectToCheckIn[visit].shortURLVisited === shortURLid) {
      filteredVisits[visit] = objectToCheckIn[visit];
    }
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
