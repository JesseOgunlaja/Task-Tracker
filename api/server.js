const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const CryptoJS = require("crypto-js")
const rateLimit = require('express-rate-limit');

const API_KEY = process.env.API_KEY;
const SECRET_KEY = process.env.ENCRYPTION_KEY

const DATA_ENCRYPTION_KEY1 = process.env.DATA_ENCRYPTION1;
const parsedDataKey1 = CryptoJS.enc.Utf8.parse(DATA_ENCRYPTION_KEY1);
const stringDataKey1 = CryptoJS.enc.Utf8.stringify(parsedDataKey1);
const DATA_ENCRYPTION_KEY2 = process.env.DATA_ENCRYPTION2;
const parsedDataKey2 = CryptoJS.enc.Utf8.parse(DATA_ENCRYPTION_KEY2);
const stringDataKey2 = CryptoJS.enc.Utf8.stringify(parsedDataKey2);

const app = express();
const port = process.env.PORT || 80;


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


// Use the middleware globally for all requests

app.use(bodyParser.json());

const limiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

const authenticateJWT = (req, res, next) => {
  if(req.headers.authorization?.split(" ")[0] === "ThirdParty") {
    const apiKey = req.headers.authorization?.split(" ")[1]
    if(apiKey === API_KEY) {
      next()
    }
    else {
      return res.status(401).json({ message: 'Invalid API KEY' });
    }
  }
  else {
    const token = req.headers.authorization?.split(" ")[1];
  
    if (!req.headers.authorization) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
  
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      if (decoded.apiKey === API_KEY) {
        next();
      } else {
        return res.status(401).json({ message: "Invalid token" });
      }
    } catch (error) {
      // Invalid token
      return res.status(401).json({ message: "Invalid token" });
    }
  }
};


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

app.use(limiter);
app.use(authenticateJWT)

function encryptString(nameGiven) {
  const encrypted1 = CryptoJS.AES.encrypt(
    nameGiven,
    stringDataKey1
  ).toString();
  const encrypted2 = CryptoJS.AES.encrypt(
    encrypted1,
    stringDataKey2
  ).toString();
  return encrypted2;
}

// Create a user
app.post("/api/users", async (req, res) => {
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: encryptString(await bcrypt.hash(req.body.password, 10)),
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
    res.user.password = encryptString(await bcrypt.hash(req.body.password, 10));
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
      return res.status(404).json({ message: "Resource not found" });
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
      return res.status(404).json({ message: "Resource not found" });
    }
  } catch (error) {
    return res.status(404).json({ message: "Resource not found" });
  }
  res.user = user;
  next();
}

app.listen(port, () => {
  console.log(`Server started`);
});