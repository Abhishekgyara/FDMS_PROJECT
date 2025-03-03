const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  password: String,
  role: String, // Admin, Faculty, HoD
});

const User = mongoose.model("User", userSchema);

// Profile Schema
const profileSchema = new mongoose.Schema({
  name: String,
  designation: String,
  qualification: String,
  email: String,
  phone: String,
  officeAddress: String,
  imageUrl: String,
  departments: [String],
  researchInterests: [String]
});

const Profile = mongoose.model("Profile", profileSchema);

// Signup Route
app.post("/signup", async (req, res) => {
  const { name, phone, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.json({ success: false, message: "User already exists!" });
  }

  const newUser = new User({ name, phone, email, password, role });
  await newUser.save();
  res.json({ success: true, message: "Signup successful!" });
});

// Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password });

  if (user) {
    res.json({
      success: true,
      message: `Login successful as ${user.role}`,
      role: user.role,
    });
  } else {
    res.json({ success: false, message: "Invalid credentials" });
  }
});

app.put("/update/:email", async (req, res) => {
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
});

app.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.delete("/delete/:email", async (req, res) => {
  const { email } = req.params;

  const deletedUser = await User.findOneAndDelete({ email });

  if (deletedUser) {
    res.json({ success: true, message: "User deleted successfully" });
  } else {
    res.json({ success: false, message: "User not found" });
  }
});

// Profile Routes
app.post("/addProfile", async (req, res) => {
  const newProfile = new Profile(req.body);
  await newProfile.save();
  res.status(201).json({ success: true, message: 'Profile added', profile: newProfile });
});

app.get("/getProfiles", async (req, res) => {
  const profiles = await Profile.find();
  res.status(200).json(profiles);
});

app.get("/getProfileByName", async (req, res) => {
  const facultyName = req.query.name;
  const profile = await Profile.findOne({ name: facultyName });
  if (profile) {
    res.status(200).json(profile);
  } else {
    res.status(404).json({ success: false, message: 'Profile not found' });
  }
});

app.put("/updateProfile/:id", async (req, res) => {
  const updatedProfile = await Profile.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (updatedProfile) {
    res.status(200).json({ success: true, message: 'Profile updated', updatedProfile });
  } else {
    res.status(404).json({ success: false, message: 'Profile not found' });
  }
});

app.delete("/deleteProfile/:id", async (req, res) => {
  const result = await Profile.findByIdAndDelete(req.params.id);
  if (result) {
    res.status(200).json({ success: true, message: 'Profile deleted' });
  } else {
    res.status(404).json({ success: false, message: 'Profile not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
