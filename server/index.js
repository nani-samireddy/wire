const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const {
	addParticipant,
	removeParticipant,
	getRoom,
	rooms,
} = require("./rooms");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "http://localhost:5173", // React Vite client
		methods: ["GET", "POST"],
	},
});

io.on("connection", (socket) => {
	console.log("User connected:", socket.id);

	socket.on("join-room", ({ roomId, userName }) => {
		console.log(`${userName} joined room ${roomId}`);

		socket.join(roomId);
		addParticipant(roomId, socket.id, userName);

		const room = getRoom(roomId);
		io.to(roomId).emit("room-update", room);
	});

	socket.on("disconnect", () => {
		console.log("User disconnected:", socket.id);
		removeParticipant(socket.id);

		// Broadcast updated room info to remaining clients
		for (const [roomId, room] of rooms.entries()) {
			if (room.participants.some((p) => p.id === socket.id)) {
				io.to(roomId).emit("room-update", room);
			}
		}
	});
});

server.listen(3001, () => {
	console.log("Server listening on port 3001");
});
