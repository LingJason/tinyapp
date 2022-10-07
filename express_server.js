const getUserByEmail = require("./helpers");
const express = require("express");
const app = express();
const PORT = 8080;
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");

// Middleware
app.use(express.urlencoded({ extended: true }));
//app.use(cookieParser());
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'tinyApp',
  keys: ["MySecretKey", "MoreSecretKey"],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));


const generateRandomString = () => {
  return Math.random().toString(36).slice(2, 7);
};

const urlsForUser = function(id) {
  const urls = {};
  for (const shortUrl in urlDatabase) {
    if (id === urlDatabase[shortUrl].userID) {
      urls[shortUrl] = urlDatabase[shortUrl].longURL;
    }
  }
  return id;
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "userRandomID2",
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
  //res.cookie("user_id", id)
  req.session["user_id"] = id;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  //const userId = req.cookies["user_id"];
  const userId = req.session["user_id"];
  if (userId) {
    res.redirect("/urls");
  }
  res.render("register");
});

app.get("/login", (req, res) => {
  //const userId = req.cookies["user_id"];
  const userId = req.session["user_id"];
  if (userId) {
    res.redirect("/urls");
  }
  res.render("login");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Ensures that both Email & Password are provided
  if (!email || !password) {
    res.status(400).send("Did not enter Email and Password");
  }

  // Check for Existing Users
  const newUser = getUserByEmail(email, users);
  if (!newUser) {
    return res.status(403).send("Don't Have an Existing Account");
  }
  
  // Check Password
  //if (newUser.password !== password)
  if (!bcrypt.compareSync(password, newUser.password)) {
    return res.status(403).send("Incorrect information provided");
  }

  // Add Cookie
  //res.cookie("user_id", newUser.id);
  req.session["user_id"] = newUser.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const shortUrl = req.params.id;
  const longUrl = req.body.newURL;
  //const userId = req.cookies["user_id"];
  const userId = req.session["user_id"];
  const url = urlDatabase[shortUrl];
  if (userId === url.userID) {
    url.longURL = longUrl;
    res.redirect("/urls");
  }
  res.status(403).send("Access Denied 150");
});

app.get("/urls/new", (req, res) => {
  //const userId = req.cookies["user_id"];
  const userId = req.session["user_id"];
  if (userId) {
    const templateVars = {
      userId: users[userId]
    };
    res.render("urls_new", templateVars);
  }
  res.redirect("/login");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.get("/urls/:id", (req, res) => {
  //const userId = req.cookies["user_id"];
  const userId = req.session["user_id"];
  if (!userId) {
    return res.status(401).send("Must be Log in");
  }
  if (userId !== users[userId].id) {
    //add .id after users[userId]
    return res.status(401).send("Access Denied 175");
  }
  const templateVars = {
    userId: users[userId],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  //const userId = req.cookies["user_id"];
  const userId = req.session["user_id"];
  if (!userId) {
    res.status(401).send("Can't View please <a href='/login'>login</a>");
  }
  const templateVars = {
    userId: users[userId],
    urls: urlsForUser(userId),
  };
  res.render("urls_index", templateVars);
});

app.post("/urls/:id/", (req, res) =>{
  const id = req.params.id;
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  //const userId = req.cookies["user_id"];
  const userId = req.session["user_id"];
  const id = req.params.id;
  const url = urlDatabase[id];
  if (userId === url.userID) {
    delete urlDatabase[id];
    res.redirect(`/urls`);
  }
  res.status(403).send("Access Denied 211");
});

app.post("/urls", (req, res) => {
  //const userId = req.cookies["user_id"];
  const userId = req.session["user_id"];
  if (userId) {
    console.log(req.body); // Log the POST request body to the console
    const shortUrl = generateRandomString();
    const url = {
      longURL: req.body.longURL,
      userID: userId
    };
    urlDatabase[shortUrl] = url;
    res.redirect(`/urls/${shortUrl}`);
  }
  res.send("URL can't be shorten.");
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if (!longURL) {
    res.send("Does not exist");
  }
  res.redirect(longURL);
});

app.get("/", (req,res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});