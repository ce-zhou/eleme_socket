var express = require("express");
var app = express();
var http = require("http").Server(app);
const joi = require("joi");

// 导入 cors 中间件
const cors = require("cors");
// 将 cors 注册为全局中间件
app.use(cors());

// 解析表单中间件 要放在路由前
app.use(express.urlencoded({ extended: false }));

app.use(function (req, res, next) {
  // status = 0 为成功； status = 1 为失败； 默认将 status 的值设置为 1，方便处理失败的情况
  res.cc = function (err, status = 1) {
    res.send({
      status,
      message: err instanceof Error ? err.message : err,
    });
  };
  next();
});

// 解析 token 的中间件
const { expressjwt: jwt } = require("express-jwt");
const config = require("./config");

app.use(
  jwt({ secret: config.jwtSecretKey, algorithms: ["HS256"] }).unless({
    path: [/^\/api\//],
  })
);

const userRouter = require("./router/user");
const refreshRouter = require("./router/refresh");
// 导入并使用用户信息路由模块
const userinfoRouter = require("./router/userinfo");
app.use("/api", userRouter);
app.use("/api", refreshRouter);
app.use("/my", userinfoRouter);

app.use(function (err, req, res, next) {
  if (err instanceof joi.ValidationError) return res.cc(err);
  if (err.name === "UnauthorizedError") return res.cc("身份验证失败", 403);
  // 未知错误
  res.cc(err);
});

var io = require("socket.io")(http, {
  allowEIO3: true,
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", function (socket) {
  console.log("a user connected");
  let userList = [];
  let msgList = [];
  socket.on("login", (data, callback) => {
    let isLogin = true;
    io.sockets.sockets.forEach((item) => {
      if (item.name == data.name) {
        isLogin = false;
      }
    });
    if (isLogin) {
      console.log("用户登录成功：", data);
      userList.push(data);
      socket.name = data.name;
      callback(true);
      io.emit("login", userList);
    } else {
      console.log("用户登录失败！：", data);
      callback(false);
    }
  });
  // 用户掉线
  socket.on("disconnect", () => {
    let index = userList.findIndex((i) => i.name == socket.name);
    if (index) {
      userList.splice(index, 1);
      io.emit("login", userList);
    }
  });
  socket.on("groupChat", (data) => {
    // 发送给所有客户端，除了发送者
    data.type = "user";
    msgList.push(data);
    socket.broadcast.emit("updateChatMessageList", msgList);
  });
  socket.on("privateChat", (data) => {
    /* 找到对应的私聊对象 */
    // console.log(io.sockets.sockets);
    console.log(data);
    io.sockets.sockets.forEach((iss) => {
      if (iss.name == data.receiver) {
        console.log("ok");
        data.type = "user";
        io.to(iss.id).emit("messageList", data);
      }
    });
  });
});

http.listen(3000, function () {
  console.log("listening on *:3000");
});
