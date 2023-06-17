const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const apicache = require("apicache");
const compression = require("compression");

const { Types } = mongoose.Schema;

const API_KEY = process.env.API_KEY;
const GLOBAL_KEY = process.env.GLOBAL_KEY;
const SECRET_KEY = process.env.ENCRYPTION_KEY;

const app = express();
app.use(cookieParser());
app.use(compression());
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
  _id: { type: Types.ObjectId, auto: true, index: true },
  name: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

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
        return res.status(401).json({ message: "Invalid token" });
      }
    } catch (error) {
      // Invalid token
      res.clearCookie("authToken");
      return res.status(401).json({ message: "Invalid token" });
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
    if (
      (await User.findById(decoded.id)).name === req.body.username.toUpperCase()
    ) {
      next();
    } else {
      res.clearCookie("authToken");
      return res.status(401).json({ message: "Invalid token", refresh: true });
    }
  } catch (error) {
    res.clearCookie("authToken");
    return res.status(401).json({ message: "Invalid token", refresh: true });
  }
};

app.get("/api/users", authenticateJWTGlobal, async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get one user
app.post("/api/users/user", authenticateJWTUser, async (req, res) => {
  const user = await User.findOne({ name: req.body.username.toUpperCase() });

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

app.post("/ap/resetCache", async (req, res) => {
  apicache.clear("checkJWT");
  return res.status(200);
});

app.post(
  "/api/users/checkJWT",
  apicache.middleware("5 minutes"),
  async (req, res) => {
    req.apicacheGroup = "checkJWT";
    const token = req.cookies.authToken;

    if (token) {
      try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const user = await User.findById(decoded.id).lean();

        if (user) {
          res.cookie("authToken", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
          });

          const data = {
            message: "Valid cookie",
            user: user,
          };
          return res.status(200).json(data);
        }
      } catch (error) {
        console.error(error);
      }

      res.clearCookie("authToken");
      return res.status(400).json({ message: "Invalid cookie" });
    } else {
      return res.status(200).json({ message: "No cookie", refresh: false });
    }
  }
);

app.post("/api/users/email", authenticateJWTGlobal, async (req, res) => {
  const user = await User.findOne({ name: req.body.username.toUpperCase() });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "noreply4313@gmail.com",
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  const HTML = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>Email Template</title>
      <style>
      body {
        display: flex;
        align-items: center;
        justify-content: center;
        align-items: center;
        height: 100vh;
        flex-direction: column;
      }
      .code {
        background: rgba(112,128,144,.75);
        display:flex;
        align-items: center;
        justify-content: center;
        padding: 25px;
        font-size: 25px;
        border-radius: 10px;
      }
      .verif {
        text-align:center;
      }
      </style>
    </head>
    <body>
      <p class="verif">This is your verification code</p>
        <h1 class="code">${decryptString(req.body.verificationCode)}</h1>
    </body>
  </html>
`;

  const mailOptions = {
    from: "noreply4313@gmail.com",
    to: user.email,
    subject: "Task Tracker: Verification Code",
    html: HTML,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return res.status(400).json({ message: error });
    } else {
      return res
        .status(200)
        .json({ message: `Email sent`, info: info.response, refresh: false });
    }
  });
});

// Create a user
app.post("/api/users", async (req, res) => {
  const user = new User({
    name: req.body.name.toUpperCase(),
    email: req.body.email.toLowerCase(),
    password: await bcrypt.hash(req.body.password, 10),
    tasks: req.body.tasks,
  });
  try {
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (error) {
    if (error.message.includes("duplicate")) {
      if (error.message.includes("email")) {
        return res.status(400).json({ message: "Duplicate email" });
      } else if (error.message.includes("name")) {
        return res.status(400).json({ message: "Duplicate name" });
      }
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

app.post("/api/users/deleteCookie", async (req, res) => {
  res.clearCookie("authToken");
  res.status(200).json({ message: "Cookie deleted" });
});

app.post("/api/users/loginPassword", async (req, res) => {
  const user = await User.findOne({ name: req.body.username.toUpperCase() });
  const passwordInputted = req.body.password;

  if (await bcrypt.compare(passwordInputted, user.password)) {
    const token = jwt.sign({ id: user._id }, SECRET_KEY, {
      expiresIn: "7d",
    });
    res.cookie("authToken", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    apicache.clear("checkJWT");
    res.status(200).json({ user: user, refresh: false });
  } else {
    res.status(401).json({ message: "Invalid Credentials" });
  }
});

app.post("/api/users/loginName", async (req, res) => {
  try {
    const { username } = req.body;

    const user = await User.findOne({ name: username.toUpperCase() })
      .select("_id")
      .lean();

    if (user) {
      return res
        .status(200)
        .json({ message: "Resource found", refresh: false });
    } else {
      return res.status(400).json({ message: "Resource not found" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.patch(
  "/api/users/user/resetPassword",
  authenticateJWTGlobal,
  async (req, res) => {
    const user = await User.findOne({ name: req.body.username.toUpperCase() });
    user.password = await bcrypt.hash(req.body.password, 10);
    try {
      const updatedUser = await user.save();
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Update a user
app.patch("/api/users/user", authenticateJWTUser, async (req, res) => {
  const { username, name, email, password, tasks } = req.body;

  // Perform basic validation on the request body
  if (!username) {
    return res.status(400).json({ message: "Username is required." });
  }

  const updateFields = {};

  if (name) {
    updateFields.name = name.toUpperCase();
  }
  if (email) {
    updateFields.email = email.toLowerCase();
  }
  if (password) {
    updateFields.password = await bcrypt.hash(password, 10);
  }
  if (tasks) {
    updateFields.tasks = tasks;
  }

  try {
    // Use bulkWrite for updating multiple fields
    const result = await User.updateOne(
      { name: username.toUpperCase() },
      { $set: updateFields }
    );

    if (result.nModified === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    apicache.clear("checkJWT");
    res.json(updateFields);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a user
app.post("/api/users/user/delete", authenticateJWTUser, async (req, res) => {
  const user = await User.findOne({ name: req.body.username.toUpperCase() });
  try {
    const deletedUser = await User.findOneAndDelete({ name: user.name });
    apicache.clear("checkJWT");
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
