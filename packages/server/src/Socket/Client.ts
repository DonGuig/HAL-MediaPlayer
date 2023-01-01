import http from "http";
import util from "util";
import { Server, Socket } from "socket.io";
import logger from "../HALLogger.js";

const registerClientHandlers = (socket: Socket) => {
  let tickTimeout: NodeJS.Timeout;

  // socket.onAny((eventName: string, ...args: any[]) => {
  //   console.log(eventName);
  //   console.log(args);
  // });

  socket.on("disconnect", (reason) => {
    logger.info(`disconnect client socket ${socket.id} due to ${reason}`);
    clearTimeout(tickTimeout);
  });

  socket.on("datetime", () => {
    // logger.info("emitting datetime");
    socket.emit("datetime", new Date().toISOString());
  });

  const sendClockTick = () => {
    const now = new Date();
    const timeToNextTick =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    tickTimeout = setTimeout(() => {
      socket.emit("datetime", new Date().toISOString());
      sendClockTick();
    }, timeToNextTick);
  };
  sendClockTick();
};

export default registerClientHandlers;
