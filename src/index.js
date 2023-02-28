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

const app = express();

// Middlewares
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(morgan())
//http server
const server = http.createServer(app);
// creacion de socket.io
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", async (socket) => {
  //TODO: validar jwt
  // si el token no es valido desconectar
  const [valid, id] = checkToken(socket.handshake.query["x-token"]);
  if (!valid) {
    console.log("socket no identificado");
    return socket.disconnect();
  }
  await userConnect(id);

  // uNIRME A UNA SALA ESPECIFICA
  socket.join(id);
  //ESCUCHAR CIUANDO EL CLIENTE ESCRIBE UN MENSAJE
  socket.on("message-personal", async (payload) => {

    const msg = await sendMessage(payload);
    // console.log(payload);
    io.to(payload.to).emit("message-personal", msg);
    io.to(payload.from).emit("message-personal", msg);
    io.emit("list-users", await getUsers(id));
  });

  socket.on('focus', async (focused) => {
    socket.emit("focused", focused);
  })

  socket.on("read-messages", async (data) => {
    const update = await updateMessage(data);
    console.log(update);
    io.emit("list-users", await getUsers(id));
  });

  // emitir usuarios conectados
  io.emit("list-users", await getUsers(id));

  // TODO: SABER QUE USARIO ESTA ACTIVO
  //EMITOIR TODOS LOS USUARIOS CONECTADOS

  //Disconnect
  // marcar en bd que se desconecto
  socket.on("disconnect", async () => {
    console.log("cliente desconectado");
    await userDisconnect(id);
    io.emit("list-users", await getUsers(id));
  });
});

app.set("port", process.env.PORT || 5000);
connectDB();
// app.use(upload.none())

app.use("/api", userRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/contact", contactRoutes);

server.listen(app.get("port"));
console.log(`port: `, clc.yellow.bold(process.env.URILOCAL + app.get("port")));
