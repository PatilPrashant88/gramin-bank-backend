const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bodyParser = require("body-parser");

const verifyToken = require("./middleware/auth");
const User = require("./models/User");

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://patilprashant88.github.io/gramin-bank-frontend",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Default Route
app.get("/", (req, res) => {
  res.send("Welcome to Gramin Bank Backend!");
});

// ------------------ Register Route ------------------
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide name, email, and password" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// ------------------ Login Route ------------------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // ✅ Debug input
    console.log("Login Request:", email, password);

    const user = await User.findOne({ email });

    // ✅ Debug DB user
    console.log("User from DB:", user);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    // ✅ Debug password comparison result
    console.log("Password match:", isMatch);

    if (!isMatch) {
      console.log("❌ Password match failed for user:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // (Optional) JWT Token Generation
    // const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, {
    //   expiresIn: "1h",
    // });

    res.status(200).json({
      message: "Login successful",
      // token,  // if using JWT
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
});

// ------------------ Protected Dashboard ------------------
app.get("/api/dashboard", verifyToken, (req, res) => {
  res.json({
    message: `Welcome to your dashboard, ${req.user.email}`,
    userId: req.user.userId,
  });
});

// ------------------ Start Server ------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
