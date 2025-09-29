const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// db
const { connectMongoDB } = require("./config/dbconfig");
const { connectMySQL } = require("./config/mysqlconfig");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const institutionRoutes = require("./routes/institution");
const activityRoutes = require("./routes/activity");
const emissionRoutes = require("./routes/emission");

const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

connectMongoDB();
connectMySQL();

app.use(helmet());
app.use(compression());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/", limiter);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/institutions", institutionRoutes);
app.use("/activities", activityRoutes);
app.use("/emissions", emissionRoutes);

// Root route, Same use as /health but more general, also added for security.
app.use("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is working",
    timestamp: new Date().toISOString(),
  });
});

app.use(notFound);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `------------>
Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`
  );
});

module.exports = app;
