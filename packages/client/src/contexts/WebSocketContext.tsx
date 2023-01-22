import { FC, createContext, useState } from "react";
import io, { Socket } from "socket.io-client";
import { SERVER_URL } from "src/ServerURL";

type WebSocketContext = {
  socket: Socket;
  sendMessage: (address: string, ...args: any[]) => void;
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const WebSocketContext = createContext<WebSocketContext>(
  {} as WebSocketContext
);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState<Socket>();

  const sendMessage = (address: string, ...args: any[]) => {
    if (socket) {
      socket.emit(address, ...args);
    }
  };

  if (!socket) {
    const s = io(`http://${SERVER_URL}`);

    s.on("connect", () => {
      setSocket(s);
    });

    s.on("disconnect", () => {
      setSocket(null);
      s.close();
    });
  }

  return (
    <WebSocketContext.Provider value={{ socket, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};
