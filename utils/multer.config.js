const multer = require("multer");
const mkdirp = require("mkdirp");
const AppError = require("./appError");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let path;
    //making path for save images
    if (file.fieldname === "avatar") {
      path = `./public/img/users`;
    }
    //passing path to mkdir to create that folders
    mkdirp.sync(path);
    cb(null, path);
  },
  filename: function (req, file, cb) {
    if (file.fieldname === "avatar") {
      cb(null, file.originalname);
    }
  },
});

const upload = multer({
  storage,
  fileFilter: function (req, file, callback) {
    if (file.mimetype.startsWith("image")) {
      callback(null, true);
    } else {
      callback(
        new AppError("Not an image! Please upload only images.", 400),
        false,
      );
    }
  },
});

module.exports = upload;
