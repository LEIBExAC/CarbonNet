const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

module.exports = mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));
