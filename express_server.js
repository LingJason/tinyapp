const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

const generateRandomString = () => {
  return Math.random().toString(36).slice(2, 7);
};

const findUser = function(email) {
let user = null;
  for (const userId in users) {
    const userDb = users[userId];
    if (userDb.email === email) {
      user = userDb;
    }
  }
  return user;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
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
  const existingUser = findUser(email);
  console.log(existingUser);
  if(existingUser) {
    return res.status(400).send("Already an existing account");
  }

  //Create New Account
  const id = generateRandomString();
  const user = {
    id,
    email,
    password
  };

  // Add user to Database
  users[id] = user;
  console.log("users", users);

  // Set Cookie & Return to /Url
  res.cookie("user_id", id)
  res.redirect("/urls");
});






app.get("/register", (req, res) => {
  const userId = req.cookies["user_id"];
  if (userId) {
    res.redirect("/urls");
  }
  res.render("register");
});

app.get("/login", (req, res) => {
  const userId = req.cookies["user_id"];
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
  const newUser = findUser(email);
  if(!newUser) {
    return res.status(403).send("Don't Have an Existing Account");
  }
  
  // Check Password
  if (newUser.password !== password) {
    return res.status(403).send("Incorrect information provided");
  }

  // Add Cookie
  res.cookie("user_id", newUser.id);
  res.redirect("/urls");
})

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const shortUrl = req.params.id;
  const longUrl = req.body.newURL;
  urlDatabase[shortUrl] = longUrl;
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
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
  const userId = req.cookies["user_id"];
  const templateVars = {
    userId: users[userId],
    id: req.params.id, 
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {

  const userId = req.cookies["user_id"];
  const templateVars = { 
    userId: users[userId],
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});

app.post("/urls/:id/", (req, res) =>{
  const id = req.params.id;
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect(`/urls`);
});

app.post("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  if (userId) {
    console.log(req.body); // Log the POST request body to the console
    let shortUrl = generateRandomString();
    urlDatabase[shortUrl] = req.body.longURL;
    res.redirect(`/urls/${shortUrl}`);
  };
  res.send("URL can't be shorten.");
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
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