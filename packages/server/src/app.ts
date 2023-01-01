import express, { json, Request } from "express";
import cors from "cors";
import http from "http";
import path from "path";
import { Server, Socket } from "socket.io";
import fileUpload from "express-fileupload";


import registerClientHandlers from "./Socket/Client.js";
import { serverPort } from "@halmediaplayer/shared";

import { URL } from "url"; // in Browser, the URL in native accessible on window
import logger, { expressLogger } from "./HALLogger.js";
import apiRouter from "./routes/apiRouter.js";


// Will contain trailing slash
export const _dirname = new URL(".", import.meta.url).pathname;



const app = express();
app.use(expressLogger);
app.use(cors());
// app.use(express.json({limit:"10mb"}));
app.use(fileUpload({
  useTempFiles : true,
  tempFileDir : path.join(path.dirname(_dirname), "resources/tmp")
}));
app.use(
  express.urlencoded({
    extended: true,
  })
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const staticClientPath = path.resolve(_dirname, "../../client/build");
app.use(express.static(staticClientPath));

app.use("/api", apiRouter);


// Handles any requests that don't match the ones above
app.get('*', (req,res) =>{
  res.sendFile(path.resolve(_dirname, "../../client/build/index.html"));
});

export const clientSocket = io.of("/client");

clientSocket.on("connection", (socket: Socket) => {
  logger.info(`client socket connection ${socket.id}`);
  registerClientHandlers(socket);
});

server.listen(serverPort, () => {
  logger.info(`listening on *:${serverPort}`);
});
