const getUserByEmail = function(email, usersDatabase) {
  let user = null;
  for (const userId in usersDatabase) {
    const userDb = usersDatabase[userId];
    if (userDb.email === email) {
      user = userDb;
    }
  }
  return user;
};

module.exports = getUserByEmail;