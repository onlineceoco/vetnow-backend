const express = require("express");
const router = express.Router();
const protect = require("../middleware/protect");
const {
  signupLoginHandler,
  loginConfirmHandler,
  isUserLoggedIn,
} = require("../controller/signup-login.controller");
const {
  getAllDoctorsHandler,
  getAllUsersHandler,
} = require("../controller/user.controller");
//auth routes
router.get("/", protect, isUserLoggedIn);
router.post("/signup-login", signupLoginHandler);
router.post("/login-confirm/:phone", loginConfirmHandler);
// getting users route
router.get("/doctors", protect, getAllDoctorsHandler);
router.get("/get-users", protect, getAllUsersHandler);

module.exports = router;
