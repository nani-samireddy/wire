// src/socket.ts
import { io, Socket } from "socket.io-client";
import { Room } from "./types";

interface ClientToServerEvents {
  "join-room": (data: { roomId: string; userName: string }) => void;
}

interface ServerToClientEvents {
  "room-update": (room: Room) => void;
}

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  "http://localhost:3001",
  {
    autoConnect: false,
  }
);

export default socket;
