const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const verifyToken = require("./middleware/auth");

dotenv.config();

const app = express();
app.use(express.json());

const User = require("./models/User");

// ✅ MongoDB Connect
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Default Route
app.get("/", (req, res) => {
  res.send("Welcome to Gramin Bank Backend!");
});

// ✅ Register Route
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log("Register Request Body:", req.body);

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide name, email, and password" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    console.log("✅ User registered:", newUser);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// ✅ Login Route
app.post("/api/login", async (req, res) => {
  let { email, password } = req.body;
  email = email.trim();
  password = password.trim();

  console.log("Login Request:", email, password);

  try {
    const user = await User.findOne({ email });

    console.log("User from DB:", user);
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const payload = {
      userId: user._id,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      message: "Login successful",
      token,
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ message: "Server error during login" });
  }
});

// ✅ Protected Dashboard
app.get("/api/dashboard", verifyToken, (req, res) => {
  res.json({
    message: `Welcome to your dashboard, ${req.user.email}`,
    userId: req.user.userId,
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
