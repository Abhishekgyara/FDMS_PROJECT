const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');
const multer = require('multer');
const nodemailer = require('nodemailer');
const fs = require('fs');
require('dotenv').config();


const { GridFSBucket } = require('mongodb');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');
// Add this after your mongoose connection
let gfs;
mongoose.connection.once('open', () => {
    gfs = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
    });
});



const app = express();
app.use(cors({
    origin: [
        'https://fdms-kmit.vercel.app', // Your Vercel URL
        'http://localhost:4009',
        'https://fdms-kmit-34a5woyn5-abhishek-gyaras-projects.vercel.app',
        'https://fdms-kmit-abhishekgyara-abhishek-gyaras-projects.vercel.app'      // Local development
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Add at the top with other requires
// Add at the top with other requires
// ... existing requires ...
const http = require('http');
const { Server } = require("socket.io");

// Add after creating your Express app
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
      origin: "http://localhost:4009",
      methods: ["GET", "POST"]
    }
});

const { OpenAI } = require('openai');




// Achievement Schema
const achievementSchema = new mongoose.Schema({
    facultyEmail: { type: String, required: true },
    name: { type: String, required: true },
    date: { type: Date, required: true },
    description: { type: String },
    certificateUrl: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Achievement = mongoose.model('Achievement', achievementSchema);

// Configure OpenAI
const openai = new OpenAI({
  apiKey: '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',
  timeout: 15000
});



// Inside the connection handler
io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('chat message', async (msg) => {
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "system",
                    content: "You are a helpful assistant for a Faculty Dashboard Management System. Keep responses professional and focused on academic matters."
                }, {
                    role: "user",
                    content: msg
                }],
                temperature: 0.7,
                max_tokens: 150
            });

            const response = completion.choices[0].message.content;
            socket.emit('bot response', response);
        } catch (error) {
            console.error('AI Error:', error);
            socket.emit('bot response', 'Sorry, I encountered an error. Please try again later.');
        }
    });
});
// ... rest of your existing code ...
// Remove generic static serving
// app.use(express.static(path.join(__dirname)));

// Achievements API routes
app.get('/api/achievements', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const achievements = await Achievement.find({ facultyEmail: email }).sort({ createdAt: -1 });
        res.json(achievements);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching achievements' });
    }
});

// Edit achievement route
app.put('/api/achievements/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, date, description, certificateUrl } = req.body;
        
        const achievement = await Achievement.findByIdAndUpdate(id, {
            name,
            date,
            description,
            certificateUrl
        }, { new: true });
        
        if (!achievement) {
            return res.status(404).json({ error: 'Achievement not found' });
        }
        
        res.json(achievement);
    } catch (error) {
        res.status(500).json({ message: 'Error updating achievement' });
    }
});

// Delete achievement route
app.delete('/api/achievements/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const achievement = await Achievement.findByIdAndDelete(id);
        
        if (!achievement) {
            return res.status(404).json({ error: 'Achievement not found' });
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting achievement' });
    }
});

app.post('/api/achievements', async (req, res) => {
    try {
        const { facultyEmail, name, date, description, certificateUrl } = req.body;
        const achievement = new Achievement({
            facultyEmail,
            name,
            date: date || new Date(),
            description,
            certificateUrl
        });
        await achievement.save();
        res.status(201).json(achievement);
    } catch (error) {
        console.error('Achievement Save Error:', error);
        const statusCode = error.name === 'ValidationError' ? 400 : 500;
        res.status(statusCode).json({ 
            message: error.message || 'Error saving achievement',
            errors: error.errors 
        });
    }
});

const PDFDocument = require('pdfkit');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const docWidth = 600;
const docHeight = 400;
const chartCanvas = new ChartJSNodeCanvas({ width: docWidth, height: docHeight });

// Enhanced function to format records in bordered boxes with bullet points
function formatNestedFields(doc, data) {
  // Helper function to format values with bullet points
  const formatValue = (value, indent = 0) => {
    const indentStr = ' '.repeat(indent * 4);
    
    if (Array.isArray(value)) {
      return value.map(v => `${indentStr}• ${formatValue(v, indent + 1)}`).join('\n');
    }
    if (typeof value === 'object' && value !== null) {
      return Object.entries(value)
        .map(([k, v]) => `${indentStr}• ${k}: ${formatValue(v, indent + 1)}`)
        .join('\n');
    }
    return String(value);
  };

  // Create bordered box for each record with enhanced styling
  doc.rect(50, doc.y, 500, 0)
     .lineWidth(1)
     .fillAndStroke('#f8f9fa', '#495057');
  
  Object.entries(data).forEach(([key, value]) => {
    const formattedValue = formatValue(value);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#212529').text(`• ${key}:`, 60, doc.y + 10, { width: 480 });
    doc.moveDown(0.2);
    doc.font('Helvetica').fontSize(9).fillColor('#495057').text(formattedValue, 80, doc.y, { width: 460 });
    doc.moveDown(0.5);
  });
  
  doc.rect(50, doc.y, 500, 0)
     .lineWidth(1)
     .fillAndStroke('#f8f9fa', '#495057');
  doc.moveDown(1.5);
}

