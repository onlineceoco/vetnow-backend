const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  // chatroom: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   required: [true, "نام چت روم نمیتواند خالی بماند"],
  //   ref: "Chatroom",
  // },
  user: {
    type: Object,
    required: true,
  },
  message: [
    {
      text: {
        type: String,
        required: true,
      },

      user: {
        type: Object,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("Message", chatMessageSchema);
