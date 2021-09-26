const mongoose = require("mongoose");
const app = require("./app.js");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./db/models/User.js");
const Message = require("./db/models/message");
const redis = require("redis");
const RedisClient = redis.createClient();

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
    origin: "http://localhost:3000",
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
  socket.on("joinroom", roomId => {
    socket.join(roomId);
  });
  socket.on("chatroomMessage", async ({ message, roomId }, callback) => {
    if (message.trim().length > 0) {
      await Message.create({
        chatroom: roomId,
        user: socket.user._id,
        message,
      });
      io.to(roomId).emit("newMessage", {
        message: {
          text: message,
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

const supportNameSpace = io.of("/support");
supportNameSpace.use(async (socket, next) => {
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
io.of("/support").on("connection", async socket => {
  //support room
  if (socket.user && socket.user.role === "oprator") {
    //support chat
    socket.join("supportRoom");
    //finding supports that Connected
    const sockets = await supportNameSpace.in("supportRoom").fetchSockets();
    let connectedSupports = [];
    for (const socket of sockets) {
      connectedSupports.push(socket.user);
    }
    supportNameSpace.emit("current_supports", connectedSupports);

    socket.on("support_msg", (msg, room, callback) => {
      // new client message notif to supports
      supportNameSpace.to(room).emit("new_msg", { msg, room });
      callback();
    });
    socket.on("loaded", room => {
      console.log("loaded");
      // socket.join(room);
      const stringRoom = JSON.stringify(room);

      RedisClient.hgetall(stringRoom, function (err, value) {
        console.log(value.msg);
        if (value.msg)
          supportNameSpace.to(room).emit("client_first_msg_server", value.msg);
      });
    });

    //get client first msg
    // socket.emit("blad");
    //on disconnect
    socket.on("disconnect", () => {
      const index = connectedSupports.findIndex(
        support => support._id === socket.user._id,
      );
      const remianSupports = connectedSupports.splice(0, index);
      supportNameSpace
        .to("supportRoom")
        .emit("support_disconnect", remianSupports);
    });
  }

  //client room
  socket.on("client_join", room => {
    //client chat
    socket.join(room);
    socket.on("clinet_msg", (msg, room, callback) => {
      // new client message notif to supports
      supportNameSpace
        .to("supportRoom")
        .emit("new_msg_notif", { sent: true, room });
      supportNameSpace.to(room).emit("new_msg", { msg, room });
      callback();
    });
    JSON.stringify;

    socket.on("client_first_msg", (msg, room) => {
      const stringRoom = JSON.stringify(room);
      RedisClient.hset(stringRoom, "msg", JSON.stringify(msg));
    });
  });

  socket.on("disconnect", () => {});
});

process.on("unhandledRejection", err => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
