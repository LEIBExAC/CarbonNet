const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = process.env.UPLOAD_PATH || "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(uploadDir, req.user.id.toString());
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /csv|xlsx|xls|pdf/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only CSV, Excel, and PDF files are allowed"));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
  },
  fileFilter: fileFilter,
});

exports.uploadSingle = upload.single("file");
exports.uploadMultiple = upload.array("files", 10);

exports.cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
  }
};

exports.cleanupOldFiles = () => {
  const maxAge = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  function cleanDirectory(directory) {
    if (!fs.existsSync(directory)) return;

    const files = fs.readdirSync(directory);

    files.forEach((file) => {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        cleanDirectory(filePath);
      } else {
        if (now - stat.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old file: ${filePath}`);
        }
      }
    });
  }

  cleanDirectory(uploadDir);
};
