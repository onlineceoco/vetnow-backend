const mongoose = require("mongoose");
const app = require("./app.js");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./db/models/User.js");
const Message = require("./db/models/message");
const redis = require("redis");
// const RedisClient = redis.createClient();
const SocketIOFileUpload = require("socketio-file-upload");

process.on("uncaughtException", err => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

require("dotenv").config();

let DB;

if (process.env.NODE_ENV === "production") {
  DB = process.env.MONGODB_PROD;
} else {
  DB = "mongodb://localhost:27017/joje-backend";
}

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connection successful!"));

const server = app.listen(process.env.PORT, () => {
  console.log("Server Is Running On " + process.env.PORT);
});

//socket.io part of server

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use(async (socket, next) => {
  if (socket.handshake.auth && socket.handshake.auth.token) {
    const token = socket.handshake.auth.token;
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // 3) Check if user still exists
    const currentUser = await User.findOne({ phone: decoded.id });
    if (!currentUser) {
      return next(
        new AppError(
          "The user belonging to this token does no longer exist.",
          401,
        ),
      );
    }
    socket.user = currentUser;
    next();
  } else {
    next();
  }
});

//doctors Chat

io.on("connection", socket => {
  console.log("joiend");
  socket.on("joinroom", roomId => {
    socket.join(roomId);
  });
  socket.on("chatroomMessage", async ({ message, roomId }, callback) => {
    console.log(message);
    if (message) {
      // await Message.create({
      //   chatroom: roomId,
      //   user: socket.user._id,
      //   message,
      // });
      io.to(roomId).emit("newMessage", {
        message: {
          text: message.message,
          user: socket.user._id,
        },
        name: socket.user.name ? socket.user.name : socket.user.phone,
      });
    }
    callback();
  });

  socket.on("leaveroom", roomId => {
    socket.leave(roomId);
  });
  socket.on("disconnect", () => {
    console.log("disconnect");
  });
});

//support chat

// const supportNameSpace = io.of("/support");
// supportNameSpace.use(async (socket, next) => {
//   if (socket.handshake.auth && socket.handshake.auth.token) {
//     const token = socket.handshake.auth.token;
//     const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
//     // 3) Check if user still exists
//     const currentUser = await User.findOne({ phone: decoded.id });
//     if (!currentUser) {
//       return next(
//         new AppError(
//           "The user belonging to this token does no longer exist.",
//           401,
//         ),
//       );
//     }
//     socket.user = currentUser;
//     next();
//   } else {
//     next();
//   }
// });
// io.of("/support").on("connection", async socket => {
//   //file upload
//   const uploader = new SocketIOFileUpload();
//   uploader.dir = "./public/support";
//   uploader.listen(socket);

//   //support room
//   if (socket.user && socket.user.role === "oprator") {
//     //support chat
//     socket.join("supportRoom");
//     //finding supports that Connected
//     const sockets = await supportNameSpace.in("supportRoom").fetchSockets();
//     let connectedSupports = [];
//     for (const socket of sockets) {
//       connectedSupports.push(socket.user);
//     }
//     supportNameSpace.emit("current_supports", connectedSupports);

//     socket.on("support_msg", (msg, room, callback) => {
//       // new client message notif to supports
//       supportNameSpace.to(room).emit("new_msg", { msg, room });
//       callback();
//     });
//     //get client first msg
//     socket.on("loaded", room => {
//       // socket.join(room);
//       const stringRoom = JSON.stringify(room);

//       RedisClient.hgetall(stringRoom, function (err, value) {
//         if (value && value.msg)
//           supportNameSpace.to(room).emit("client_first_msg_server", value.msg);
//       });
//     });

//     //on disconnect
//     socket.on("disconnect", () => {
//       const index = connectedSupports.findIndex(
//         support => support._id === socket.user._id,
//       );
//       const remianSupports = connectedSupports.splice(0, index);
//       supportNameSpace
//         .to("supportRoom")
//         .emit("support_disconnect", remianSupports);
//     });
//   }

//   //client room
//   socket.on("client_join", room => {
//     console.log("client joined");
//     //client chat
//     socket.join(room);

//     // RedisClient.hgetall(JSON.stringify(room), function (err, value) {
//     //   if (value && value.msg) {
//     //     socket.emit("send_saved_messages", value.messages, room);
//     //   }
//     // });

//     socket.on("clinet_msg", (msg, room, callback) => {
//       // new client message notif to supports
//       supportNameSpace
//         .to("supportRoom")
//         .emit("new_msg_notif", { sent: true, room });
//       supportNameSpace.to(room).emit("new_msg", { msg, room });
//       callback();
//     });

//     socket.on("client_first_msg", (msg, room) => {
//       const stringRoom = JSON.stringify(room);
//       RedisClient.hset(stringRoom, "msg", JSON.stringify(msg));
//     });

//     //   let messages = [];
//     //   socket.on("client_support_saved_messages", msg => {
//     //     messages.push(msg);
//     //     const stringMessages = JSON.stringify(messages);
//     //     RedisClient.hset(JSON.stringify(room), "messages", stringMessages);
//     //   });
//   });

//   uploader.on("saved", function (event) {
//     // socket.on("file_co")
//     const room = event.file.meta.roomId;
//     supportNameSpace.to(room).emit("file_complete", {
//       message: "",
//       from: "client",
//       file: event.file.name,
//     });
//   });

//   socket.on("leave_room", room => {
//     socket.leave(room);
//   });

//   socket.on("disconnect", () => {});
// });

process.on("unhandledRejection", err => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
