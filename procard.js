const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const multer = require("multer"); // Add this line to import multer

const app = express();
const PORT = 9002;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/procardDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema for Profile Card
const profileSchema = new mongoose.Schema({
  personalDetails: {
    name: String,
    age: Number,
    gender: String,
    dob: String,
    aadhar: String,
    pan: String,
    email: String,
    phone: String,
    tempAddress: String,
    permAddress: String,
  },
  education: [
    {
      level: String, // 10th, Inter, UG, PG, PhD
      institution: String,
      duration: String,
      location: String,
      grade: String,
    },
  ],
  phdDetails: {
    included: Boolean,
    status: String, // Pursuing or Completed
    institution: String,
    from: String,
    to: String,
    location: String,
    grade: String,
    researchPublications: [
      {
        title: String,
        from: String,
        to: String,
      },
    ],
  },
  tenthDetails: {
    institution: String,
    from: String,
    to: String,
    location: String,
    grade: String,
  },
  interDetails: {
    institution: String,
    from: String,
    to: String,
    location: String,
    grade: String,
  },
  ugDetails: {
    institution: String,
    from: String,
    to: String,
    location: String,
    grade: String,
  },
  pgDetails: {
    institution: String,
    from: String,
    to: String,
    location: String,
    grade: String,
  },
  professionalExperience: [
    {
      organization: String,
      joiningDate: String,
      relieveDate: String,
      location: String,
      experienceYears: Number,
    },
  ],
  certificate: String, // Field to store the uploaded certificate file path
  certificates: {
    tenth: String,
    inter: String,
    ug: String,
    pg: String,
    phd: String,
  },
});

const Profile = mongoose.model("Profile", profileSchema);

// Routes

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'profile_card.html')); // Serve the dash_styles.css file from the "public" directory
});

// Serve pro.html for the /pro route
app.get("/pro", (req, res) => {
  res.sendFile(path.join(__dirname, "pro.html"));
});

// Fetch All Profiles
app.get("/profiles", async (req, res) => {
  try {
    const profiles = await Profile.find();
    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profiles", error });
  }
});

// Fetch a Single Profile by ID
app.get("/profile/:id", async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (profile) {
      res.status(200).json(profile);
    } else {
      res.status(404).json({ message: "Profile not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error });
  }
});

// File Upload Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'certificates/');
  },
  filename: (req, file, cb) => {
    cb(null, ` ${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['application/pdf', 'image/jpeg', 'image/png'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPEG, and PNG files are allowed'));
    }
  }
});

// Create a New Profile with multiple file uploads
app.post("/profile", upload.fields([
  { name: "certificate" },
  { name: "tenthCertificate" },
  { name: "interCertificate" },
  { name: "ugCertificate" },
  { name: "pgCertificate" },
  { name: "phdCertificate" },
]), async (req, res) => {
  try {
    const newProfileData = JSON.parse(req.body.data); // Parse the JSON data sent in the request

    // Save file paths in the profile data
    if (req.files) {
      newProfileData.certificates = {
        tenth: req.files.tenthCertificate ? req.files.tenthCertificate[0].path : null,
        inter: req.files.interCertificate ? req.files.interCertificate[0].path : null,
        ug: req.files.ugCertificate ? req.files.ugCertificate[0].path : null,
        pg: req.files.pgCertificate ? req.files.pgCertificate[0].path : null,
        phd: req.files.phdCertificate ? req.files.phdCertificate[0].path : null,
      };
    }

    const newProfile = new Profile(newProfileData);
    await newProfile.save();
    res.status(201).json({ message: "Profile created successfully", profile: newProfile });
  } catch (error) {
    res.status(500).json({ message: "Error creating profile", error });
  }
});

// Update an Existing Profile by ID
app.put("/profile/:id", async (req, res) => {
  try {
    const updatedProfile = await Profile.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (updatedProfile) {
      res.status(200).json({ message: "Profile updated successfully", profile: updatedProfile });
    } else {
      res.status(404).json({ message: "Profile not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error });
  }
});

// Delete a Profile by ID
app.delete("/profile/:id", async (req, res) => {
  try {
    const deletedProfile = await Profile.findByIdAndDelete(req.params.id);
    if (deletedProfile) {
      res.status(200).json({ message: "Profile deleted successfully" });
    } else {
      res.status(404).json({ message: "Profile not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting profile", error });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
