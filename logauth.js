const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');
const multer = require('multer');

const app = express();
app.use(cors({
    origin: 'http://localhost:4009',
    credentials: true
}));
app.use(express.json());

// Remove generic static serving
// app.use(express.static(path.join(__dirname)));

// Add specific routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login_auth.html'));
});

app.get('/faculty_dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'faculty_dashboard.html'));
});

app.get('/admin_dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin_dashboard.html'));
});

app.get('/form', (req, res) => {
    res.sendFile(path.join(__dirname, 'form.html'));
});


app.get('/manage_users', (req, res) => {
    res.sendFile(path.join(__dirname, 'manage_users.html'));
});

app.get('/my_profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'my_profile.html'));
});

app.get('dash_styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'dash_styles.css'));
});


app.get('form.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'form.html'));
});



app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/login_auth.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login_auth.html'));
});

app.get('/form', (req, res) => {
    res.sendFile(path.join(__dirname, 'form.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'form.html'));
});


app.get('/faculty_profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'faculty_profile.html'));
});

// Serve static files needed by login_auth.html
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/fdms_web', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['Faculty', 'HOD', 'Admin'] },
    department: { type: String, required: true, enum: ['CSE', 'DS', 'AIML', 'IT'] },
    phoneNumber: { type: String },
    googleId: { type: String },
    profilePhoto: { type: String },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    loginHistory: [{
        timestamp: { type: Date, default: Date.now },
        device: String,
        browser: String
    }],
    loginCount: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

// Google OAuth client
const googleClient = new OAuth2Client('940020976752-ee8dupcuupmhepgsu70dcvsou7vs3rpi.apps.googleusercontent.com');

// Single multer configuration for all file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage });

// Faculty Details Schema
const facultyDetailsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    personal: {
        name: String,
        gender: String,
        dob: Date,
        age: Number,
        tempAddress: {
            state: String,
            city: String,
            pincode: String
        },
        permAddress: {
            state: String,
            city: String,
            pincode: String
        },
        email: String,
        phone: String
    },
    education: {
        school: {
            name: String,
            location: String,
            startDate: Date,
            endDate: Date,
            duration: String, // Added duration field
            syllabusType: String,
            gradeType: String,
            grade: Number
        },
        intermediate: {
            name: String,
            location: String,
            startDate: Date,
            endDate: Date,
            syllabusType: String,
            gradeType: String,
            grade: Number,
            duration: String // Added duration field
        },
        ug: {
            name: String,
            location: String,
            startDate: Date,
            endDate: Date,
            instituteType: String,
            course: String,
            specialization: String,
            gradeType: String,
            grade: Number
        },
        pg: {
            name: String,
            location: String,
            startDate: Date,
            endDate: Date,
            instituteType: String,
            course: String,
            specialization: String,
            gradeType: String,
            grade: Number
        },
        phd: {
            name: String,
            location: String,
            startDate: Date,
            endDate: Date,
            duration: String, // Added duration field
            instituteType: String,
            status: String,
            currentYear: Number,
            gradeType: String,
            grade: Number
        }
    },
    experience: [{
        organization: String,
        state: String,
        city: String,
        designation: String,
        joinDate: Date,
        relieveDate: Date,
        duration: String,
        certificate: String
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const FacultyDetails = mongoose.model('FacultyDetails', facultyDetailsSchema);

// Create schema for faculty form submissions
const facultyFormSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    personalDetails: Object,
    educationDetails: Object,
    experiences: Array,
    certificates: {
        school: String,
        intermediate: String,
        ug: String,
        pg: String,
        phd: String,
        experience: [String]
    },
    submittedAt: { type: Date, default: Date.now }
});

const FacultyForm = mongoose.model('FacultyForm', facultyFormSchema);

// Routes
app.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role, department, phoneNumber } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role,
            department,
            phoneNumber
        });

        await user.save();
        res.json({ 
            success: true, 
            message: 'User registered successfully',
            shouldRedirect: true
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt:', { email }); // Debug log

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        // If email and password match, login is successful
        user.lastLogin = new Date();
        user.loginHistory.push({
            timestamp: new Date(),
            device: req.headers['user-agent']
        });
        user.loginCount = (user.loginCount || 0) + 1;
        await user.save();

        res.json({
            success: true,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            profilePhoto: user.profilePhoto,
            lastLogin: user.lastLogin,
            loginCount: user.loginCount,
            redirectUrl: user.role === 'HOD' ? '/hod_dashboard' : 
                        user.role === 'Admin' ? '/admin_dashboard' : 
                        '/faculty_dashboard'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/auth/google', async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: '940020976752-ee8dupcuupmhepgsu70dcvsou7vs3rpi.apps.googleusercontent.com'
        });

        const payload = ticket.getPayload();
        
        // Check if user exists with this email
        const user = await User.findOne({ email: payload.email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Please sign up first before using Google Sign-In'
            });
        }

        // Update user's Google-specific info
        user.googleId = payload.sub;
        user.profilePhoto = payload.picture;
        await user.save();

        res.json({
            success: true,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            profilePhoto: user.profilePhoto || payload.picture
        });
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Google authentication failed',
            error: error.message 
        });
    }
});

