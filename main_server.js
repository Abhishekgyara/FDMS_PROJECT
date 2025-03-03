const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const loginRoutes = require("./server"); // Login/Signup CRUD operations
const profileRoutes = require("./profilesServer"); // Faculty profile CRUD operations

const app = express();
const PORT = 3000; // Single port for all functionalities

// Middleware
app.use(express.json());
app.use(cors());

// ✅ MongoDB Connection (Ensures deprecation warnings are handled)
mongoose.set("strictQuery", false);
mongoose
  .connect("mongodb://localhost:27017/mydatabase", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Failed:", err));

// ✅ Health Check Route (To confirm server is running)
app.get("/", (req, res) => {
  res.send("🚀 Server is running successfully!");
});

// ✅ Routes
app.use("/api/login", loginRoutes); // Handles login/signup (added `/api/` for clarity)
app.use("/api/profiles", profileRoutes); // Handles faculty profiles (plural for better semantics)

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:3000`)
  // console.log(`✅ Server running on http://localhost:${PORT}`);
});
