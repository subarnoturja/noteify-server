const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./models/user.model")
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

app.listen(port, () => {
    console.log(`This server is running on port: ${port}`);
})

module.exports = app;
