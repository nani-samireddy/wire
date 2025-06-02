import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { NavigateFunction } from 'react-router-dom';

const SOCKET_SERVER_URL = 'http://localhost:3001';

// --- Type Definitions ---
export interface ParticipantData {
  userName: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
}

export interface ChatMessage {
  senderId: string;
  userName: string;
  message: string;
  timestamp: number;
}

interface MeetingState {
  socket: Socket | null;
  userName: string;
  meetingId: string;
  localStream: MediaStream | null;
  localVideoEnabled: boolean;
  localAudioEnabled: boolean;
  
  peers: Map<string, RTCPeerConnection>;
  remoteStreams: Map<string, MediaStream>;
  participants: Map<string, ParticipantData>;

  chatMessages: ChatMessage[];
  isSocketReady: boolean;
  isMeetingReadyForNavigation: boolean; // NEW: Flag to signal meeting data is ready for navigation
}

interface MeetingActions {
  initSocket: (navigate: NavigateFunction) => void;
  setUserName: (name: string) => void;
  setMeetingId: (id: string) => void;
  
  setLocalStream: (stream: MediaStream | null) => void;
  toggleLocalVideo: () => void;
  toggleLocalAudio: () => void;

  addPeer: (userId: string, peerConnection: RTCPeerConnection) => void;
  removePeer: (userId: string) => void;
  addRemoteStream: (userId: string, stream: MediaStream) => void;
  removeRemoteStream: (userId: string) => void;
  addParticipant: (userId: string, data: ParticipantData) => void;
  updateParticipantMedia: (userId: string, mediaType: 'video' | 'audio', state: boolean) => void;
  removeParticipant: (userId: string) => void;

  addChatMessage: (message: ChatMessage) => void;
  sendChatMessage: (message: string) => void;

  clearMeetingState: () => void;
  setMeetingReadyForNavigation: (ready: boolean) => void; // NEW: Action to set the flag

  createPeerConnection: (peerId: string) => RTCPeerConnection | null;
}

type MeetingStore = MeetingState & MeetingActions;