app.get('/generate-summary-pdf', async (req, res) => {
  const doc = new PDFDocument({ autoFirstPage: false });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="FDMS_Collections_Summary.pdf"');
  doc.pipe(res);

  const collections = [
    {
      name: 'Faculty Profiles',
      model: FacultyDetails,
      getDept: item => item.personal?.department
    },
    {
      name: 'Faculty Subjects',
      model: FacultySubjects,
      getDept: item => item.department
    },
    {
      name: 'Faculty Skills',
      model: FacultySkills,
      getDept: item => item.department
    },
    {
      name: 'FDPs',
      model: FDP,
      getDept: item => item.department
    },
    {
      name: 'Workshops',
      model: Workshop,
      getDept: item => item.department
    },
    {
      name: 'Patents',
      model: Patent,
      getDept: item => item.department
    },
    {
      name: 'Research Publications',
      model: Research,
      getDept: item => item.department
    }
  ];

  for (const { name, model, getDept } of collections) {
    const data = await model.find({});
    const deptCount = {};

    data.forEach(docItem => {
      const dept = getDept(docItem) || 'Unknown';
      deptCount[dept] = (deptCount[dept] || 0) + 1;
    });

    doc.addPage();
    doc.fontSize(20).fillColor('black').text(name, { underline: true });
    doc.moveDown();

    if (data.length === 0) {
      doc.fontSize(14).text('No data available.');
      continue;
    }

    // Display each record in bordered boxes
    for (const item of data) {
      if (doc.y > 650) doc.addPage(); // Add more space for boxes
      formatNestedFields(doc, item.toObject());
    }

    // Generate chart image with enhanced styling
    const chartImage = await chartCanvas.renderToBuffer({
      type: 'bar',
      data: {
        labels: Object.keys(deptCount),
        datasets: [{
          label: 'Department Count',
          data: Object.values(deptCount),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${name} (Dept-wise)`
          },
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            titleColor: 'white',
            bodyColor: 'white',
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              font: {
                size: 10
              }
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              font: {
                size: 10
              }
            }
          }
        }
      }
    });

    // Add the chart to the PDF
    doc.addPage();
    doc.image(chartImage, { width: 500, align: 'center' });
  }

  doc.end();
});

// Connect to MongoDB






// const PDFDocument = require('pdfkit');

// app.get('/generate-summary-pdf', (req, res) => {
//   const doc = new PDFDocument();

//   // Set response headers
//   res.setHeader('Content-Type', 'application/pdf');
//   res.setHeader('Content-Disposition', 'attachment; filename="Collections_Summary.pdf"');

//   // Pipe PDF stream to response
//   doc.pipe(res);

//   // Add content to PDF
//   doc.fontSize(22).text('FDMS - Collections Summary Report', { align: 'center' });
//   doc.moveDown();
//   doc.fontSize(16).text('✔ This is a test PDF to confirm that PDFKit works.');
//   doc.moveDown();
//   doc.text('✔ Charts and database summaries will be added next.');

//   // Finalize the PDF
//   doc.end();
// });









// Add specific routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login_auth.html'));
});

app.get('/faculty_dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'faculty_dashboard.html'));
});


app.get('/aibot', (req, res) => {
    res.sendFile(path.join(__dirname, 'aibot.html'));
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
// Replace the existing MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://root:abhi@cluster-1.k5fgx.mongodb.net/fdms_web', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // 30 seconds
    socketTimeoutMS: 45000,
    retryWrites: true,
    w: 'majority',
    dbName: 'fdms_web' // 45 seconds,

}).then(() => {
    console.log('Connected to MongoDB Atlas');
}).catch(err => {
    console.error('Error connecting to MongoDB Atlas:', err); 
})


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
// ... existing code ...

// Google OAuth client
const googleClient = new OAuth2Client({
    clientId: '940020976752-ee8dupcuupmhepgsu70dcvsou7vs3rpi.apps.googleusercontent.com',
    clientSecret: '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',
    redirectUri: process.env.NODE_ENV === 'production' ? 'https://fdms-kmit.vercel.app/auth/google/callback' : 'http://localhost:4009/auth/google/callback',
    
});

// ... existing code ...


  // ... existing code ...

app.get('/auth/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        const { tokens } = await googleClient.getToken(code);
        
        // Verify the ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: googleClient._clientId
        });

        const payload = ticket.getPayload();
        const userEmail = payload.email;

        // Find or create user in your database
        let user = await User.findOne({ email: userEmail });
        if (!user) {
            // Create new user if not exists
            user = new User({
                name: payload.name,
                email: userEmail,
                googleId: payload.sub,
                profilePhoto: payload.picture,
                role: 'Faculty', // Set default role
                department: 'CSE' // Set default department
            });
            await user.save();
        }

        // Redirect based on role
        let redirectUrl = '/faculty_dashboard';
        if (user.role === 'HOD') {
            redirectUrl = '/hod_dashboard';
        } else if (user.role === 'Admin') {
            redirectUrl = '/admin_dashboard';
        }

        // Set user session or token
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        // Redirect with token
        res.redirect(`${redirectUrl}?token=${token}`);

    } catch (error) {
        console.error('Google OAuth callback error:', error);
        res.status(500).send('Authentication failed');
    }
});



// ... existing code ...
  

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
        department: String, // Added department field 
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
            duration: String,
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
            duration: String,
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
            status: {
                type: String,
                enum: ['no', 'pursuing', 'completed']
            },
            currentYear: Number,
            course: String,
            specialization: String,
            gradeType: String,
            grade: Number,
            certificatePath: String 
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
    updatedAt: { type: Date, default: Date.now },
    completionPercentage: {
  type: Number,
  default: 0
}
});



// ... existing pre-save hook ...
facultyDetailsSchema.pre('save', function(next) {
    let completedFields = 0;
    const totalFields = 12;
    const personal = this.personal || {};
    const education = this.education || {};
    const experience = this.experience || [];
  
    if (personal.name) completedFields++;
    if (personal.email) completedFields++;
    if (personal.phone) completedFields++;
    if (personal.department) completedFields++;
  
    if (education.school && education.school.name) completedFields++;
    if (education.intermediate && education.intermediate.name) completedFields++;
    if (education.ug && education.ug.name) completedFields++;
    if (education.pg && education.pg.name) completedFields++;
  
    if (experience.length > 0) completedFields += 2;
  
    if (education.phd && education.phd.status && education.phd.status !== 'no') completedFields++;
    if (education.phd && education.phd.certificatePath) completedFields++;
    else if (experience.some(exp => exp.certificate)) completedFields++;
  
    this.completionPercentage = Math.round((completedFields / totalFields) * 100);
    next();
  });
  
  app.post('/api/fix-profile-completion', async (req, res) => {
    try {
      const docs = await FacultyDetails.find();
      let updated = 0;
      for (const doc of docs) {
        doc.markModified('personal');
        doc.markModified('education');
        doc.markModified('experience');
        await doc.save();
        updated++;
      }
      res.json({ success: true, updated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
// Add this API endpoint to your existing routes
app.get('/api/faculty-details', async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      // Find faculty details directly by personal.email
      const facultyDetails = await FacultyDetails.findOne({ 'personal.email': email });
      
      if (!facultyDetails) {
        console.log(`No faculty details found for email: ${email}`);
        return res.status(404).json({ error: 'Faculty details not found' });
      }
      
      console.log(`Found faculty details for email: ${email}`);
      res.json(facultyDetails);
    } catch (error) {
      console.error('Error fetching faculty details:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const FacultyDetails = mongoose.model('FacultyDetails', facultyDetailsSchema);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const researchDir = path.join(uploadsDir, 'research');
const certificatesDir = path.join(uploadsDir, 'certificates');
const phdCertificatesDir = path.join(certificatesDir, 'phd');

// Create directories recursively
[uploadsDir, researchDir,certificatesDir, phdCertificatesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// Move Research Schema definition before any routes that use it
const researchSchema = new mongoose.Schema({
    title: { type: String, required: true },
    authors: { type: String, required: true },
    type: { type: String, required: true },
    publication: { type: String, required: true },
    date: { type: Date, required: true },
    abstract: String,
    documentPath: String,
    facultyEmail: { type: String, required: true },
    department: String,
    createdAt: { type: Date, default: Date.now }
});

// Create the Research model
const Research = mongoose.model('Research', researchSchema);

// Configure multer for research document uploads with PDF storage
const researchStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadPath = path.join(__dirname, 'uploads', 'research');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.pdf') {
            return cb(new Error('Only PDF files are allowed'));
        }
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const uploadResearch = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Configure multer for PhD certificate uploads
const phdCertificateStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadPath = path.join(__dirname, 'uploads', 'certificates', 'phd');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        // Create a unique filename with user email to avoid conflicts
        const userEmail = req.body.email || 'unknown';
        const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `phd_${sanitizedEmail}_${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});
//---------------------------
const uploadPhdCertificate = multer({
    storage: phdCertificateStorage,
    fileFilter: (req, file, cb) => {
        // Accept only PDF, JPG, JPEG, and PNG files
        if (
            file.mimetype === 'application/pdf' ||
            file.mimetype === 'image/jpeg' ||
            file.mimetype === 'image/jpg' ||
            file.mimetype === 'image/png'
        ) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
// PhD Certificate Upload Endpoint
app.post('/api/faculty/phd-certificate', uploadPhdCertificate.single('certificate'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No certificate uploaded' });
        }

        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Find the faculty details by email
        const facultyDetails = await FacultyDetails.findOne({ 'personal.email': email });
        if (!facultyDetails) {
            return res.status(404).json({ success: false, message: 'Faculty details not found' });
        }

        // Update the PhD certificate path
        facultyDetails.education.phd.certificatePath = `/uploads/certificates/phd/${req.file.filename}`;
        await facultyDetails.save();

        res.json({
            success: true,
            message: 'PhD certificate uploaded successfully',
            certificatePath: facultyDetails.education.phd.certificatePath
        });
    } catch (error) {
        console.error('Error uploading PhD certificate:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Serve certificate files
app.use('/uploads/certificates', express.static(path.join(__dirname, 'uploads', 'certificates')));

// Endpoint to get PhD certificate
app.get('/api/faculty/phd-certificate/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const facultyDetails = await FacultyDetails.findOne({ 'personal.email': email });

        if (!facultyDetails || !facultyDetails.education.phd.certificatePath) {
            return res.status(404).json({ success: false, message: 'PhD certificate not found' });
        }

        res.json({
            success: true,
            certificatePath: facultyDetails.education.phd.certificatePath
        });
    } catch (error) {
        console.error('Error getting PhD certificate:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
//---------------------------------------------
app.post('/api/research/submit', uploadResearch.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Generate a unique filename
        const filename = crypto.randomBytes(16).toString('hex') + path.extname(req.file.originalname);
        
        // Create write stream to GridFS
        const writeStream = gfs.openUploadStream(filename, {
            contentType: req.file.mimetype,
            metadata: {
                facultyEmail: req.body.facultyEmail,
                originalName: req.file.originalname
            }
        });

        // Write file to GridFS
        writeStream.write(req.file.buffer);
        writeStream.end();

        writeStream.on('finish', async () => {
            // Save research data with file reference
            const researchData = {
                ...req.body,
                documentPath: filename // Store the GridFS filename
            };

            const research = new Research(researchData);
            await research.save();

            res.json({ 
                success: true, 
                message: 'Research submitted successfully' 
            });
        });

        writeStream.on('error', (error) => {
            throw error;
        });

    } catch (error) {
        console.error('Research submission error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});
app.get('/api/research/document/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        
        // Check if file exists in GridFS
        const files = await gfs.find({ filename }).toArray();
        if (!files || files.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Document not found' 
            });
        }

        // Set proper headers
        res.set('Content-Type', 'application/pdf');
        res.set('Content-Disposition', `inline; filename="${filename}"`);
        
        // Create read stream and pipe to response
        const readStream = gfs.openDownloadStreamByName(filename);
        readStream.pipe(res);

    } catch (error) {
        console.error('Error serving PDF:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error serving document' 
        });
    }
});

app.get('/api/research/all', async (req, res) => {
    try {
        let query = {};
        if (req.query.department) query.department = req.query.department;
        if (req.query.type) query.type = req.query.type;

        const publications = await Research.find(query).sort({ date: -1 });
        res.json({ 
            success: true, 
            publications: publications.map(pub => ({
                ...pub.toObject(),
                date: pub.date.toISOString().split('T')[0]
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/research/:email', async (req, res) => {
    try {
        const publications = await Research.find({ facultyEmail: req.params.email })
            .sort({ date: -1 });
        res.json({ success: true, publications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// Move this route before other routes
app.use('/uploads/research', express.static(path.join(__dirname, 'uploads', 'research')));

// Add specific route for serving PDFs
app.get('/api/research/document/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, 'uploads', 'research', filename);
        
        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=' + filename);
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error serving PDF:', error);
        res.status(500).json({ success: false, message: 'Error serving document' });
    }
});

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

app.get('/voice_gesture_control.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'voice_gesture_control.js'));
});


// Add routes for serving dashboard files
app.get('/dashboard2', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard2.html'));
});

app.get('/Tathya_logo.jpg', (req, res) => {
    res.sendFile(path.join(__dirname, 'Tathya_logo.jpg'));
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
app.post('/api/faculty/submit-form', async (req, res) => {
    try {
        console.log('Received form data:', req.body);
        
        if (!req.body.personalDetails || !req.body.educationDetails) {
            return res.status(400).json({
                success: false,
                message: 'Missing required form data'
            });
        }

        const { personalDetails, educationDetails, experiences } = req.body;
        
        // Get email from the personal details
        const userEmail = personalDetails.email;
        console.log('Looking for user with email:', userEmail);

        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found. Please login again.'
            });
        }

        // Process PhD data
        let phdData = educationDetails.phd || {};
        if (phdData.status !== 'no') {
            phdData = {
                name: phdData.name || '',
                location: phdData.location || '',
                startDate: phdData.startDate ? new Date(phdData.startDate) : null,
                endDate: phdData.endDate ? new Date(phdData.endDate) : null,
                instituteType: phdData.instituteType || '',
                status: phdData.status || 'no',
                currentYear: phdData.status === 'pursuing' ? 
                    parseInt(phdData.currentYear) || null : null,
                course: phdData.course || '',
                specialization: phdData.specialization || '',
                gradeType: phdData.gradeType || '',
                grade: parseFloat(phdData.grade) || 0
            };
        }

        // Create processed education details
        const processedEducation = {
            ...educationDetails,
            phd: phdData,
            ug: {
                ...educationDetails.ug,
                course: educationDetails.ug?.course || '',
                specialization: educationDetails.ug?.specialization || ''
            },
            pg: {
                ...educationDetails.pg,
                course: educationDetails.pg?.course || '',
                specialization: educationDetails.pg?.specialization || ''
            }
        };

        const facultyDetails = await FacultyDetails.findOneAndUpdate(
            { 'personal.email': userEmail },
            {
                userId: user._id,
                personal: {
                    ...personalDetails,
                    department: user.department
                },
                education: processedEducation,
                experience: experiences,
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );

        console.log('Saved faculty details:', facultyDetails);

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
        const email = req.params.email;
        console.log('Fetching faculty details for email:', email);

        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('User not found');
        }

        const facultyDetails = await FacultyDetails.findOne({ 
            'personal.email': email 
        });

        if (!facultyDetails) {
            return res.json({
                success: false,
                message: 'Faculty details not found'
            });
        }

        console.log('Found faculty details:', facultyDetails);

        res.json({
            success: true,
            data: {
                personal: {
                    ...facultyDetails.personal,
                    department: user.department
                },
                education: facultyDetails.education || {},
                experience: facultyDetails.experience || []
            }
        });
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

        // Deep merge the updates with existing data
        const updateObj = {
            personal: {
                ...facultyDetails.personal.toObject(),
                ...updates.personalDetails
            },
            education: {
                school: {
                    ...facultyDetails.education.school,
                    ...updates.educationDetails.school
                },
                intermediate: {
                    ...facultyDetails.education.intermediate,
                    ...updates.educationDetails.intermediate
                },
                ug: {
                    ...facultyDetails.education.ug,
                    ...updates.educationDetails.ug
                },
                pg: {
                    ...facultyDetails.education.pg,
                    ...updates.educationDetails.pg
                },
                phd: {
                    ...facultyDetails.education.phd,
                    ...updates.educationDetails.phd
                }
            },
            experience: updates.experiences || facultyDetails.experience,
            updatedAt: new Date()
        };

        // Update the document
        const result = await FacultyDetails.findOneAndUpdate(
            { 'personal.email': email },
            { $set: updateObj },
            { new: true }
        );

        console.log('Updated faculty details:', result);

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
app.get('/api/faculty/details/byEmail/:email', async (req, res) => {
    try {
        const email = req.params.email;
        console.log('Fetching details for email:', email);
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const details = await FacultyDetails.findOne({ 
            'personal.email': email 
        });

        // Always include user data even if no details found
        const responseData = {
            success: true,
            data: {
                personal: {
                    email: email,
                    name: user.name,
                    department: user.department,
                    role: user.role,
                    ...(details?.personal || {})
                },
                education: details?.education || {},
                experience: details?.experience || []
            }
        };

        console.log('Sending response for email:', email);
        res.json(responseData);
    } catch (error) {
        console.error('Error fetching faculty details:', error);
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
        
        // First find the user to get department info
        const user = await User.findOne({ email: req.params.email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Then find faculty details
        const details = await FacultyDetails.findOne({ 
            'personal.email': req.params.email 
        });
        
        if (!details) {
            return res.json({
                success: true,
                data: {
                    personal: {
                        email: req.params.email,
                        department: user.department // Include department even if no other details exist
                    },
                    education: {},
                    experience: []
                }
            });
        }

        // Merge user department with existing personal details
        const personalDetails = {
            ...details.personal.toObject(),
            department: user.department // Ensure department is included
        };

        const formattedResponse = {
            success: true,
            data: {
                personal: personalDetails,
                education: details.education || {},
                experience: details.experience || []
            }
        };

        console.log('Sending response:', formattedResponse);
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

// Add route for notifications
app.get('/notifications', (req, res) => {
    res.sendFile(path.join(__dirname, 'notifications.html'));
});

// Rename existing reports route to notifications
app.get('/api/admin/notifications', async (req, res) => {
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

// Add new route for deleting faculty
app.delete('/api/faculty/delete/:email', async (req, res) => {
    try {
        const email = req.params.email;
        
        // Delete from FacultyDetails collection
        const result = await FacultyDetails.findOneAndDelete({ 'personal.email': email });
        
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Faculty not found'
            });
        }

        // Also delete the user from Users collection
        await User.findOneAndDelete({ email: email });

        res.json({
            success: true,
            message: 'Faculty deleted successfully'
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Add this route
app.get('/view_faculty', async (req, res) => {
    try {
        const department = req.query.department;
        const faculty = await User.find({
            role: 'Faculty',
            ...(department && { department: new RegExp(`^${department}$`, 'i') })
        }).select('-password');
        
        res.sendFile(path.join(__dirname, 'view_faculty.html'));
    } catch (error) {
        res.status(500).send('Error loading faculty data');
    }
});

// Route to fetch all research publications
app.get('/api/research', async (req, res) => {
    try {
        const publications = await Research.find().sort({ date: -1 }); // Fetch all publications
        console.log(`Found ${publications.length} publications`);

        res.json({
            success: true,
            publications: publications.map(pub => ({
                title: pub.title,
                authors: pub.authors,
                type: pub.type,
                publication: pub.publication,
                date: pub.date,
                abstract: pub.abstract,
                documentPath: pub.documentPath,
                department: pub.department
            }))
        });
    } catch (error) {
        console.error('Error fetching research:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching publications',
            error: error.message
        });
    }
});
// Add or update the research fetch route
app.get('/api/research/:email', async (req, res) => {
    try {
        const userEmail = req.params.email;
        console.log('Fetching research for:', userEmail);

        const publications = await Research.find({ facultyEmail: userEmail })
            .sort({ date: -1 });

        console.log(`Found ${publications.length} publications for user`);

        res.json({
            success: true,
            publications: publications.map(pub => ({
                title: pub.title,
                authors: pub.authors,
                type: pub.type,
                publication: pub.publication,
                date: pub.date,
                abstract: pub.abstract,
                documentPath: pub.documentPath,
                department: pub.department
            }))
        });
    } catch (error) {
        console.error('Error fetching research:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching publications',
            error: error.message
        });
    }
});


// Add reports route
app.get('/reports', (req, res) => {
    res.sendFile(path.join(__dirname, 'reports.html'));
});

app.get('/chatbot.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'chatbot.html'));
});

app.get('/view_publications', (req, res) => {
    res.sendFile(path.join(__dirname, 'view_publications.html'));
});

app.get('/research', (req, res) => {
    res.sendFile(path.join(__dirname, 'research.html'));
});

app.get('/view_research', (req, res) => {
    res.sendFile(path.join(__dirname, 'view_research.html'));
});

// Add new route to get all faculty form submissions
app.get('/api/faculty/all-details', async (req, res) => {
    try {
        // First get all faculty users
        const facultyUsers = await User.find({ role: 'Faculty' });
        
        // Get their form submissions
        const facultyDetails = await FacultyDetails.find({});
        
        // Combine user data with their form submissions
        const combinedData = facultyUsers.map(user => {
            const details = facultyDetails.find(detail => 
                detail.personal?.email === user.email
            );
            
            return {
                personal: {
                    name: user.name,
                    email: user.email,
                    department: user.department,
                    phone: user.phoneNumber,
                    ...details?.personal
                },
                education: details?.education || {},
                experience: details?.experience || []
            };
        });

        res.json(combinedData);
    } catch (error) {
        console.error('Error fetching faculty details:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update faculty_profile route to handle both faculty and HOD profiles
app.get('/faculty_profile', async (req, res) => {
    res.sendFile(path.join(__dirname, 'faculty_profile.html'));
});
app.get('/attendamnce', async (req, res) => {
    res.sendFile(path.join(__dirname, 'attendamnce.html'));
});

// Add API endpoint to get profile details
app.get('/api/faculty/details/byEmail/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        const details = await FacultyDetails.findOne({ 
            'personal.email': req.params.email 
        });

        if (!details) {
            return res.json({
                success: true,
                data: {
                    personal: {
                        email: req.params.email,
                        department: user?.department,
                        role: user?.role
                    },
                    education: {},
                    experience: []
                }
            });
        }

        const formattedResponse = {
            success: true,
            data: {
                personal: {
                    ...details.personal,
                    department: user?.department,
                    role: user?.role
                },
                education: details.education || {},
                experience: details.experience || []
            }
        };

        res.json(formattedResponse);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get('/api/admin/faculty-details', async (req, res) => {
    try {
        // Get both faculty and HOD users
        const users = await User.find({
            role: { $in: ['Faculty', 'HOD'] }
        });
        
        const facultyDetails = await FacultyDetails.find({});
        
        const combinedData = users.map(user => {
            const details = facultyDetails.find(detail => 
                detail.personal?.email === user.email
            );
            
            return {
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                phoneNumber: user.phoneNumber,
                details: details || null
            };
        });

        res.json(combinedData);
    } catch (error) {
        console.error('Error fetching details:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update the nodemailer transporter configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'abhishekbhang2006@gmail.com',
        pass: 'rqlz dpuj swcd lmzv' // Replace this with the generated password
    }
});

app.post('/api/send-otp', async (req, res) => {
    try {
        const { to, otp } = req.body;
        
        // Verify connection configuration
        await transporter.verify();
        
        const mailOptions = {
            from: '"FDMS System" <abhishekbhang2006@gmail.com>',
            to: to,
            subject: 'Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
                    <h2 style="color: #2575fc;">Password Reset OTP</h2>
                    <p>Your OTP for password reset is:</p>
                    <h1 style="color: #28a745; letter-spacing: 5px; text-align: center; padding: 10px; background: #f8f9fa; border-radius: 5px;">${otp}</h1>
                    <p>This OTP will expire in 5 minutes.</p>
                    <p style="color: #666;">If you did not request this password reset, please ignore this email.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send OTP email',
            error: error.message 
        });
    }
});

app.get('/api/check-email/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        res.json({ exists: !!user });
    } catch (error) {
        res.status(500).json({ exists: false, message: error.message });
    }
});


app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await User.findOneAndUpdate(
            { email: email },
            { password: hashedPassword }
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add routes for security questions
app.post('/api/set-security-questions', async (req, res) => {
    try {
        const { email, question1, answer1, question2, answer2 } = req.body;
        
        await SecurityQuestions.findOneAndUpdate(
            { email },
            { question1, answer1, question2, answer2 },
            { upsert: true }
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/get-security-questions/:email', async (req, res) => {
    try {
        const questions = await SecurityQuestions.findOne({ email: req.params.email });
        if (!questions) {
            res.status(404).json({ exists: false });
            return;
        }
        res.json({
            exists: true,
            questions: {
                question1: questions.question1,
                question2: questions.question2
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/verify-answers', async (req, res) => {
    try {
        const { email, answer1, answer2 } = req.body;
        const questions = await SecurityQuestions.findOne({ email });
        
        if (questions.answer1 === answer1 && questions.answer2 === answer2) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Incorrect answers' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/notifications', async (req, res) => {
    try {
        const { message, important, expiresAt } = req.body;
        const adminEmail = req.body.createdBy;

        const notification = new Notification({
            message,
            important,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            createdBy: adminEmail
        });

        await notification.save();
        res.json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/notifications/active', async (req, res) => {
    try {
        const currentDate = new Date();
        const notifications = await Notification.find({
            $or: [
                { expiresAt: { $gt: currentDate } },
                { expiresAt: null }
            ]
        }).sort({ createdAt: -1 });
        
        res.json({ success: true, notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/messages/send', async (req, res) => {
    try {
        const { to, subject, message } = req.body;
        const from = req.body.from || 'admin@fdms.com';

        const newMessage = new Message({
            from,
            to,
            subject,
            message
        });

        await newMessage.save();
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add this route to get faculty count by department
// Add this route for department-specific faculty count
// Update the faculty count endpoint
app.get('/api/faculty/count/:department', async (req, res) => {
    try {
        const department = decodeURIComponent(req.params.department);
        console.log(`Counting faculty for department: ${department}`);
        
        const count = await User.countDocuments({
            role: 'Faculty',
            department: { $regex: new RegExp(`^${department}$`, 'i') }
        });

        console.log(`Found ${count} faculty members in ${department}`);
        res.json({ success: true, count: count });
    } catch (error) {
        console.error('Department count error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching department count'
        });
    }
});


app.get('/api/messages/:userEmail', async (req, res) => {
    try {
        const messages = await Message.find({ 
            to: req.params.userEmail 
        }).sort({ createdAt: -1 });
        
        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/messages/read/:messageId', async (req, res) => {
    try {
        await Message.findByIdAndUpdate(req.params.messageId, { read: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add routes for faculty and HOD notifications
app.get('/faculty_notifications', (req, res) => {
    res.sendFile(path.join(__dirname, 'faculty_notifications.html'));
});
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/hod_notifications', (req, res) => {
    res.sendFile(path.join(__dirname, 'hod_notifications.html'));
});
// Add Notification Schema
const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    important: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    createdBy: { type: String },
    readBy: [{ type: String }]
});

const Notification = mongoose.model('Notification', notificationSchema);

// Update notification routes
app.post('/api/notifications', async (req, res) => {
    try {
        console.log('Received notification data:', req.body);
        const { message, important, expiresAt, createdBy } = req.body;

        const notification = new Notification({
            message,
            important,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            createdBy
        });

        await notification.save();
        console.log('Notification saved:', notification);

        res.json({ 
            success: true, 
            message: 'Notification posted successfully',
            notification 
        });
    } catch (error) {
        console.error('Error posting notification:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Add this route


app.get('/api/notifications/active', async (req, res) => {
    try {
        const currentDate = new Date();
        const notifications = await Notification.find({
            $or: [
                { expiresAt: { $gt: currentDate } },
                { expiresAt: null }
            ]
        }).sort({ createdAt: -1 });
        
        res.json({ 
            success: true, 
            notifications 
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Update the message read route
app.post('/api/messages/read', async (req, res) => {
    try {
        const { messageId, userName, readAt } = req.body;
        
        const message = await Message.findByIdAndUpdate(messageId, {
            read: true,
            readBy: userName,
            readAt: readAt
        }, { new: true });

        res.json({ success: true, message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add new route to get message status
app.get('/api/messages/status', async (req, res) => {
    try {
        // Get all messages sorted by creation date
        const messages = await Message.find()
            .sort({ createdAt: -1 });

        res.json({ 
            success: true, 
            messages: messages.map(msg => ({
                subject: msg.subject,
                message: msg.message,
                to: msg.to,
                createdAt: msg.createdAt,
                read: msg.read,
                readBy: msg.readBy,
                readAt: msg.readAt
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add new routes for research functionality





// Add route to serve uploaded files
app.use('/uploads/research', express.static(path.join(__dirname, 'uploads', 'research')));

// Add route for view_research page
app.get('/view_research', (req, res) => {
    res.sendFile(path.join(__dirname, 'view_research.html'));
});


// Add this route before other routes
app.use('/uploads/research', express.static(path.join(__dirname, 'uploads', 'research')));

// Update research fetch route
// app.get('/api/research/all', async (req, res) => {
//     try {
//         let query = {};
        
//         // Add filters if provided
//         if (req.query.department) {
//             query.department = req.query.department;
//         }
//         if (req.query.type) {
//             query.type = req.query.type;
//         }

//         const publications = await Research.find(query)
//             .sort({ date: -1 });

//         console.log(`Found ${publications.length} publications`);
//         console.log('Publications:', publications);

//         res.json({
//             success: true,
//             publications: publications.map(pub => ({
//                 title: pub.title,
//                 authors: pub.authors,
//                 department: pub.department,
//                 type: pub.type,
//                 publication: pub.publication,
//                 date: pub.date,
//                 documentPath: pub.documentPath
//             }))
//         });
//     } catch (error) {
//         console.error('Error fetching research:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching publications',
//             error: error.message
//         });
//     }
// });

// Update the research fetch route
app.get('/api/research/all', async (req, res) => {
    try {
        let query = {};
        
        // Add filters if provided
        if (req.query.department) {
            query.department = req.query.department;
        }
        if (req.query.type) {
            query.type = req.query.type;
        }

        const publications = await Research.find(query).sort({ date: -1 });
        console.log(`Found ${publications.length} publications`);

        res.json({
            success: true,
            publications: publications.map(pub => ({
                title: pub.title,
                authors: pub.authors,
                department: pub.department,
                type: pub.type,
                publication: pub.publication,
                date: pub.date,
                abstract: pub.abstract,
                documentPath: pub.documentPath
            }))
        });
    } catch (error) {
        console.error('Error fetching research:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching publications',
            error: error.message
        });
    }
});

// Add route for serving PDF files





// Add settings route
app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'settings.html'));
});

// Add a dedicated route for fetching research publications for settings page
app.get('/api/research/publications', async (req, res) => {
    try {
        const publications = await Research.find()
            .sort({ date: -1 });

        console.log(`Found ${publications.length} publications for settings page`);

        res.json({
            success: true,
            publications: publications.map(pub => ({
                title: pub.title,
                authors: pub.authors,
                type: pub.type,
                publication: pub.publication,
                date: pub.date,
                abstract: pub.abstract,
                department: pub.department,
                facultyEmail: pub.facultyEmail,
                documentPath: pub.documentPath
            }))
        });
    } catch (error) {
        console.error('Error fetching publications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching publications',
            error: error.message
        });
    }
});


// Add this with other routes
app.get('/workshop', (req, res) => {
    res.sendFile(path.join(__dirname, 'workshop.html'));
});

app.get('/admin_rpft', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin_rpft.html'));
});

app.get('/view_workshops', (req, res) => {
    res.sendFile(path.join(__dirname, 'view_workshops.html'));
});

app.get('/view_workshop', (req, res) => {
    res.sendFile(path.join(__dirname, 'view_workshop.html'));
});



app.get('/rpft', (req, res) => {
    res.sendFile(path.join(__dirname, 'rpft.html'));
});

app.get('/patents', (req, res) => {
    res.sendFile(path.join(__dirname, 'patents.html'));
});

app.get('/workshops', (req, res) => {
    res.sendFile(path.join(__dirname, 'workshops.html'));
});

app.get('/fdps', (req, res) => {
    res.sendFile(path.join(__dirname, 'fdps.html'));
});

app.get('/summary', (req, res) => {
    res.sendFile(path.join(__dirname, 'summary.html'));
});



// Add this near the top of your routes
app.use('/uploads/workshops', express.static(path.join(__dirname, 'uploads', 'workshops')));

//------------------------------------------
// ... existing code ...

// Workshop Schema
// Workshop Schema
// Workshop Schema
// ... existing code ...

const workshopSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, required: true },
    name: { type: String, required: true },
    department: { type: String, required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    duration: { type: Number, required: true },
    location: { type: String, required: true },
    instituteName: { type: String, required: true },
    level: { type: String, required: true },
    outcomes: { type: String, required: true },
    description: { type: String },
    certificatePath: String, // Keep this for backward compatibility
    documentPath: String, // Add this for GridFS
    facultyEmail: { type: String, required: true }
}, { timestamps: true });

// ... existing code ...
const Workshop = mongoose.model('Workshop', workshopSchema);

// Workshop file upload configuration
// Workshop file upload configuration
// Replace existing workshopStorage with this:
const uploadWorkshop = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});


// ... existing code ...

// Workshop Routes
// Workshop Routes
app.post('/api/workshops/submit', uploadWorkshop.single('certificate'), async (req, res) => {
    try {
        if (!req.body.title || !req.body.type || !req.body.facultyEmail) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Generate a unique filename
        const filename = crypto.randomBytes(16).toString('hex') + path.extname(req.file.originalname);
        
        // Create write stream to GridFS
        const writeStream = gfs.openUploadStream(filename, {
            contentType: req.file.mimetype,
            metadata: {
                facultyEmail: req.body.facultyEmail,
                originalName: req.file.originalname
            }
        });

        // Write file to GridFS
        writeStream.write(req.file.buffer);
        writeStream.end();

        writeStream.on('finish', async () => {
            const workshopData = {
                ...req.body,
                documentPath: filename, // Store GridFS filename
                certificatePath: filename // Keep for backward compatibility
            };

            const workshop = new Workshop(workshopData);
            await workshop.save();

            res.json({ 
                success: true, 
                message: 'Workshop details saved successfully',
                documentPath: filename
            });
        });

        writeStream.on('error', (error) => {
            throw error;
        });

    } catch (error) {
        console.error('Workshop submission error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Get workshops by email
// ... existing code ...

app.get('/api/workshops/email/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const workshops = await Workshop.find({ facultyEmail: email })
            .sort({ fromDate: -1 });
            
        res.json({
            success: true,
            workshops: workshops.map(workshop => ({
                ...workshop.toObject(),
                fromDate: workshop.fromDate.toISOString().split('T')[0],
                toDate: workshop.toDate.toISOString().split('T')[0],
                certificatePath: workshop.certificatePath
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ... existing code ...


// Serve workshop certificates
// Serve workshop certificates
app.get('/api/workshops/certificate/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const file = await gfs.find({ filename }).toArray();
        
        if (!file || file.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Certificate not found' 
            });
        }

        res.set('Content-Type', 'application/pdf');
        const readStream = gfs.openDownloadStreamByName(filename);
        readStream.pipe(res);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error serving certificate' 
        });
    }
});


// ... existing code ...

app.get('/api/workshops/all', async (req, res) => {
    try {
        const email = req.query.email; // Get email from query params
        let query = {};
        
        if (email) {
            query.facultyEmail = email; // Add email filter if provided
        }

        const workshops = await Workshop.find(query)
            .sort({ fromDate: -1 });
            
        res.json({
            success: true,
            workshops: workshops.map(workshop => ({
                ...workshop.toObject(),
                fromDate: workshop.fromDate.toISOString().split('T')[0],
                toDate: workshop.toDate.toISOString().split('T')[0],
                certificatePath: workshop.certificatePath
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ... existing code ...

// ... existing code ...
    


// ... existing code ...

// Add this route to get all workshops
app.get('/api/workshops/all', async (req, res) => {
    try {
        const workshops = await Workshop.find({})
            .sort({ fromDate: -1 });
            
        res.json({
            success: true,
            workshops: workshops.map(workshop => ({
                ...workshop.toObject(),
                fromDate: workshop.fromDate.toISOString().split('T')[0],
                toDate: workshop.toDate.toISOString().split('T')[0],
                certificatePath: workshop.certificatePath
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ... existing code ...

// Get workshops by email

// ... existing code ...

//-patents
// Patent Schema
// ... existing code ...

// Patent Schema (modify to remove documentPath)
const patentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    name: { type: String, required: true },
    department: { type: String, required: true },
    patentType: { type: String, required: true },
    status: { type: String, required: true },
    overview: { type: String, required: true },
    authors: [String],
    facultyEmail: { type: String, required: true },
    documentPath: String,
    patentNumber: String,
    applicationNumber: String,
    publicationDate: Date,
    grantDate: Date,
    // Remove documentPath since we'll use GridFS
}, { timestamps: true });

const Patent = mongoose.model('Patent', patentSchema);

// Configure multer for patent document uploads (memory storage for GridFS)
const uploadPatent = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

// Patent submission route
// ... existing code ...

app.post('/api/patents/submit', uploadPatent.single('patentDocument'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Generate a unique filename
        const filename = crypto.randomBytes(16).toString('hex') + path.extname(req.file.originalname);
        
        // Create write stream to GridFS
        const writeStream = gfs.openUploadStream(filename, {
            contentType: req.file.mimetype,
            metadata: {
                facultyEmail: req.body.facultyEmail,
                originalName: req.file.originalname
            }
        });

        // Write file to GridFS
        writeStream.write(req.file.buffer);
        writeStream.end();

        writeStream.on('finish', async () => {
            // Save patent data with documentPath
            const patentData = {
                ...req.body,
                authors: JSON.parse(req.body.authors),
                documentPath: filename // Add this line to store the document path
            };

            const patent = new Patent(patentData);
            await patent.save();

            res.json({ 
                success: true, 
                message: 'Patent submitted successfully',
                documentPath: filename // Return the path for reference
            });
        });

        writeStream.on('error', (error) => {
            throw error;
        });

    } catch (error) {
        console.error('Patent submission error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ... existing code ...

// Route to get patent document
app.get('/api/patents/document/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const file = await gfs.find({ filename }).toArray();
        
        if (!file || file.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Document not found' 
            });
        }

        res.set('Content-Type', 'application/pdf');
        const readStream = gfs.openDownloadStreamByName(filename);
        readStream.pipe(res);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error serving document' 
        });
    }
});
app.get('/api/patents/:email', async (req, res) => {
    try {
        const patents = await Patent.find({ facultyEmail: req.params.email });
        res.json({ success: true, patents });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ... existing code ...

//--------------------
//fdps

// Update FDP Schema to include certificate
const fdpSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, required: true },
    name: { type: String, required: true },
    department: { type: String, required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    organizedBy: { type: String, required: true },
    locationType: { type: String, required: true },
    level: { type: String, required: true },
    fundingAgency: String,
    objectives: { type: String, required: true },
    facultyEmail: { type: String, required: true },
    documentPath: String,
    certificatePath: String,
    participantsCount: {
        type: Number,
        required: function() {
            return this.type === 'conducted';
        }
    },
    
}, { timestamps: true });

const FDP = mongoose.model('FDP', fdpSchema);


// Add this before the FDP routes and schema
// ... existing code ...

// Update FDP upload configuration
const uploadFDP = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

// ... existing code ...


// Update the FDP submit route to handle Multer errors
// Update the FDP submit route
// Update the FDP submit route
// ... existing code ...

app.post('/api/fdp/submit', uploadFDP.single('certificate'), async (req, res) => {
    try {
        // Validate required fields
        if (!req.body.title || !req.body.type || !req.body.facultyEmail) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Generate unique filename
        const filename = crypto.randomBytes(16).toString('hex') + path.extname(req.file.originalname);
        
        // Create write stream to GridFS
        const writeStream = gfs.openUploadStream(filename, {
            contentType: req.file.mimetype,
            metadata: {
                facultyEmail: req.body.facultyEmail,
                originalName: req.file.originalname
            }
        });

        // Write file to GridFS
        writeStream.write(req.file.buffer);
        writeStream.end();

        writeStream.on('finish', async () => {
            const fdpData = {
                ...req.body,
                participantsCount: req.body.type === 'conducted' ? parseInt(req.body.participantsCount) : null,
                documentPath: filename
            };

            const fdp = new FDP(fdpData);
            await fdp.save();

            res.json({ 
                success: true, 
                message: 'FDP details saved successfully',
                documentPath: filename
            });
        });

        writeStream.on('error', (error) => {
            throw error;
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
// ... existing code ...

// Add this route to get all FDPs
app.get('/api/fdp/all', async (req, res) => {
    try {
        const fdps = await FDP.find({})
            .sort({ fromDate: -1 });
            
        res.json({
            success: true,
            fdps: fdps.map(fdp => ({
                ...fdp.toObject(),
                fromDate: fdp.fromDate.toISOString().split('T')[0],
                toDate: fdp.toDate.toISOString().split('T')[0],
                certificatePath: fdp.certificatePath
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ... existing code ...

// ... existing code ...

// Add this route to get FDPs by faculty email
// ... existing code ...

app.get('/api/fdp/email/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const fdps = await FDP.find({ facultyEmail: email })
            .sort({ fromDate: -1 });
            
        res.json({
            success: true,
            fdps: fdps.map(fdp => ({
                ...fdp.toObject(),
                fromDate: fdp.fromDate.toISOString().split('T')[0],
                toDate: fdp.toDate.toISOString().split('T')[0],
                certificatePath: fdp.certificatePath
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ... existing code ...
// Add route to serve certificate files
// ... existing code ...

app.get('/api/fdp/certificate/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const file = await gfs.find({ filename }).toArray();
        
        if (!file || file.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Certificate not found' 
            });
        }

        res.set('Content-Type', 'application/pdf');
        const readStream = gfs.openDownloadStreamByName(filename);
        readStream.pipe(res);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error serving certificate' 
        });
    }
});

// ... existing code ...




// ... existing schemas ...

// Faculty Skills Schema
const facultySkillsSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    skills: { type: [String], default: [] },
    updatedAt: { type: Date, default: Date.now }
});

const FacultySkills = mongoose.model('FacultySkills', facultySkillsSchema);

// Faculty Subjects Schema
const facultySubjectsSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    subjects: { type: [String], default: [] },
    updatedAt: { type: Date, default: Date.now }
});

const FacultySubjects = mongoose.model('FacultySubjects', facultySubjectsSchema);


// ... existing routes ...

// Skills Routes
app.post('/api/faculty/skills', async (req, res) => {
    try {
        const { email, skill } = req.body;
        await FacultySkills.findOneAndUpdate(
            { email },
            { $addToSet: { skills: skill } },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/faculty/skills', async (req, res) => {
    try {
        const { email, skill } = req.body;
        await FacultySkills.findOneAndUpdate(
            { email },
            { $pull: { skills: skill } }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/faculty/skills/:email', async (req, res) => {
    try {
        const skills = await FacultySkills.findOne({ email: req.params.email });
        res.json({ 
            success: true, 
            skills: skills?.skills || [] 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Subjects Routes
app.post('/api/faculty/subjects', async (req, res) => {
    try {
        const { email, subject } = req.body;
        await FacultySubjects.findOneAndUpdate(
            { email },
            { $addToSet: { subjects: subject } },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/faculty/subjects', async (req, res) => {
    try {
        const { email, subject } = req.body;
        await FacultySubjects.findOneAndUpdate(
            { email },
            { $pull: { subjects: subject } }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/faculty/subjects/:email', async (req, res) => {
    try {
        const subjects = await FacultySubjects.findOne({ email: req.params.email });
        res.json({ 
            success: true, 
            subjects: subjects?.subjects || [] 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Combined Faculty Data Route
app.get('/api/faculty/all-data/:email', async (req, res) => {
    try {
        const [skills, subjects] = await Promise.all([
            FacultySkills.findOne({ email: req.params.email }),
            FacultySubjects.findOne({ email: req.params.email })
        ]);
        
        res.json({
            success: true,
            data: {
                skills: skills?.skills || [],
                subjects: subjects?.subjects || []
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});



//-------------------------attendance
// ... existing code ...

// Attendance Schema
// ... existing code ...

// Attendance Schema
// ... existing code ...

// Attendance Schema
// Attendance Schema
const attendanceSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent'],
        default: 'Present'
    },
    location: {
        latitude: Number,
        longitude: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create compound index for email and date
attendanceSchema.index({ email: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

// Attendance Routes
// Attendance Routes
// Update the attendance marking endpoint
app.post('/api/attendance/mark', async (req, res) => {
    try {
        const { name, email, date, lat, lon } = req.body;

        // Validate required fields
        if (!name || !email || !date || lat === undefined || lon === undefined) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required (name, email, date, lat, lon)'
            });
        }

        // Convert date to start of day for comparison
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        // Check if attendance already marked for this date
        const existingAttendance = await Attendance.findOne({
            email: email,
            date: attendanceDate
        });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already marked for today'
            });
        }

        // Create new attendance record
        const attendance = new Attendance({
            name,
            email,
            date: attendanceDate,
            location: { 
                latitude: parseFloat(lat),
                longitude: parseFloat(lon)
            },
            status: 'Present'
        });

        await attendance.save();

        res.json({
            success: true,
            message: 'Attendance marked successfully',
            data: {
                id: attendance._id,
                date: attendance.date,
                location: attendance.location
            }
        });
    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking attendance',
            error: error.message
        });
    }
});

// Update the attendance stats endpoint
app.get('/api/attendance/stats/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        // Get all attendance records for this user
        const records = await Attendance.find({ email })
            .sort({ date: -1 })
            .lean();

        // Calculate statistics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const startDate = new Date('2025-05-01'); // Your system's start date
        const totalDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
        const attendedDays = records.length;
        const percentage = Math.round((attendedDays / totalDays) * 100);
        
        const lastMarked = records.length > 0 ? records[0].date : null;

        res.json({
            success: true,
            data: {
                records,
                stats: {
                    totalDays: attendedDays,
                    attendancePercentage: percentage,
                    lastMarked,
                    trend: percentage >= 75 ? 'up' : 'down'
                }
            }
        });
    } catch (error) {
        console.error('Error fetching attendance stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance statistics',
            error: error.message
        });
    }
});

// ... existing code .....




//------------------------------------------------------------------




// Start server
const PORT = 4009;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// ... existing code ...

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ... existing code ...
