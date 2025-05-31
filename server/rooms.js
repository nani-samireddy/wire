// rooms.js
const rooms = new Map(); // roomId -> { name, participants: [{ id, name }] }

function createRoom(roomId, roomName) {
	rooms.set(roomId, { name: roomName, participants: [] });
}

function addParticipant(roomId, socketId, name) {
	if (!rooms.has(roomId)) {
		createRoom(roomId, "Untitled Room");
	}
	const room = rooms.get(roomId);
	room.participants.push({ id: socketId, name });
}

function removeParticipant(socketId) {
	for (const [roomId, room] of rooms.entries()) {
		room.participants = room.participants.filter((p) => p.id !== socketId);
		if (room.participants.length === 0) {
			rooms.delete(roomId); // auto-delete empty room
		}
	}
}

function getRoom(roomId) {
	return rooms.get(roomId);
}

module.exports = {
	createRoom,
	addParticipant,
	removeParticipant,
	getRoom,
	rooms,
};
