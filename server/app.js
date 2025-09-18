const express = require("express");
const mongoose = require("./config/dbconfig");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(
  cors({
    origin: process.env.BACKEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send(`
    <pre style="font-family: 'Courier New', monospace; color: #4CAF50; font-size: 25px;">
    Welcome to the CarbonNet Server!
    Server is running perfectly.
    </pre>
  `);
});

app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(require("./routes/auth"));

app.listen(port, (req, res) => {
  console.log("Server is Listening on port " + port + "......");
});
