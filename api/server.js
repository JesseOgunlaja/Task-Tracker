const express = require("express");
require('dotenv').config()
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const cookieParser = require('cookie-parser');
const apicache = require("apicache");

const API_KEY = process.env.API_KEY;
const GLOBAL_KEY = process.env.GLOBAL_KEY
const SECRET_KEY = process.env.ENCRYPTION_KEY;

const app = express();
app.use(cookieParser());
const port = process.env.PORT || 8000;

const DATA_ENCRYPTION_KEY1 = process.env.DATA_ENCRYPTION1;
const parsedDataKey1 = CryptoJS.enc.Utf8.parse(DATA_ENCRYPTION_KEY1);
const stringDataKey1 = CryptoJS.enc.Utf8.stringify(parsedDataKey1);
const DATA_ENCRYPTION_KEY2 = process.env.DATA_ENCRYPTION2;
const parsedDataKey2 = CryptoJS.enc.Utf8.parse(DATA_ENCRYPTION_KEY2);
const stringDataKey2 = CryptoJS.enc.Utf8.stringify(parsedDataKey2);

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

const limiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
// Use the middleware globally for all requests

app.use(bodyParser.json());
app.use(limiter);


const cache = apicache.middleware;

const authenticateJWTGlobal = (req, res, next) => {
  if (req.headers.authorization?.split(" ")[0] === "ThirdParty") {
    const apiKey = req.headers.authorization?.split(" ")[1];
    if (apiKey === API_KEY) {
      next();
    } else {
      return res.status(401).json({ message: "Invalid API KEY" });
    }
  } else {
    const token = req.headers.authorization?.split(" ")[1];

    if (!req.headers.authorization) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      if (decoded.KEY === GLOBAL_KEY) {
        next();
      } else {
        return res.status(401).json({ message: "Invalid token" , token: token});
      }
    } catch (error) {
      // Invalid token
      return res.status(401).json({ message: "Invalid token", token: token });
    }
  }
};

const authenticateJWTUser = async (req, res, next) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if ((await User.findById(decoded.id)).name === req.body.username) {
      next();
    } else {
      return res.status(401).json({ message: "Invalid token"});
    }
  } catch (error) {
    return res.status(401).json({ message: "Invalid token"});
  }
};

app.get("/api/users",authenticateJWTGlobal, async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get one user
app.post("/api/users/user",authenticateJWTUser, async (req, res) => {
  const user = await User.findOne({ name: req.body.username });

  res.json(user);
});

function decryptString(nameGiven) {
  const decrypted1 = CryptoJS.AES.decrypt(nameGiven, stringDataKey2).toString(
    CryptoJS.enc.Utf8
  );
  const decrypted2 = CryptoJS.AES.decrypt(decrypted1, stringDataKey1).toString(
    CryptoJS.enc.Utf8
  );
  return decrypted2;
}

app.get("/api/users/checkJWT",cache('2 minutes'), async (req,res) => {
  const token = req.cookies.authToken

  if(token) {
    const decoded = jwt.verify(token,SECRET_KEY)
  
    if(decoded != null && await User.findById(decoded.id) != null) {
      const data = {message: "Valid cookie", user: await User.findById(decoded.id), token: token}
      cache["/api/users/checkJWT"] = data;
      return res.status(200).json(data)
    }
    else {
      res.clearCookie('authToken');
      return res.status(200).json({message: "Invalid cookie"})
    }
  }
  else {
    return res.status(200).json({message: "No cookie"})
  }

})

app.post("/api/users/email", authenticateJWTGlobal, async (req, res) => {
  const user = await User.findOne({ name: req.body.username });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "noreply4313@gmail.com",
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: "noreply4313@gmail.com",
    to: user.email,
    subject: "Task Tracker: Verification Code",
    text: `This is your verification code ${decryptString(
      req.body.verificationCode
    )}`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return res.status(400).json({ message: error });
    } else {
      return res
        .status(200)
        .json({ message: `Email sent`, info: info.response });
    }
  });
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

app.post("/api/users/deleteCookie", async (req,res) => {
  res.clearCookie('authToken');
  res.status(200).json({message: "Cookie deleted"})
})

app.post("/api/users/loginPassword", async (req, res) => {
  const user = await User.findOne({ name: req.body.username });
  const passwordInputted = req.body.password;

  if (await bcrypt.compare(passwordInputted, user.password)) {
    const token = jwt.sign({id: user._id}, SECRET_KEY, {
      "expiresIn": "7d",
    });
    res.cookie('authToken', token, {
      httpOnly: true,  // Ensures the cookie is accessible only through HTTP requests
      secure: true,    // Ensures the cookie is only sent over HTTPS connections
      sameSite: 'strict', // Ensures the cookie is only sent for same-site requests
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.status(200).json({ token: token });
  } else {
    res.status(401).json({ message: "Invalid Credentials" });
  }
});

app.post("/api/users/loginName", async (req, res) => {
  const user = await User.findOne({ name: req.body.username });
  if(user == null) {
    return res.status(400).json({message: "Resoure not found"})
  }
  else {
    return res.status(200).json({message: "Resoure found"})
  }
});

app.patch("/api/users/user/resetPassword", authenticateJWTGlobal, async (req,res) => {
  const user = await User.findOne({ name: req.body.username });
  user.password = await bcrypt.hash(req.body.password, 10)
  try {
    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
})

// Update a user
app.patch("/api/users/user",authenticateJWTUser, async (req, res) => {
  apicache.clear(`/api/users/checkJWT/${req.cookies.authToken}`);
  const user = await User.findOne({ name: req.body.username });
  if (req.body.name != null) {
    user.name = req.body.name;
  }
  if (req.body.email != null) {
    user.email = req.body.email;
  }
  if (req.body.password != null) {
    user.password = await bcrypt.hash(req.body.password, 10);
  }
  if (req.body.tasks != null) {
    user.tasks = req.body.tasks;
  }
  try {
    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a user
app.post("/api/users/user/delete",authenticateJWTUser, async (req, res) => {
  const user = await User.findOne({ name: req.body.username });
  try {
    const deletedUser = await User.findOneAndDelete({ name: user.name });
    if (deletedUser == null) {
      return res.status(404).json({ message: "Resource not found" });
    }
    res.json({ message: "User deleted", user: deletedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server started`);
});