const PEER_CONNECTION_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useMeetingStore = create<MeetingStore>((set, get) => ({
  // --- Initial State ---
  socket: null,
  userName: '',
  meetingId: '',
  localStream: null,
  localVideoEnabled: true,
  localAudioEnabled: true,
  peers: new Map(),
  remoteStreams: new Map(),
  participants: new Map(),
  chatMessages: [],
  isSocketReady: false,
  isMeetingReadyForNavigation: false, // NEW: Initial state is false

  // --- Actions ---

  initSocket: (navigate: NavigateFunction) => {
    if (get().socket) {
      return;
    }

    const socket: Socket = io(SOCKET_SERVER_URL);

    socket.on('connect', () => {
      console.log('Store: Connected to signaling server:', socket.id);
      set({ socket, isSocketReady: true });
    });

    socket.on('disconnect', () => {
      console.log('Store: Disconnected from signaling server');
      set({ socket: null, isSocketReady: false, isMeetingReadyForNavigation: false }); // Reset flag on disconnect
      get().clearMeetingState();
      navigate('/');
    });

    socket.on('meeting-not-found', ({ meetingId }: { meetingId: string }) => {
      console.error(`Store: Meeting ${meetingId} not found.`);
      alert(`Meeting ID "${meetingId}" does not exist. Please check the ID or create a new meeting.`);
      get().setMeetingReadyForNavigation(false); // Reset flag on error
      navigate('/');
    });

    // Event: 'meeting-created'
    socket.on('meeting-created', ({ meetingId: createdId, userId, userName: createdUserName }: { meetingId: string, userId: string, userName: string }) => {
        console.log('Store: Meeting created confirmation:', createdId, userId, createdUserName);
        set((state) => {
            const updatedParticipants = new Map(state.participants);
            updatedParticipants.set(userId, {
                userName: createdUserName,
                videoEnabled: state.localVideoEnabled,
                audioEnabled: state.localAudioEnabled
            });
            // NEW: Set isMeetingReadyForNavigation to true after all essential data is set
            return {
                meetingId: createdId,
                userName: createdUserName,
                participants: updatedParticipants,
                isMeetingReadyForNavigation: true // Set this flag here!
            };
        });
    });


    // Event: 'meeting-joined'
    socket.on('meeting-joined', async ({ meetingId: joinedId, userId, userName: joinedUserName, existingParticipants }: { meetingId: string, userId: string, userName: string, existingParticipants: ParticipantData[] }) => {
      console.log('Store: Meeting joined confirmation:', joinedId, userId, joinedUserName);
      set((state) => {
          const updatedParticipants = new Map(state.participants);
          updatedParticipants.set(userId, {
              userName: joinedUserName,
              videoEnabled: state.localVideoEnabled,
              audioEnabled: state.localAudioEnabled
          });
          // NEW: Set isMeetingReadyForNavigation to true after all essential data is set
          return {
              meetingId: joinedId,
              userName: joinedUserName,
              participants: updatedParticipants,
              isMeetingReadyForNavigation: true // Set this flag here!
          };
      });

      existingParticipants.forEach(async (participant) => {
        console.log(`Store: Setting up peer connection with existing participant: ${participant.userId}`);
        const peerConnection = get().createPeerConnection(participant.userId);
        if (peerConnection) {
          get().addPeer(participant.userId, peerConnection);

          get().addParticipant(participant.userId, {
            userName: participant.userName,
            videoEnabled: participant.videoEnabled,
            audioEnabled: participant.audioEnabled
          });

          try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            get().socket?.emit('offer', {
              offer: peerConnection.localDescription,
              targetUserId: participant.userId,
              meetingId: get().meetingId,
            });
            console.log(`Store: Sent offer to existing participant: ${participant.userId}`);
          } catch (error) {
            console.error(`Store: Error creating or sending offer to ${participant.userId}:`, error);
          }
        }
      });
    });

    // Event: 'user-joined'
    socket.on('user-joined', async ({ userId, userName: joinedUserName, videoEnabled, audioEnabled }: ParticipantData & { userId: string }) => {
      console.log(`Store: New user joined: ${joinedUserName} (${userId})`);
      get().addParticipant(userId, { userName: joinedUserName, videoEnabled, audioEnabled });

      const peerConnection = get().createPeerConnection(userId);
      if (peerConnection) {
        get().addPeer(userId, peerConnection);

        try {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          get().socket?.emit('offer', {
            offer: peerConnection.localDescription,
            targetUserId: userId,
            meetingId: get().meetingId,
          });
          console.log(`Store: Sent offer to new user: ${userId}`);
        } catch (error) {
          console.error(`Store: Error creating or sending offer to new user ${userId}:`, error);
        }
      }
    });

    socket.on('offer', async ({ offer, senderId }: { offer: RTCSessionDescriptionInit, senderId: string }) => {
      console.log(`Store: Received offer from ${senderId}`);
      let peerConnection = get().peers.get(senderId);

      if (!peerConnection) {
        peerConnection = get().createPeerConnection(senderId);
        if (peerConnection) {
          get().addPeer(senderId, peerConnection);
        } else {
          console.error(`Store: Failed to create peer connection for sender ${senderId}`);
          return;
        }
      }

      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        get().socket?.emit('answer', {
          answer: peerConnection.localDescription,
          targetUserId: senderId,
          meetingId: get().meetingId,
        });
        console.log(`Store: Sent answer to ${senderId}`);
      } catch (error) {
        console.error(`Store: Error processing offer from ${senderId}:`, error);
      }
    });

    socket.on('answer', async ({ answer, senderId }: { answer: RTCSessionDescriptionInit, senderId: string }) => {
      console.log(`Store: Received answer from ${senderId}`);
      const peerConnection = get().peers.get(senderId);
      if (peerConnection && peerConnection.remoteDescription === null) {
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
          console.log(`Store: Set remote description for ${senderId}`);
        } catch (error) {
          console.error(`Store: Error setting remote description for ${senderId}:`, error);
        }
      } else if (!peerConnection) {
        console.warn(`Store: No peer connection found for sender ${senderId} when receiving answer.`);
      }
    });

    socket.on('ice-candidate', async ({ candidate, senderId }: { candidate: RTCIceCandidateInit, senderId: string }) => {
      console.log(`Store: Received ICE candidate from ${senderId}`);
      const peerConnection = get().peers.get(senderId);
      if (peerConnection) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error(`Store: Error adding ICE candidate from ${senderId}:`, error);
        }
      } else {
        console.warn(`Store: No peer connection found for sender ${senderId} when receiving ICE candidate.`);
      }
    });

    socket.on('user-left', ({ userId }: { userId: string }) => {
      console.log(`Store: User left: ${userId}`);
      get().removePeer(userId);
      get().removeRemoteStream(userId);
      get().removeParticipant(userId);
    });

    socket.on('participant-toggled-media', ({ userId, mediaType, state }: { userId: string, mediaType: 'video' | 'audio', state: boolean }) => {
      console.log(`Store: Participant ${userId} toggled ${mediaType} to ${state}`);
      get().updateParticipantMedia(userId, mediaType, state);
    });

    socket.on('chat-message', (message: ChatMessage) => {
      get().addChatMessage(message);
    });

    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
      set({ socket: null, isSocketReady: false, isMeetingReadyForNavigation: false }); // Reset flag on cleanup
      get().clearMeetingState();
    };
  },

  createPeerConnection: (peerId: string) => {
    const localStream = get().localStream;
    if (!localStream) {
      console.error("Store: Local stream is not available to create peer connection.");
      return null;
    }

    const peerConnection = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Store: Sending ICE candidate to ${peerId}`);
        get().socket?.emit('ice-candidate', {
          candidate: event.candidate,
          targetUserId: peerId,
          meetingId: get().meetingId,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      console.log(`Store: Received remote track from ${peerId}`, event.streams);
      if (event.streams && event.streams[0]) {
        get().addRemoteStream(peerId, event.streams[0]);
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`Store: Peer connection state with ${peerId}: ${peerConnection.connectionState}`);
    };

    return peerConnection;
  },

  setUserName: (name) => set({ userName: name }),
  setMeetingId: (id) => set({ meetingId: id }),
  setLocalStream: (stream) => {
    // Stop previous tracks if a new stream is set or current is cleared
    if (get().localStream && get().localStream !== stream) {
      get().localStream?.getTracks().forEach(track => track.stop());
    }
    set((state) => {
        const newState = { localStream: stream };
        // Add/Update local participant in participants map when stream is set
        // Use the socket's current ID for the local participant
        if (stream && state.socket?.id) {
            const currentParticipants = new Map(state.participants);
            currentParticipants.set(state.socket.id, {
                userName: state.userName, // Use userName from store
                videoEnabled: state.localVideoEnabled,
                audioEnabled: state.localAudioEnabled
            });
            return { ...newState, participants: currentParticipants };
        }
        return newState;
    });
  },

  toggleLocalVideo: () => {
    set((state) => {
      const newState = !state.localVideoEnabled;
      state.localStream?.getVideoTracks().forEach(track => track.enabled = newState);
      state.socket?.emit('toggle-video', { meetingId: state.meetingId, videoEnabled: newState });
      
      if (state.socket?.id) {
          const updatedParticipants = new Map(state.participants);
          if (updatedParticipants.has(state.socket.id)) {
              updatedParticipants.set(state.socket.id, {
                  ...updatedParticipants.get(state.socket.id)!,
                  videoEnabled: newState
              });
          }
          return { localVideoEnabled: newState, participants: updatedParticipants };
      }
      return { localVideoEnabled: newState };
    });
  },

  toggleLocalAudio: () => {
    set((state) => {
      const newState = !state.localAudioEnabled;
      state.localStream?.getAudioTracks().forEach(track => track.enabled = newState);
      state.socket?.emit('toggle-audio', { meetingId: state.meetingId, audioEnabled: newState });

      if (state.socket?.id) {
          const updatedParticipants = new Map(state.participants);
          if (updatedParticipants.has(state.socket.id)) {
              updatedParticipants.set(state.socket.id, {
                  ...updatedParticipants.get(state.socket.id)!,
                  audioEnabled: newState
              });
          }
          return { localAudioEnabled: newState, participants: updatedParticipants };
      }
      return { localAudioEnabled: newState };
    });
  },

  addPeer: (userId, peerConnection) => set((state) => ({
    peers: new Map(state.peers).set(userId, peerConnection)
  })),
  removePeer: (userId) => set((state) => {
    const newPeers = new Map(state.peers);
    newPeers.get(userId)?.close();
    newPeers.delete(userId);
    return { peers: newPeers };
  }),

  addRemoteStream: (userId, stream) => set((state) => ({
    remoteStreams: new Map(state.remoteStreams).set(userId, stream)
  })),
  removeRemoteStream: (userId) => set((state) => {
    const newRemoteStreams = new Map(state.remoteStreams);
    newRemoteStreams.get(userId)?.getTracks().forEach(track => track.stop());
    newRemoteStreams.delete(userId);
    return { remoteStreams: newRemoteStreams };
  }),

  addParticipant: (userId, data) => set((state) => ({
    participants: new Map(state.participants).set(userId, data)
  })),
  updateParticipantMedia: (userId, mediaType, state) => set((_state) => {
    const currentParticipants = get().participants;
    if (currentParticipants.has(userId)) {
      const participant = { ...currentParticipants.get(userId)! };
      if (mediaType === 'video') {
        participant.videoEnabled = state;
      } else if (mediaType === 'audio') {
        participant.audioEnabled = state;
      }
      currentParticipants.set(userId, participant);
    }
    return { participants: new Map(currentParticipants) };
  }),
  removeParticipant: (userId) => set((state) => {
    const newParticipants = new Map(state.participants);
    newParticipants.delete(userId);
    return { participants: new Map(newParticipants) };
  }),

  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, message]
  })),

  sendChatMessage: (message) => {
    const state = get();
    if (state.socket && state.meetingId && state.userName) {
      state.socket.emit('chat-message', {
        meetingId: state.meetingId,
        userName: state.userName,
        message: message,
      });
    } else {
      console.warn("Cannot send message: socket not ready or meeting/user info missing.");
    }
  },

  clearMeetingState: () => {
    set((state) => {
      state.localStream?.getTracks().forEach(track => track.stop());
      state.remoteStreams.forEach(stream => stream.getTracks().forEach(track => stream.stop()));

      state.peers.forEach(pc => pc.close());

      return {
        userName: '',
        meetingId: '',
        localStream: null,
        localVideoEnabled: true,
        localAudioEnabled: true,
        peers: new Map(),
        remoteStreams: new Map(),
        participants: new Map(),
        chatMessages: [],
        isMeetingReadyForNavigation: false, // Reset this flag on clear
      };
    });
  },
  setMeetingReadyForNavigation: (ready: boolean) => set({ isMeetingReadyForNavigation: ready }), // NEW action implementation
}));