// Add new route for faculty dashboard
app.get('/faculty_dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'faculty_dashboard.html'));
});

// Add routes for serving dashboard files
app.get('/dashboard2', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard2.html'));
});

// Add admin dashboard route
app.get('/admin_dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin_dashboard.html'));
});

// Add route to serve manage_users.html
app.get('/manage-users', (req, res) => {
    res.sendFile(path.join(__dirname, 'manage_users.html'));
});

// Add API route to get all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, '-password');
        console.log('Found users:', users); // Debug log
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error); // Debug log
        res.status(500).json({ message: error.message });
    }
});

// Add new route to get user login history
app.get('/api/users/:userId/login-history', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            loginHistory: user.loginHistory,
            loginCount: user.loginCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add HOD dashboard route
app.get('/hod_dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'hod_dashboard.html'));
});

// Routes for faculty details
app.post('/api/faculty/details', async (req, res) => {
    try {
        const { personal, education, experience } = req.body;
        const userId = req.body.userId; // Get this from authentication token in production

        const facultyDetails = new FacultyDetails({
            userId,
            personal,
            education,
            experience
        });

        await facultyDetails.save();
        res.json({ success: true, message: 'Details saved successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Route for certificate uploads
app.post('/api/faculty/certificates', upload.fields([
    { name: 'schoolCert', maxCount: 1 },
    { name: 'interCert', maxCount: 1 },
    { name: 'ugCert', maxCount: 1 },
    { name: 'pgCert', maxCount: 1 },
    { name: 'phdCert', maxCount: 1 },
    { name: 'expCerts', maxCount: 10 }
]), async (req, res) => {
    try {
        const userId = req.body.userId; // Get this from authentication token in production
        const facultyDetails = await FacultyDetails.findOne({ userId });

        if (!facultyDetails) {
            return res.status(404).json({ success: false, message: 'Faculty details not found' });
        }

        // Update certificate paths
        if (req.files.schoolCert) {
            facultyDetails.education.school.certificate = req.files.schoolCert[0].path;
        }
        if (req.files.interCert) {
            facultyDetails.education.intermediate.certificate = req.files.interCert[0].path;
        }
        // ...similar updates for other certificates...

        await facultyDetails.save();
        res.json({ success: true, message: 'Certificates uploaded successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Route to get faculty details
app.get('/api/faculty/details/:userId', async (req, res) => {
    try {
        const facultyDetails = await FacultyDetails.findOne({ userId: req.params.userId });
        if (!facultyDetails) {
            return res.status(404).json({ success: false, message: 'Details not found' });
        }
        res.json({ success: true, data: facultyDetails });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Handle form submission
app.post('/api/faculty/submit-form', upload.fields([
    { name: 'schoolCert', maxCount: 1 },
    { name: 'interCert', maxCount: 1 },
    { name: 'ugCert', maxCount: 1 },
    { name: 'pgCert', maxCount: 1 },
    { name: 'phdCert', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('Received form data:', req.body);
        
        const personalDetails = JSON.parse(req.body.personalDetails);
        const educationDetails = JSON.parse(req.body.educationDetails);
        const experiences = JSON.parse(req.body.experiences || '[]');
        
        // Find user by email
        const userEmail = personalDetails.email;
        const user = await User.findOne({ email: userEmail });
        
        if (!user) {
            throw new Error('User not found');
        }

        // Create new FacultyDetails document with complete structure
        const facultyDetails = await FacultyDetails.findOneAndUpdate(
            { userId: user._id },
            {
                userId: user._id,
                personal: {
                    name: personalDetails.name,
                    gender: personalDetails.gender,
                    dob: personalDetails.dob,
                    age: personalDetails.age,
                    email: personalDetails.email,
                    phone: personalDetails.phone,
                    tempAddress: personalDetails.tempAddress,
                    permAddress: personalDetails.permAddress
                },
                education: {
                    school: {
                        name: educationDetails.school?.name,
                        location: educationDetails.school?.location,
                        startDate: educationDetails.school?.startDate,
                        endDate: educationDetails.school?.endDate,
                        syllabusType: educationDetails.school?.syllabusType,
                        gradeType: educationDetails.school?.gradeType,
                        grade: parseFloat(educationDetails.school?.grade) || 0,
                        duration: calculateDuration(
                            educationDetails.school?.startDate,
                            educationDetails.school?.endDate
                        )
                    },
                    intermediate: {
                        name: educationDetails.intermediate?.name,
                        location: educationDetails.intermediate?.location,
                        startDate: educationDetails.intermediate?.startDate,
                        endDate: educationDetails.intermediate?.endDate,
                        syllabusType: educationDetails.intermediate?.syllabusType,
                        gradeType: educationDetails.intermediate?.gradeType,
                        grade: parseFloat(educationDetails.intermediate?.grade) || 0,
                        duration: calculateDuration(
                            educationDetails.intermediate?.startDate,
                            educationDetails.intermediate?.endDate
                        )
                    },
                    ug: {
                        name: educationDetails.ug?.name,
                        location: educationDetails.ug?.location,
                        startDate: educationDetails.ug?.startDate,
                        endDate: educationDetails.ug?.endDate,
                        instituteType: educationDetails.ug?.instituteType,
                        course: educationDetails.ug?.course,
                        specialization: educationDetails.ug?.specialization,
                        gradeType: educationDetails.ug?.gradeType,
                        grade: parseFloat(educationDetails.ug?.grade) || 0
                    },
                    pg: {
                        name: educationDetails.pg?.name,
                        location: educationDetails.pg?.location,
                        startDate: educationDetails.pg?.startDate,
                        endDate: educationDetails.pg?.endDate,
                        instituteType: educationDetails.pg?.instituteType,
                        course: educationDetails.pg?.course,
                        specialization: educationDetails.pg?.specialization,
                        gradeType: educationDetails.pg?.gradeType,
                        grade: parseFloat(educationDetails.pg?.grade) || 0
                    },
                    phd: {
                        name: educationDetails.phd?.name,
                        location: educationDetails.phd?.location,
                        startDate: educationDetails.phd?.startDate,
                        endDate: educationDetails.phd?.endDate,
                        instituteType: educationDetails.phd?.instituteType,
                        status: educationDetails.phd?.status,
                        currentYear: educationDetails.phd?.currentYear,
                        gradeType: educationDetails.phd?.gradeType,
                        grade: parseFloat(educationDetails.phd?.grade) || 0,
                        duration: calculateDuration(
                            educationDetails.phd?.startDate,
                            educationDetails.phd?.endDate
                        )
                    }
                },
                experience: experiences.map(exp => ({
                    organization: exp.organization,
                    designation: exp.designation,
                    state: exp.state,
                    city: exp.city,
                    joinDate: new Date(exp.joinDate),
                    relieveDate: exp.relieveDate ? new Date(exp.relieveDate) : undefined,
                    duration: exp.duration
                })),
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        // Add helper function to calculate duration
        function calculateDuration(startDate, endDate) {
            if (!startDate || !endDate) return '';
            const start = new Date(startDate);
            const end = new Date(endDate);
            const years = end.getFullYear() - start.getFullYear();
            const months = end.getMonth() - start.getMonth();
            return `${years} years ${months} months`;
        }

        res.json({
            success: true,
            message: 'Form submitted successfully',
            data: facultyDetails
        });
    } catch (error) {
        console.error('Form submission error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Add route to verify saved data
app.get('/api/faculty/verify-submission/:userId', async (req, res) => {
    try {
        const facultyDetails = await FacultyDetails.findOne({ userId: req.params.userId });
        if (!facultyDetails) {
            return res.status(404).json({ 
                success: false, 
                message: 'No submission found' 
            });
        }
        res.json({ 
            success: true, 
            data: {
                education: {
                    ug: facultyDetails.education.ug,
                    pg: facultyDetails.education.pg,
                    phd: facultyDetails.education.phd
                }
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Add new route to check profile status
app.get('/api/faculty/details/check', async (req, res) => {
    try {
        const email = req.query.email;
        const formDetails = await FacultyForm.findOne({ 'personalDetails.email': email });
        const facultyDetails = await FacultyDetails.findOne({ 'personal.email': email });
        
        res.json({ exists: !!(formDetails || facultyDetails) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add route to get faculty details by email
app.get('/api/faculty/details/byEmail/:email', async (req, res) => {
    try {
        console.log('Fetching details for email:', req.params.email); // Debug log
        const formDetails = await FacultyForm.findOne({ 
            'personalDetails.email': req.params.email 
        });

        // If found in FacultyForm, use that data
        if (formDetails) {
            return res.json({
                success: true,
                data: {
                    personal: formDetails.personalDetails,
                    education: formDetails.educationDetails,
                    experience: formDetails.experiences
                }
            });
        }

        // Fallback to FacultyDetails if not found in FacultyForm
        const details = await FacultyDetails.findOne({ 
            'personal.email': req.params.email 
        });
        console.log('Found details:', details); // Debug log
        
        if (!details) {
            return res.status(404).json({ 
                success: false, 
                message: 'Details not found' 
            });
        }

        // Ensure all sections are included in response
        const formattedResponse = {
            success: true,
            data: {
                personal: details.personal || {},
                education: {
                    school: details.education?.school || {},
                    intermediate: details.education?.intermediate || {},
                    ug: details.education?.ug || {},
                    pg: details.education?.pg || {},
                    phd: details.education?.phd || {}
                },
                experience: details.experience || []
            }
        };

        res.json(formattedResponse);
    } catch (error) {
        console.error('Error fetching faculty details:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Add route for faculty profile
app.get('/faculty_profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'faculty_profile.html'));
});

// Add route to get faculty statistics
app.get('/api/faculty/stats', async (req, res) => {
    try {
        const stats = {};
        const departments = ['CSE', 'DS', 'AIML', 'IT'];

        // Count faculty members in each department
        for (const dept of departments) {
            const count = await User.countDocuments({
                role: 'Faculty',
                department: dept
            });
            stats[dept] = count;
        }

        res.json(stats);
    } catch (error) {
        console.error('Error fetching faculty stats:', error);
        res.status(500).json({ message: error.message });
    }
});

// Add route to update faculty details
app.post('/api/faculty/details/update', async (req, res) => {
    try {
        const { email, updates } = req.body;
        console.log('Received update data:', updates);

        const facultyDetails = await FacultyDetails.findOne({ 'personal.email': email });
        
        if (!facultyDetails) {
            return res.status(404).json({ 
                success: false, 
                message: 'Faculty details not found' 
            });
        }

        // Process PhD data specifically
        const phdData = {
            ...facultyDetails.education?.phd,
            name: updates.educationDetails?.phd?.name || facultyDetails.education?.phd?.name,
            location: updates.educationDetails?.phd?.location || facultyDetails.education?.phd?.location,
            startDate: updates.educationDetails?.phd?.startDate || facultyDetails.education?.phd?.startDate,
            endDate: updates.educationDetails?.phd?.endDate || facultyDetails.education?.phd?.endDate,
            instituteType: updates.educationDetails?.phd?.instituteType || facultyDetails.education?.phd?.instituteType,
            status: updates.educationDetails?.phd?.status || facultyDetails.education?.phd?.status,
            currentYear: updates.educationDetails?.phd?.currentYear || facultyDetails.education?.phd?.currentYear,
            gradeType: updates.educationDetails?.phd?.gradeType || facultyDetails.education?.phd?.gradeType,
            grade: parseFloat(updates.educationDetails?.phd?.grade) || facultyDetails.education?.phd?.grade || 0
        };

        // Calculate duration for PhD if dates exist
        if (phdData.startDate && phdData.endDate) {
            phdData.duration = calculateDuration(phdData.startDate, phdData.endDate);
        }

        // Create the update object
        const updateObj = {
            personal: updates.personalDetails || updates.personal || facultyDetails.personal,
            education: {
                ...facultyDetails.education,
                phd: phdData
            },
            experience: updates.experiences || facultyDetails.experience || [],
            updatedAt: new Date()
        };

        // Update the document
        const result = await FacultyDetails.findOneAndUpdate(
            { 'personal.email': email },
            { $set: updateObj },
            { new: true }
        );

        console.log('Updated PhD data:', result.education.phd);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: result
        });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

function calculateDuration(startDate, endDate) {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const years = end.getFullYear() - start.getFullYear();
    const months = end.getMonth() - start.getMonth();
    return `${years} years ${months} months`;
}

// Update the get faculty details route
app.get('/api/faculty/details/byEmail/:email', async (req, res) => {
    try {
        console.log('Fetching details for email:', req.params.email);
        const details = await FacultyDetails.findOne({ 
            'personal.email': req.params.email 
        });
        
        if (!details) {
            return res.status(404).json({ 
                success: false, 
                message: 'Details not found' 
            });
        }

        // Ensure PhD data is properly formatted
        const phdData = details.education?.phd || {
            name: '',
            location: '',
            startDate: null,
            endDate: null,
            instituteType: '',
            status: '',
            currentYear: null,
            gradeType: '',
            grade: 0,
            duration: ''
        };

        const formattedResponse = {
            success: true,
            data: {
                personal: details.personal || {},
                education: {
                    ...details.education,
                    phd: phdData
                },
                experience: details.experience || []
            }
        };

        console.log('Sending PhD data:', formattedResponse.data.education.phd);
        res.json(formattedResponse);
    } catch (error) {
        console.error('Error fetching faculty details:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Fix the faculty profile route
app.get('/faculty_profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'faculty_profile.html'));
});

// Add reports route for admin
app.get('/reports', (req, res) => {
    res.sendFile(path.join(__dirname, 'reports.html'));
});

// Add API endpoint to get faculty details for admin
app.get('/api/admin/faculty-details', async (req, res) => {
    try {
        const facultyUsers = await User.find({ role: 'Faculty' }, '-password');
        const facultyDetailsPromises = facultyUsers.map(async user => {
            const details = await FacultyDetails.findOne({ 'personal.email': user.email });
            return {
                ...user.toObject(),
                details: details || null
            };
        });
        
        const facultyList = await Promise.all(facultyDetailsPromises);
        res.json(facultyList);
    } catch (error) {
        console.error('Error fetching faculty details:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add route to get all faculty details
app.get('/api/faculty/all-details', async (req, res) => {
    try {
        const facultyDetails = await FacultyDetails.find({});
        res.json(facultyDetails);
    } catch (error) {
        console.error('Error fetching faculty details:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Start server
const PORT = 4009;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
