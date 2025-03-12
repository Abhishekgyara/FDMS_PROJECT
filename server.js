const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the "public" directory

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
  researchInterests: [String],
  department: String
});

const Profile = mongoose.model("Profile", profileSchema);

// Contact Schema
const contactSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  phone: String,
  feedback: String,
  date: { type: Date, default: Date.now }
});

const Contact = mongoose.model("Contact", contactSchema);

// Root Route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname,  'index.html')); // Serve the index.html file from the "public" directory
});

// Login Route
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname,  'login.html')); // Serve the login.html file from the "public" directory
});


app.get("/video", (req, res) => {
  res.sendFile(path.join(__dirname,  '13232-246463976_small.mp4')); // Serve the login.html file from the "public" directory
});



app.get("/profiles", (req, res) => {
  res.sendFile(path.join(__dirname,  'profiles.html')); // Serve the login.html file from the "public" directory
});

app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname,  'profile.html')); // Serve the login.html file from the "public" directory
});



app.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname,  'contact.html')); // Serve the login.html file from the "public" directory
});

// Dashboard Route
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html')); // Serve the dashboard.html file from the "public" directory
});

app.get("/dashboard2", (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard2.html')); // Serve the dashboard2.html file from the "public" directory
});

app.get("/dashboard3", (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard3.html')); // Serve the dashboard3.html file from the "public" directory
});


// AIML Route
app.get("/aiml_profiles", (req, res) => {
  res.sendFile(path.join(__dirname, 'aiml_profiles.html')); // Serve the aiml_profiles.html file from the "public" directory
});

//DS Route
app.get("/ds_faculty", (req, res) => {
  res.sendFile(path.join(__dirname, 'ds_faculty.html')); // Serve the aiml_profiles.html file from the "public" directory
});

//IT Route
app.get("/it_faculty", (req, res) => {
  res.sendFile(path.join(__dirname, 'it_faculty.html')); // Serve the aiml_profiles.html file from the "public" directory
});

//CSE Route
app.get("/cse_profiles", (req, res) => {
  res.sendFile(path.join(__dirname, 'cse_profiles.html')); // Serve the aiml_profiles.html file from the "public" directory
});

// Static Files Route
app.get("/dash_styles.css", (req, res) => {
  res.sendFile(path.join(__dirname, 'dash_styles.css')); // Serve the dash_styles.css file from the "public" directory
});

app.get("/tasks", (req, res) => {
  res.sendFile(path.join(__dirname, 'tasks.html')); // Serve the dash_styles.css file from the "public" directory
});

//KMIT image
app.get("/kmit_image.jpg", (req, res) => {
  res.sendFile(path.join(__dirname, 'kmit_image.jpg')); // Serve the kmit_image.jpg file from the "public" directory
});

//Profiles.html routes
app.get("/profiles", (req, res) => {
  res.sendFile(path.join(__dirname, 'profiles.html')); // Serve the kmit_image.jpg file from the "public" directory
});

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
            name: user.name,
            email: user.email,
            profilePhoto: user.profilePhoto // Ensure this field exists in your user schema
        });
    } else {
        res.json({ success: false, message: "Invalid credentials" });
    }
});

// Profile Routes
app.post('/addProfile', async (req, res) => {
  try {
    const newProfile = new Profile(req.body);
    await newProfile.save();
    res.status(201).json({ success: true, message: 'Faculty profile added', profile: newProfile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/getProfiles', async (req, res) => {
  try {
    const profiles = await Profile.find();
    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/getProfile/:id', async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (profile) {
      res.status(200).json(profile);
    } else {
      res.status(404).json({ success: false, message: 'Profile not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/updateProfile/:id', async (req, res) => {
  try {
    const updatedProfile = await Profile.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (updatedProfile) {
      res.status(200).json({ success: true, message: 'Faculty profile updated', updatedProfile });
    } else {
      res.status(404).json({ success: false, message: 'Profile not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/deleteProfile/:id', async (req, res) => {
  try {
    const result = await Profile.findByIdAndDelete(req.params.id);
    if (result) {
      res.status(200).json({ success: true, message: 'Faculty profile deleted' });
    } else {
      res.status(404).json({ success: false, message: 'Profile not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Contact Route
app.post('/contact', async (req, res) => {
  try {
    const newContact = new Contact(req.body);
    await newContact.save();
    res.status(201).json({ success: true, message: 'Contact message received', contact: newContact });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
