const path = require("path");
const http = require("http");
const express = require("express");
require("dotenv").config();
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);
    socket.emit("message", formatMessage("DevChatBot", "Welcome!"));

    //fires when new user enters
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage("DevChatBot", `${user.username} has joined`)
      );
    //send room data
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // prints MSG from main js
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });
  //runs when user leaves
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage("DevChatBot", `${user.username} has left`)
      );
      //resends room data when someone leaves
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT;
server.listen(PORT, () => console.log(`server running on ${PORT}`));
