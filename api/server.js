const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const API_KEY = process.env.API_KEY || process.env.REACT_APP_MY_API_KEY

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect('mongodb+srv://Jesse677:Nicole123@cluster0.rz9ricb.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  tasks: [{
    task: { type: String },
    date: { type: String },
    reminder: { type: Boolean }
  }]
});

const User = mongoose.model('User', UserSchema);

app.use(bodyParser.json());

// Middleware function to verify API key
function apiKeyVerification(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).send("Unathourized");
  }
  next();
}

// Get all users
app.get('/api/users', apiKeyVerification, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get one user
app.get('/api/users/:id', apiKeyVerification, getUser, (req, res) => {
  res.json(res.user);
});

// Create a user
app.post('/api/users', apiKeyVerification, async (req, res) => {
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    tasks: req.body.tasks
  });
  try {
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a user
app.patch('/api/users/:id', apiKeyVerification, getUser, async (req, res) => {
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
app.delete('/api/users/:id', apiKeyVerification, getUser, async (req, res) => {
  try {
    await res.user.remove();
    res.json({ message: 'User deleted' });
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
      return res.status(404).json({ message: 'Cannot find user' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
  res.user = user;
  next();
}

app.listen(port, () => {
  console.log(`Server started on port ${3000}`)
});
