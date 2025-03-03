const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Faculty Profile Schema
const facultyProfileSchema = new mongoose.Schema({
  name: String,
  designation: String,
  qualification: String,
  department: String,
  email: String,
  age: Number,
});

const FacultyProfile = mongoose.model("FacultyProfile", facultyProfileSchema);

// 🚀 Add Faculty Profile
router.post("/addProfile", async (req, res) => {
  try {
    const newProfile = new FacultyProfile(req.body);
    await newProfile.save();
    res.status(201).json({ success: true, message: "Faculty profile added", profile: newProfile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 📥 Get All Faculty Profiles
router.get("/getProfiles", async (req, res) => {
  try {
    const profiles = await FacultyProfile.find();
    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 📤 Get Faculty Profile by ID
router.get("/getProfile/:id", async (req, res) => {
  try {
    const profile = await FacultyProfile.findById(req.params.id);
    if (profile) {
      res.status(200).json(profile);
    } else {
      res.status(404).json({ success: false, message: "Profile not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 📤 Get Faculty Profile by Name
router.get("/getProfileByName", async (req, res) => {
  try {
    const facultyName = req.query.name;
    if (!facultyName) {
      return res.status(400).json({ success: false, message: "Faculty name is required" });
    }

    const profile = await FacultyProfile.findOne({ name: facultyName });
    if (profile) {
      res.status(200).json(profile);
    } else {
      res.status(404).json({ success: false, message: "Profile not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✏️ Update Faculty Profile by ID
router.put("/updateProfile/:id", async (req, res) => {
  try {
    const updatedProfile = await FacultyProfile.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (updatedProfile) {
      res.status(200).json({ success: true, message: "Faculty profile updated", updatedProfile });
    } else {
      res.status(404).json({ success: false, message: "Profile not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🗑️ Delete Faculty Profile by ID
router.delete("/deleteProfile/:id", async (req, res) => {
  try {
    const result = await FacultyProfile.findByIdAndDelete(req.params.id);
    if (result) {
      res.status(200).json({ success: true, message: "Faculty profile deleted" });
    } else {
      res.status(404).json({ success: false, message: "Profile not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

