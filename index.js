require("dotenv").config();
const express = require("express");
const app = express();
const session = require("express-session");
const bodyParser = require("body-parser");
const router = require("./routes/router");
const sequelize = require("./config/database"); // Use external DB config
const port = process.env.PORT || 3000;
const path = require("path");
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Ensure the "public" directory exists
console.log("Serving static files from:", path.join(__dirname, "public"));


// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    session({
        secret: "mysecretkey",
        resave: false,
        saveUninitialized: true,
    })
);

// Set EJS as the View Engine
app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views")); // Ensure Express knows where to look for views

// Sync database (ensures tables are created)
sequelize
    .sync()
    .then(() => console.log("Database & tables synced"))
    .catch((err) => console.error("Error syncing database:", err));

// Use the router for handling routes
app.use("/", router);

// Start server
app.listen(port, () => console.log(`Server running on port ${port}`));
