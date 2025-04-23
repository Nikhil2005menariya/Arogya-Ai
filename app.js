import express from "express";
import bodyParser from "body-parser";
import { MongoClient, GridFSBucket, ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import nodemailer from "nodemailer";
import multer from "multer";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";

const app = express();
const port = 3000;
const saltRounds = 10;
const storage = multer.memoryStorage();
const upload = multer({ storage });

let db;
let otp;
const __dirname = path.resolve();

const httpServer = createServer(app); // Correct HTTP server

app.use(cors());

const io = new Server(httpServer, {
  // Use httpServer here
  cors: {
    origin: "https://healthai-arogya.onrender.com", // Allow requests from Vite
    methods: ["GET", "POST"],
  },
});

app.set("view engine", "ejs");
// app.use(express.static(path.join(__dirname, "public")));
app.use(express.static("public")); 


global.onlineUsers = new Map();
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
  
    // Handle text messages
    socket.on("send-msg", (message) => {
        io.emit("msg-recieve", { from: socket.id, msg: message }); // Send to everyone
    });
  
    // Handle call request
    socket.on("call-user", () => {
      socket.broadcast.emit("incoming-call");
    });
  
    // Handle call acceptance
    socket.on("accept-call", () => {
      io.emit("start-call");
    });
  
    // Handle WebRTC offer
    socket.on("offer", (offer) => {
      socket.broadcast.emit("offer", offer);
    });
  
    // Handle WebRTC answer
    socket.on("answer", (answer) => {
      socket.broadcast.emit("answer", answer);
    });
  
    // Handle call end
    socket.on("end-call", () => {
      io.emit("end-call");
    });
  
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

const mongoURI = "mongodb://localhost:27017";
const dbName = "arogya"; // Updated to match new project
MongoClient.connect(mongoURI)
  .then((client) => {
    db = client.db(dbName);
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error("MongoDB Connection Error:", err));

  httpServer.listen(port, () => {
  console.log("Server active on port 3000");
});

// Middleware
app.use(
  session({
    secret: "TOPSECRETWORD",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

// Middleware for authentication
function verifyUser(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/");
  }
}

// Landing Page
app.get("/",async (req, res) => {  
    res.render("landing.ejs");
  
});


// **Login Route**
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const patient = await db.collection("patients").findOne({ email });
    const doctor = await db.collection("doctors").findOne({ email });

    const user = patient || doctor;

    if (!user) {
        return res.status(400).json({ error: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(400).json({ error: "Invalid password" });
    }

    // Store user session
    req.session.user = {
        id: user._id,
        email: user.email,
        role: patient ? "patient" : "doctor",
        username: user.username,
    };

    // Send JSON response with redirection info
    res.json({
        success: true,
        role: req.session.user.role,
        redirectUrl: patient ? "/patient-dashboard" : "/doctor-dashboard",
    });
});

// Routes to render EJS dashboards
app.get("/patient-dashboard", async (req, res) => {
    try {
        
        if (!req.session.user || req.session.user.role !== "patient") {
            return res.redirect("/");
        }

        const patientId = req.session.user.id;

        // Fetch patient data including appointments
        const patient = await db.collection("patients").findOne(
            { _id: new ObjectId(patientId) },
            { projection: { appointments: 1 } } // Only fetch appointments field
        );

        if (!patient || !patient.appointments) {
            return res.render("patient-dashboard", { user: req.session.user, appointments: [] });
        }

        // Fetch doctor details for each appointment
        const appointmentsWithDoctors = await Promise.all(
            patient.appointments.map(async (appointment) => {
                const doctor = await db.collection("doctors").findOne(
                    { _id: new ObjectId(appointment.doctorId) },
                    { projection: { username: 1, specialization: 1 } }
                );

                return {
                    ...appointment,
                    doctorName: doctor?.username || "Unknown Doctor",
                    specialization: doctor?.specialization || "Unknown",
                };
            })
        );

        res.render("patient-dashboard", { user: req.session.user, appointments: appointmentsWithDoctors });

    } catch (error) {
        console.error("Error fetching appointments:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/doctor-dashboard", async (req, res) => {
    try {
        
        if (!req.session.user || req.session.user.role !== "doctor") {
            return res.redirect("/");
        }

        const doctorId = req.session.user.id;

        // Fetch doctor data including appointments
        const doctor = await db.collection("doctors").findOne(
            { _id: new ObjectId(doctorId) },
            { projection: { appointments: 1 } } // Fetch only the appointments field
        );

        if (!doctor || !doctor.appointments) {
            return res.render("doctor-dashboard", { user: req.session.user, appointments: [] });
        }

        // Fetch patient details for each appointment
        const appointmentsWithPatients = await Promise.all(
            doctor.appointments.map(async (appointment) => {
                const patient = await db.collection("patients").findOne(
                    { _id: new ObjectId(appointment.patientId) },
                    { projection: { username: 1, dateOfBirth: 1, gender: 1 } }
                );

                return {
                    ...appointment,
                    patientName: patient?.username || "Unknown Patient",
                    dateOfBirth: patient?.dateOfBirth || "N/A",
                    gender: patient?.gender || "N/A",
                };
            })
        );

        res.render("doctor-dashboard", { user: req.session.user, appointments: appointmentsWithPatients });

    } catch (error) {
        console.error("Error fetching doctor appointments:", error);
        res.status(500).send("Internal Server Error");
    }
});




// patient register
app.post("/registerpatient", async (req, res) => {
    const { username, email, password, dateOfBirth, gender } = req.body;
  
    const existingUser = await db.collection("patients").findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });
  
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const result = await db.collection("patients").insertOne({
      username, email, password: hashedPassword, dateOfBirth, gender
    });
  
    if (result.insertedId) {
      res.json({ success: true, message: "Patient registered successfully" });
    } else {
      res.status(500).json({ error: "Registration failed" });
    }
  });


// **Doctor Registration**
app.post("/registerdoctor", async (req, res) => {
    const { username, email, password, specialization, licenseNumber, experience } = req.body;
  
    const existingUser = await db.collection("doctors").findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });
  
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const result = await db.collection("doctors").insertOne({
      username, email, password: hashedPassword, specialization, licenseNumber, experience
    });
  
    if (result.insertedId) {
      res.json({ success: true, message: "Doctor registered successfully" });
    } else {
      res.status(500).json({ error: "Registration failed" });
    }
  });

// **Passport Strategies for Patients**
passport.use(
  "patient-local",
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await db.collection("patients").findOne({ username });
      if (!user) return done(null, false, { message: "User does not exist!" });

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) return done(null, false, { message: "Incorrect password!" });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// **Passport Strategies for Doctors**
passport.use(
  "doctor-local",
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await db.collection("doctors").findOne({ username });
      if (!user) return done(null, false, { message: "User does not exist!" });

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) return done(null, false, { message: "Incorrect password!" });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// **Session Management**
passport.serializeUser((user, cb) => cb(null, user._id.toString()));
passport.deserializeUser(async (id, cb) => {
    try {
        const objectId = new ObjectId(id);
        const patient = await db.collection("patients").findOne({ _id: objectId });
        if (patient) return cb(null, patient);

        const doctor = await db.collection("doctors").findOne({ _id: objectId });
        if (doctor) return cb(null, doctor);

        return cb(null, false);
    } catch (err) {
        cb(err);
    }
});


// **Logout**
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

// to get recommanded doctors
app.get("/get-doctors", async (req, res) => {
    try {
        const { specialization } = req.query; // Get specialization from query
        let filter = {}; // Default fetch all doctors

        if (specialization) {
            filter.specialization = specialization.trim(); // Add filter if provided
        }

        const doctors = await db.collection("doctors").find(filter).toArray();
       
        res.json(doctors);

    } catch (error) {
        console.error("Error fetching doctors:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// to get patients appointments
app.post("/book-appointment", async (req, res) => {
    try {
        const { patientId,doctorId, date } = req.body; // Get data from frontend

        if (!patientId || !doctorId || !date) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newAppointment = {
            patientId: new ObjectId(patientId),
            doctorId: new ObjectId(doctorId),
            date,
            status: "pending", // Can be "confirmed" once approved
        };

        // Update the patient's appointments array
        const patientUpdate = await db.collection("patients").updateOne(
            { _id: new ObjectId(patientId) },
            { $push: { appointments: newAppointment } }
        );

        // Update the doctor's appointments array
        const doctorUpdate = await db.collection("doctors").updateOne(
            { _id: new ObjectId(doctorId) },
            { $push: { appointments: newAppointment } }
        );

        if (patientUpdate.modifiedCount === 0 || doctorUpdate.modifiedCount === 0) {
            return res.status(404).json({ error: "Patient or doctor not found" });
        }

        res.json({ success: true, message: "Appointment booked successfully!" });
    } catch (error) {
        console.error("Error booking appointment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/chat",(req,res)=>{
    res.render("chat.ejs");
})

app.get("/chat/:doctorId", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/"); // Redirect to login if not logged in
        }

        const doctorId = req.params.doctorId;
        const doctor = await db.collection("doctors").findOne(
            { _id: new ObjectId(doctorId) },
            { projection: { username: 1, specialization: 1 } }
        );

        if (!doctor) {
            return res.status(404).send("Doctor not found");
        }

        res.render("chat.ejs", { user: req.session.user, doctor });
    } catch (error) {
        console.error("Error loading chat page:", error);
        res.status(500).send("Internal Server Error");
    }
});








