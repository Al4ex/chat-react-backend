import express from "express";
import http from "http";
import "dotenv/config";
import { Server } from "socket.io";
import clc from "cli-color";
import cors from "cors";
import { connectDB } from "./database";
import userRoutes from "./routes/user.routes";
import messageRoutes from "./routes/message.routes";
import contactRoutes from "./routes/contact.routes";
import { checkToken } from "./helpers/jwt";
import {
  getUsers,
  userConnect,
  userDisconnect,
} from "./controllers/socket.controller";
import { sendMessage, updateMessage } from "./controllers/message.controller";
import morgan from "morgan";
import { createUserAdmin } from "./script/myuser";

const app = express();


// Middlewares
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", userRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/contact", contactRoutes);

// HTTP server
const server = http.createServer(app);

// Socket.IO server
const io = new Server(server, { cors: { origin: "*" } });

// Socket.IO logic
io.on("connection", async (socket) => {
  try {
    // Validate JWT
    const [valid, id] = checkToken(socket.handshake.query["x-token"]);
    if (!valid) {
      console.log("Unidentified socket");
      return socket.disconnect();
    }

    // User connect
    await userConnect(id);

    // Join a specific room
    socket.join(id);

    // Listen for personal messages
    socket.on("message-personal", async (payload) => {
      const msg = await sendMessage(payload);
      io.to(payload.to).emit("message-personal", msg);
      io.to(payload.from).emit("message-personal", msg);
      io.emit("list-users", await getUsers(id));
    });

    // Listen for focus events
    socket.on("focus", async (focused) => {
      socket.emit("focused", focused);
    });

    // Listen for read messages
    socket.on("read-messages", async (data) => {
      const update = await updateMessage(data);
      console.log(update);
      io.emit("list-users", await getUsers(id));
    });

    // List connected users
    socket.on("list-users", async () => {
      io.emit("list-users", await getUsers(id));
    });

    // Emit all connected users
    io.emit("list-users", await getUsers(id));

    // Disconnect
    socket.on("disconnect", async () => {
      console.log("Client disconnected");
      await userDisconnect(id);
      io.emit("list-users", await getUsers(id));
    });
  } catch (err) {
    console.error(err);
    socket.disconnect();
  }
});

// Set port
app.set("port", process.env.PORT || 5000);

// Connect to database
connectDB();
createUserAdmin()

// Start server
server.listen(app.get("port"), () => {
  console.log(`Server running on port: ${clc.yellow.bold(process.env.URILOCAL + app.get("port"))}`);
});
