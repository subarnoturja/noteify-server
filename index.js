const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./models/user.model")
const Note = require("./models/note.model")
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;
const { authenticateToken } = require("./utilities")

// MongoDB Connection
const connectionString = process.env.MONGO_CONNECTION_STRING;

mongoose.connect(connectionString)
.then(() => {
    console.log("Connected to MongoDB successfully!");
})
.catch((error) => {
    console.log("Error connecting to MongoDB:", error.message);
})

// Middleware
app.use(express.json())
app.use(cors({
    origin: "*",
}))

app.get('/', (req, res) => {
    res.send("Noteify server is running")
})

// Create Account
app.post('/create-account', async (req, res) => {
    const { fullName, email, password } = req.body;

    if(!fullName) {
        return res
        .status(400)
        .json({ error: true, message: "Full Name is required" });
    }

    if(!email) {
        return res.status(400).json({ error: true, message: "Email is required" });
    }

    if(!password) {
        return res 
        .status(400)
        .json({ error: true, message: "Password is required"});
    }

    const isUser = await User.findOne({ email: email });

    if(isUser) {
        return res.json({
            error: true,
            message: "User already exist",
        })
    }

    const user = new User ({
        fullName,
        email,
        password,
    })

    await user.save();

    const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "36000m",
    })

    return res.json({
        error: false,
        user,
        accessToken,
        message: "Registration Successful!",
    })
})

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if(!email) {
        return res 
        .status(400)
        .json({ message: "Email is required" });
    }

    if(!password) {
        return res 
        .status(400)
        .json({ message: "Password is required" })
    }

    const userInfo = await User.findOne({ email: email });

    if(!userInfo) {
        return res 
        .status(400)
        .json({ message: "User not found" });
    }

    if(userInfo.email == email && userInfo.password == password) {
        const user = { user: userInfo };
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "36000m",
        })

        return res.json({
            error: false,
            message: "Login Successful",
            email,
            accessToken,
        })
    }
    else {
        return res 
        .status(400)
        .json({
            error: true,
            message: "Invalid Credentials",
        })
    }
})

// Add Note
app.post("/add-note", authenticateToken, async (req, res) => {
    const { title, content, tags } = req.body;
    const { user } = req.user;

    if(!title) {
        return res 
        .status(400)
        .json({ error: true, message: "Title is required" });
    }

    if(!content) {
        return res 
        .status(400)
        .json({ error: true, message: "Content is required" });
    }

    try {
        const note = new Note({
            title,
            content,
            tags: tags || {},
            userId: user._id,
        })
        await note.save();
        
        return res.json({
            error: false,
            note,
            message: "Note added Successfully",
        })
    }
    catch (error) {
        return res
        .status(400)
        .json({
            error: true,
            message: "Internal Server error",
        })
    }
})

// Edit Note
app.put("/edit-note/:noteId", authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { title, content, tags, isPinned } = req.body;
    const { user } = req.user;

    if(!title && !content && !tags){
        return res 
        .status(400)
        .json({ error: true, message: "No changes provided" });
    }

    try {
        const note = await Note.findOne({ _id: noteId, userId: user._id });

        if(!note) {
            return res 
            .status(404)
            .json({ error: true, message: "Note not found" });
        }

        if(title) note.title = title;
        if(content) note.content = content;
        if(tags) note.tags = tags;
        if(isPinned) note.isPinned = isPinned;

        await note.save();

        return res.json({
            error: false,
            note,
            message: "Note updated successfully",
        })
    }
    catch(error){
        return res 
        .status(500)
        .json({
            error: true,
            message: "Internal Server error",
        })
    }
})

// All Note
app.get("/get-all-notes", authenticateToken, async (req, res) => {
    const { user } = req.user;

    try{
        const notes = await Note.find({ userId: user._id }).sort({ isPinned: -1})

        return res 
        .json({ 
            error: false, 
            notes, 
            message: "All Notes retrieved successfully!",
        })
    }
    catch(error) {
        return res 
        .status(500)
        .json({
            error: true,
            message: "Internal Server Error",
        })
    }
})

app.listen(port, () => {
    console.log(`This server is running on port: ${port}`);
})

module.exports = app;
