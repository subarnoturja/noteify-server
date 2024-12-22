const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
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

app.listen(port, () => {
    console.log(`This server is running on port: ${port}`);
})

module.exports = app;
