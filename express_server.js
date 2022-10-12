const { getUserByEmail } = require("./helpers");
const express = require("express");
const app = express();
const PORT = 8080;
const bcrypt = require("bcryptjs");
const methodOverride = require('method-override');
const cookieSession = require("cookie-session");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'tinyApp',
  keys: ["MySecretKey", "MoreSecretKey"],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(methodOverride('_method'));

const generateRandomString = () => {
  return Math.random().toString(36).slice(2, 7);
};

const urlsForUser = function(id) {
  const urls = {};
  for (const shortUrl in urlDatabase) {
    if (id === urlDatabase[shortUrl].userID) {
      urls[shortUrl] = urlDatabase[shortUrl];
    }
  }
  return urls;
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID",
    visits: 0,
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "userRandomID2",
    visits: 0,
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("123", 10)
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("abc", 10)
  },
};

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Ensures that both Email & Password are provided
  if (!email || !password) {
    return res.status(400).send("Did not enter Email and Password");
  }

  // Check for Existing Users
  const existingUser = getUserByEmail(email, users);
  console.log(existingUser);
  if (existingUser) {
    return res.status(400).send("Already an existing account");
  }

  //Create New Account
  const id = generateRandomString();
  const user = {
    id,
    email,
    password: bcrypt.hashSync(password, 10)
  };

  // Add user to Database
  users[id] = user;
  console.log("users", users);

  // Set Cookie & Return to /Url
  req.session["user_id"] = id;
  return res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const userId = req.session["user_id"];
  if (users[userId]) {
    return res.redirect("/urls");
  }
  const templateVars = {
    userId: users[userId]
  };
  return res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const userId = req.session["user_id"];
  if (users[userId]) {
    return res.redirect("/urls");
  }
  const templateVars = {
    userId: users[userId]
  };
  return res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Ensures that both Email & Password are provided
  if (!email || !password) {
    return res.status(400).send("Did not enter Email and Password");
  }

  // Check for Existing Users
  const newUser = getUserByEmail(email, users);
  if (!newUser) {
    return res.status(403).send("Don't Have an Existing Account");
  }
  
  // Check Password
  if (!bcrypt.compareSync(password, newUser.password)) {
    return res.status(403).send("Incorrect information provided");
  }

  // Add Cookie
  req.session["user_id"] = newUser.id;
  return res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  return res.redirect("/urls");
});

app.put("/urls/:id", (req, res) => {
  const shortUrl = req.params.id;
  const longUrl = req.body.newURL;
  const userId = req.session["user_id"];
  const url = urlDatabase[shortUrl];
  if (userId === url.userID) {
    url.longURL = longUrl;
    return res.redirect("/urls");
  }
  return res.status(403).send("Access Denied");
});

app.get("/urls/new", (req, res) => {
  const userId = req.session["user_id"];
  if (users[userId]) {
    const templateVars = {
      userId: users[userId]
    };
    return res.render("urls_new", templateVars);
  }
  return res.redirect("/login");
});

app.get("/hello", (req, res) => {
  return res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.get("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send("Short URL not found");
  }

  const userId = req.session["user_id"];
  if (!users[userId]) {
    return res.status(401).redirect("/login");
  }
  if (!urlsForUser(userId)[req.params.id]) {
    return res.status(401).send("Access Denied");
  }
  const templateVars = {
    userId: users[userId],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };
  return res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  const userId = req.session["user_id"];
  if (!users[userId]) {
    return res.status(403).redirect("/login");
  }
  const templateVars = {
    userId: users[userId],
    urls: urlsForUser(userId),
  };
  return res.render("urls_index", templateVars);
});


app.delete("/urls/:id/", (req, res) => {
  const userId = req.session["user_id"];
  const id = req.params.id;
  const url = urlDatabase[id];
  if (userId === url.userID) {
    delete urlDatabase[id];
    return res.redirect(`/urls`);
  }
  return res.status(403).send("Access Denied");
});

app.post("/urls", (req, res) => {
  const userId = req.session["user_id"];
  if (userId) {
    const shortUrl = generateRandomString();
    const url = {
      longURL: req.body.longURL,
      userID: userId,
      visits: 0,
    };
    urlDatabase[shortUrl] = url;
    return res.redirect(`/urls/${shortUrl}`);
  }
  return res.send("URL can't be shorten.");
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;
  if (!longURL) {
    return res.send("Does not exist");
  }
  urlDatabase[shortURL].visits ++;
  return res.redirect(longURL);
});

app.get("/", (req,res) => {
  return res.redirect('/login');
});

app.get("/urls.json", (req, res) => {
  return res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});