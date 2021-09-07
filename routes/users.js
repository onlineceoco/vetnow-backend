const express = require("express");
const router = express.Router();
const protect = require("../middleware/protect");
const {
  signupLoginHandler,
  loginConfirmHandler,
  isUserLoggedIn,
  logoutHandler,
} = require("../controller/signup-login.controller");
const {
  getAllDoctorsHandler,
  getAllUsersHandler,
  addUserInfoHandler,
} = require("../controller/user.controller");
//auth routes
router.get("/", protect, isUserLoggedIn);
router.post("/signup-login", signupLoginHandler);
router.post("/login-confirm/:phone", loginConfirmHandler);
router.get("/logout", protect, logoutHandler);
// getting users route
router.get("/doctors", protect, getAllDoctorsHandler);
router.get("/get-users", protect, getAllUsersHandler);

//add user info
router.patch("/", protect, addUserInfoHandler);

module.exports = router;
