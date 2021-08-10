const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server, { cors: { origin: "*" } });
// const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  // res.redirect(`/${uuidV4()}`);
  res.redirect("/test");
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  console.log("Client connnected, Socket ID:", socket.id);

  socket.on("patch", (arg1, arg2, { eventId, peerId }, arg4) => {
    console.log("Client joined room", eventId, peerId);

    socket.join(eventId);
    socket.broadcast.to(eventId).emit("voice-calls user_connected", { peerId });

    socket.on("disconnect", () => {
      socket.broadcast
        .to(eventId)
        .emit("voice-calls user_disconnected", { peerId });
    });
  });
});

server.listen(3000);
