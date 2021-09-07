const User = require("../db/models/User");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");

exports.getAllDoctorsHandler = catchAsync(async (req, res) => {
  const doctors = await User.find({}).where("role").equals("doctor");
  if (!doctors) {
    return res
      .status(204)
      .json({ result: "fail", message: "دکتری وجود ندارد" });
  }

  res.status(200).json({
    result: "success",
    results: doctors.length,
    data: doctors,
  });
});

exports.getAllUsersHandler = factory.getAll(User);

exports.addUserInfoHandler = catchAsync(async (req, res) => {
  const update = await User.findOneAndUpdate({ _id: req.user._id }, req.body, {
    new: true,
    runValidators: true,
    context: "query",
  });
  res.status(200).json({
    result: "success",
    data: update,
  });
});
