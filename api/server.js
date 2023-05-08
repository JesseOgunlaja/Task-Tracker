const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const CryptoJS = require("crypto-js");
const { createProxyMiddleware } = require("http-proxy-middleware");

const API_KEY = process.env.API_KEY;

const app = express();
const port = process.env.PORT || 80;

function apiKeyVerification(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  // const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY;
  // const parsedKey = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
  // const stringKey = CryptoJS.enc.Base64.stringify(parsedKey);
  // const decryptedKey = CryptoJS.AES.decrypt(apiKey, stringKey).toString(
  //   CryptoJS.enc.Utf8
  // );
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(403).send(apiKey);
  }
  next();
}

app.use(
  '/api/Users',
  createProxyMiddleware({
    target: 'https://tasktracker4313.online',
    changeOrigin: true,
    headers: {
      'x-api-key': API_KEY, // Replace 'YOUR_API_KEY' with your actual API key
    },
  })
  );
  app.use(apiKeyVerification);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  tasks: [
    {
      task: { type: String },
      date: { type: String },
      reminder: { type: Boolean },
    },
  ],
});

const User = mongoose.model("User", UserSchema);

app.use(bodyParser.json());
// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get one user
app.get("/api/users/:id", getUser, (req, res) => {
  res.json(res.user);
});

// Create a user
app.post("/api/users", async (req, res) => {
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: await bcrypt.hash(req.body.password, 10),
    tasks: req.body.tasks,
  });
  try {
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a user
app.patch("/api/users/:id", getUser, async (req, res) => {
  if (req.body.name != null) {
    res.user.name = req.body.name;
  }
  if (req.body.email != null) {
    res.user.email = req.body.email;
  }
  if (req.body.password != null) {
    res.user.password = req.body.password;
  }
  if (req.body.tasks != null) {
    res.user.tasks = req.body.tasks;
  }
  try {
    const updatedUser = await res.user.save();
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a user
app.delete("/api/users/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (deletedUser == null) {
      return res.status(404).json({ message: "Cannot find user" });
    }
    res.json({ message: "User deleted", user: deletedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Middleware function to get user by ID
async function getUser(req, res, next) {
  let user;
  try {
    user = await User.findById(req.params.id);
    if (user == null) {
      return res.status(404).json({ message: "Cannot find user" });
    }
  } catch (error) {
    return res.status(404).json({ message: "Cannot find user" });
  }
  res.user = user;
  next();
}

app.listen(port, () => {
  console.log(`Server started`);
});
