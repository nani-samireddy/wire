import { Server } from "socket.io";
import { NextRequest } from "next/server";

export const config = {
  api: {
    bodyParser: false,
  },
};

let io: Server | null = null;

export async function GET(req: NextRequest) {
  if (!(global as any).io) {
    const server = (req as any).socket?.server;

    io = new Server(server, {
      path: "/api/socket",
    });

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("join-room", ({ roomId, userId }) => {
        socket.join(roomId);
        socket.to(roomId).emit("user-joined", userId);
      });

      socket.on("signal", ({ roomId, data }) => {
        socket.to(roomId).emit("signal", data);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    (global as any).io = io;
  }

  return new Response("Socket server running", { status: 200 });
}
