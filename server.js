const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  password: String,
  role: String, // Admin, Faculty, HoD
});

const User = mongoose.model("User", userSchema);

// 🚀 Signup Route
router.post("/signup", async (req, res) => {
  try {
    const { name, phone, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists!" });
    }

    const newUser = new User({ name, phone, email, password, role });
    await newUser.save();
    res.json({ success: true, message: "Signup successful!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🔑 Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });

    if (user) {
      res.json({ success: true, message: `Login successful as ${user.role}`, role: user.role });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✏️ Update User
router.put("/update/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const { name, phone, password, role } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { name, phone, password, role },
      { new: true }
    );

    if (updatedUser) {
      res.json({ success: true, message: "User updated successfully", updatedUser });
    } else {
      res.json({ success: false, message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 📥 Get All Users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🗑️ Delete User
router.delete("/delete/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const deletedUser = await User.findOneAndDelete({ email });

    if (deletedUser) {
      res.json({ success: true, message: "User deleted successfully" });
    } else {
      res.json({ success: false, message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
