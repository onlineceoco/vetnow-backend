const express = require("express");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controller/error.controller");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
// const hpp = require("hpp");
const SocketIOFileUpload = require("socketio-file-upload");

const app = express();
app.use(cors({ credentials: true, origin: true }));
app.use(SocketIOFileUpload.router);
app.use(express.static("public"));

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too Many Request,Try again in an hour!",
});
app.use("/api", limiter);
app.use(helmet());

app.use(express.json({ limit: "10kb" }));

//no-sql injection after body parser
app.use(mongoSanitize());
//prevent xss attack after body parser
app.use(xss());
//prevent parameter pollution
// app.use(hpp({ whitelist: ["category"] }));

app.use("/api/v1/users", require("./routes/users"));
app.use("/api/v1/products", require("./routes/product"));
app.use("/api/v1/comments", require("./routes/comment"));
app.use("/api/v1/cart", require("./routes/cart"));
app.use("/api/v1/chat", require("./routes/chatroom"));

//404 handler
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//global error handler
app.use(globalErrorHandler);

module.exports = app;
