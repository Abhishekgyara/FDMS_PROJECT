const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB (Local)
mongoose.connect('mongodb://127.0.0.1:27017/faculty_profiles', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection failed:', err));

// Faculty Profile Schema
const facultyProfileSchema = new mongoose.Schema({
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

const FacultyProfile = mongoose.model('FacultyProfile', facultyProfileSchema);

// 🚀 Add Faculty Profile
app.post('/addProfile', async (req, res) => {
  try {
    const newProfile = new FacultyProfile(req.body);
    await newProfile.save();
    res.status(201).json({ success: true, message: 'Faculty profile added', profile: newProfile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 📥 Get All Faculty Profiles
app.get('/getProfiles', async (req, res) => {
  try {
    const profiles = await FacultyProfile.find();
    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 📤 Get Faculty Profile by ID
app.get('/getProfile/:id', async (req, res) => {
  try {
    const profile = await FacultyProfile.findById(req.params.id);
    if (profile) {
      res.status(200).json(profile);
    } else {
      res.status(404).json({ success: false, message: 'Profile not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 📤 Get Faculty Profile by Name (NEW API)
app.get('/getProfileByName', async (req, res) => {
  try {
    const facultyName = req.query.name;
    if (!facultyName) {
      return res.status(400).json({ success: false, message: 'Faculty name is required' });
    }

    const profile = await FacultyProfile.findOne({ name: facultyName });
    if (profile) {
      res.status(200).json(profile);
    } else {
      res.status(404).json({ success: false, message: 'Profile not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✏️ Update Faculty Profile by ID
app.put('/updateProfile/:id', async (req, res) => {
  try {
    const updatedProfile = await FacultyProfile.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (updatedProfile) {
      res.status(200).json({ success: true, message: 'Faculty profile updated', updatedProfile });
    } else {
      res.status(404).json({ success: false, message: 'Profile not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🗑️ Delete Faculty Profile by ID
app.delete('/deleteProfile/:id', async (req, res) => {
  try {
    const result = await FacultyProfile.findByIdAndDelete(req.params.id);
    if (result) {
      res.status(200).json({ success: true, message: 'Faculty profile deleted' });
    } else {
      res.status(404).json({ success: false, message: 'Profile not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🌐 Server Port
const PORT = 3050;
app.listen(PORT, () => console.log(`Server running on http://127.0.0.1:${PORT}`));

