const express = require('express'); // Web framework for Node.js
const http = require('http');     // HTTP server module
const { Server } = require('socket.io'); // Socket.IO for real-time, bidirectional communication
const { v4: uuidv4 } = require('uuid'); // For generating unique meeting IDs

// Initialize Express app
const app = express();
// Create an HTTP server from the Express app
const server = http.createServer(app);

// Initialize Socket.IO server and enable CORS for all origins
// This is important for the frontend (React app) to connect from a different origin
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for development. In production, specify your frontend URL.
        methods: ["GET", "POST"] // Allowed HTTP methods
    }
});

// Serve static files from a 'public' directory (optional, for basic testing)
app.use(express.static('public'));

// Store active meetings and their participants
// Structure:
// {
//   'meetingId': {
//     participants: {
//       'socketId': {
//         userName: 'string',
//         videoEnabled: boolean,
//         audioEnabled: boolean,
//         // Add other participant-specific data if needed
//       }
//     }
//   }
// }
const activeMeetings = new Map();

// Socket.IO connection event handler
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // --- Meeting Management Events ---

    // Event: 'create-meeting' - A user wants to create a new meeting
    socket.on('create-meeting', ({ userName }) => {
		console.log(`Meeting creation request from ${userName} (${socket.id})`);
        // Generate a unique meeting ID in the format xxx-xxx-xxx
        const meetingId = `${uuidv4().substring(0, 3)}-${uuidv4().substring(0, 3)}-${uuidv4().substring(0, 3)}`;

        // Create a new meeting entry
        activeMeetings.set(meetingId, {
            participants: new Map() // Use a Map for participants for easier management
        });

        // Add the creator as the first participant
        activeMeetings.get(meetingId).participants.set(socket.id, {
            userName,
            videoEnabled: true, // Default to video on
            audioEnabled: true  // Default to audio on
        });

        // Make the socket join the meeting room
        socket.join(meetingId);
        console.log(`Meeting created: ${meetingId} by ${userName} (${socket.id})`);

        // Emit 'meeting-created' event back to the creator with the new meeting ID
        socket.emit('meeting-created', { meetingId, userId: socket.id, userName });
    });

    // Event: 'join-meeting' - A user wants to join an existing meeting
    socket.on('join-meeting', ({ meetingId, userName }) => {
        const meeting = activeMeetings.get(meetingId);

        if (!meeting) {
            // If meeting does not exist, inform the user
            socket.emit('meeting-not-found', { meetingId });
            console.log(`Attempt to join non-existent meeting: ${meetingId} by ${userName} (${socket.id})`);
            return;
        }

        // Add the new participant to the meeting
        meeting.participants.set(socket.id, {
            userName,
            videoEnabled: true, // Default to video on
            audioEnabled: true  // Default to audio on
        });

        // Make the socket join the meeting room
        socket.join(meetingId);
        console.log(`User ${userName} (${socket.id}) joined meeting: ${meetingId}`);

        // Prepare a list of existing participants to send to the new user
        const existingParticipants = Array.from(meeting.participants.entries())
            .filter(([id, _]) => id !== socket.id) // Exclude the new user themselves
            .map(([id, data]) => ({
                userId: id,
                userName: data.userName,
                videoEnabled: data.videoEnabled,
                audioEnabled: data.audioEnabled
            }));

        // Emit 'meeting-joined' to the new user with meeting details and existing participants
        socket.emit('meeting-joined', {
            meetingId,
            userId: socket.id,
            userName,
            existingParticipants
        });

        // Broadcast 'user-joined' to all other participants in the room
        socket.to(meetingId).emit('user-joined', {
            userId: socket.id,
            userName,
            videoEnabled: true,
            audioEnabled: true
        });
    });

    // --- WebRTC Signaling Events ---

    // Event: 'offer' - Relays a WebRTC SDP offer from one peer to another
    socket.on('offer', ({ offer, targetUserId, meetingId }) => {
        // Emit the offer to the specific target user within the same meeting room
        socket.to(targetUserId).emit('offer', {
            offer,
            senderId: socket.id, // The ID of the user sending the offer
            meetingId
        });
        console.log(`Offer from ${socket.id} to ${targetUserId} in meeting ${meetingId}`);
    });

    // Event: 'answer' - Relays a WebRTC SDP answer from one peer to another
    socket.on('answer', ({ answer, targetUserId, meetingId }) => {
        // Emit the answer to the specific target user within the same meeting room
        socket.to(targetUserId).emit('answer', {
            answer,
            senderId: socket.id, // The ID of the user sending the answer
            meetingId
        });
        console.log(`Answer from ${socket.id} to ${targetUserId} in meeting ${meetingId}`);
    });

    // Event: 'ice-candidate' - Relays an ICE candidate from one peer to another
    socket.on('ice-candidate', ({ candidate, targetUserId, meetingId }) => {
        // Emit the ICE candidate to the specific target user within the same meeting room
        socket.to(targetUserId).emit('ice-candidate', {
            candidate,
            senderId: socket.id, // The ID of the user sending the candidate
            meetingId
        });
        console.log(`ICE candidate from ${socket.id} to ${targetUserId} in meeting ${meetingId}`);
    });

    // --- Media Control Events ---

    // Event: 'toggle-video' - A user toggles their video stream
    socket.on('toggle-video', ({ meetingId, videoEnabled }) => {
        const meeting = activeMeetings.get(meetingId);
        if (meeting && meeting.participants.has(socket.id)) {
            meeting.participants.get(socket.id).videoEnabled = videoEnabled;
            // Broadcast the video state change to all other participants in the room
            socket.to(meetingId).emit('participant-toggled-media', {
                userId: socket.id,
                mediaType: 'video',
                state: videoEnabled
            });
            console.log(`User ${socket.id} video toggled to ${videoEnabled} in meeting ${meetingId}`);
        }
    });

    // Event: 'toggle-audio' - A user toggles their audio stream
    socket.on('toggle-audio', ({ meetingId, audioEnabled }) => {
        const meeting = activeMeetings.get(meetingId);
        if (meeting && meeting.participants.has(socket.id)) {
            meeting.participants.get(socket.id).audioEnabled = audioEnabled;
            // Broadcast the audio state change to all other participants in the room
            socket.to(meetingId).emit('participant-toggled-media', {
                userId: socket.id,
                mediaType: 'audio',
                state: audioEnabled
            });
            console.log(`User ${socket.id} audio toggled to ${audioEnabled} in meeting ${meetingId}`);
        }
    });

    // --- Chat Events ---

    // Event: 'chat-message' - A user sends a chat message
    socket.on('chat-message', ({ meetingId, userName, message }) => {
        // Broadcast the message to all participants in the meeting room
        io.to(meetingId).emit('chat-message', {
            senderId: socket.id,
            userName,
            message,
            timestamp: Date.now() // Add a timestamp for display
        });
        console.log(`Chat message in ${meetingId} from ${userName}: ${message}`);
    });

    // --- Disconnection Event ---

    // Event: 'disconnect' - A user disconnects from the server
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);

        // Find which meeting the disconnected user was in
        let disconnectedMeetingId = null;
        for (const [meetingId, meeting] of activeMeetings.entries()) {
            if (meeting.participants.has(socket.id)) {
                disconnectedMeetingId = meetingId;
                // Remove the participant from the meeting
                meeting.participants.delete(socket.id);
                console.log(`User ${socket.id} removed from meeting ${meetingId}`);

                // If the meeting becomes empty, remove the meeting itself
                if (meeting.participants.size === 0) {
                    activeMeetings.delete(meetingId);
                    console.log(`Meeting ${meetingId} is now empty and removed.`);
                } else {
                    // Notify other participants that a user has left
                    socket.to(meetingId).emit('user-left', { userId: socket.id });
                    console.log(`Notified users in ${meetingId} that ${socket.id} left.`);
                }
                break; // User can only be in one meeting
            }
        }
    });
});

// Start the server on port 3001
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Signaling server listening on port ${PORT}`);
});

