const mongoose = require("mongoose");
const { isEmail } = require("validator");
const userSchema = mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, "شماره موبایل خود را وارد کنید"],
      validate: {
        validator: function (v) {
          return /09(1[0-9]|3[1-9]|2[1-9])-?[0-9]{3}-?[0-9]{4}/.test(v);
        },
        message: props => `لطفا یک شماره تلفن همراه معتبر وارد نمایید`,
      },
      minLength: [11, "شماره موبایل باید 11 رقم باشد"],
      maxLength: [11, "شماره موبایل باید 11 رقم باشد"],
      trim: true,
      unique: true,
    },
    password: {
      type: Number,
      required: [true, "رمز عبور خود را وارد نمایید"],
      min: [5, "رمز عبور نادرست است"],
      unique: true,
    },
    role: {
      type: String,
      enum: ["user", "doctor", "admin", "oprator"],
      default: "user",
    },
    name: {
      type: String,
    },
    lastName: {
      type: String,
    },
    codeMelli: {
      type: String,
      validate: {
        validator: function (code) {
          var L = code.length;

          if (L < 8 || parseInt(code, 10) == 0) return false;
          code = ("0000" + code).substr(L + 4 - 10);
          if (parseInt(code.substr(3, 6), 10) == 0) return false;
          var c = parseInt(code.substr(9, 1), 10);
          var s = 0;
          for (var i = 0; i < 9; i++)
            s += parseInt(code.substr(i, 1), 10) * (10 - i);
          s = s % 11;
          if ((s < 2 && c == s) || (s >= 2 && c == 11 - s)) {
            return false;
          } else {
            return true;
          }
        },
        message: props => `کد ملی نامعتبر است`,
      },
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
      lowercase: true,
      validate: [isEmail, "ایمیل نامعتبر است"],
    },
    job: {
      type: String,
    },
    graduate: {
      type: String,
      defalut: undefined,
      required: [true, "سال فارغ التحصیلی را وارد نمایید"],
      trim: true,
    },
    experience: {
      type: String,
      defalut: undefined,
      required: [true, " میزان تجربه  را وارد نمایید"],
      trim: true,
    },
    doctorDescreption: {
      type: String,
      defalut: undefined,
      required: [true, "توضیحات دریاره دکتر را وارد نمایید"],
      trim: true,
    },
    doctorId: {
      type: String,
      defalut: undefined,
      required: [true, "شماره نظام پزشکی دکتر را وارد نمایید"],
      trim: true,
    },
  },
  { timestamps: true },
);

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;

  return userObject;
};

module.exports = mongoose.model("User", userSchema);
