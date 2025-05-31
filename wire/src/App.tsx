// src/App.tsx
import { useEffect, useState } from "react";
import socket from "./socket";
import type { Room as RoomType } from "./types";

function App() {
	const [userName, setUserName] = useState<string>("");
	const [roomId, setRoomId] = useState<string>("");
	const [roomData, setRoomData] = useState<RoomType | null>(null);
	const [joined, setJoined] = useState<boolean>(false);

	useEffect(() => {
		socket.on("room-update", (room: RoomType) => {
			setRoomData(room);
		});

		return () => {
			socket.off("room-update");
		};
	}, []);

	const handleJoin = () => {
		if (!userName.trim()) {
			alert("Enter your name");
			return;
		}

		const finalRoomId = roomId.trim() || generateRoomId();
		socket.connect();
		socket.emit("join-room", { roomId: finalRoomId, userName });
		setRoomId(finalRoomId);
		setJoined(true);
	};

	return (
		<div>
			{!joined ? (
				<div>
					<h1>WIRE</h1>
					<input
						type="text"
						placeholder="Your name"
						value={userName}
						onChange={(e) => setUserName(e.target.value)}
					/>
					<input
						type="text"
						placeholder="Room ID (optional)"
						value={roomId}
						onChange={(e) => setRoomId(e.target.value)}
					/>
					<button onClick={handleJoin}>Join / Create Room</button>
				</div>
			) : (
				<Room roomId={roomId} roomData={roomData} />
			)}
		</div>
	);
}

function Room({ roomId, roomData }: { roomId: string; roomData: RoomType | null }) {
	return (
		<div>
			<h2>Room: {roomId}</h2>
			<h3>Participants:</h3>
			<ul>
				{roomData?.participants.map((p) => (
					<li key={p.id}>{p.name}</li>
				))}
			</ul>
		</div>
	);
}

export default App;

function generateRoomId(): string {
	return Array(3)
		.fill("")
		.map(() => Math.random().toString(36).substring(2, 5))
		.join("-");
}
