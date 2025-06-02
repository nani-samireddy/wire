import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer.tsx';
import ChatBox from '../components/ChatBox.tsx';
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaComment } from 'react-icons/fa';
import { useMeetingStore } from '../store/useMeetingStore.tsx';
import type { ParticipantData } from '../store/useMeetingStore.tsx';


function MeetingRoom() {
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState<boolean>(false);

  // Select state and actions individually
  const socket = useMeetingStore((state) => state.socket);
  const userName = useMeetingStore((state) => state.userName);
  const meetingId = useMeetingStore((state) => state.meetingId);
  const localStream = useMeetingStore((state) => state.localStream);
  const localVideoEnabled = useMeetingStore((state) => state.localVideoEnabled);
  const localAudioEnabled = useMeetingStore((state) => state.localAudioEnabled);
  const remoteStreams = useMeetingStore((state) => state.remoteStreams);
  const participants = useMeetingStore((state) => state.participants);
  const chatMessages = useMeetingStore((state) => state.chatMessages);
  const toggleLocalVideo = useMeetingStore((state) => state.toggleLocalVideo);
  const toggleLocalAudio = useMeetingStore((state) => state.toggleLocalAudio);
  const clearMeetingState = useMeetingStore((state) => state.clearMeetingState);
  const isMeetingReadyForNavigation = useMeetingStore((state) => state.isMeetingReadyForNavigation); // Get the flag

  // Effect to handle navigation if the meeting is NOT ready
  useEffect(() => {
    // If the flag is false, it means we shouldn't be in this room yet.
    // This handles direct URL access or failed setup.
    if (!isMeetingReadyForNavigation) {
      console.warn("MeetingRoom: Meeting not ready for navigation. Redirecting to home.");
      navigate('/');
    }
  }, [isMeetingReadyForNavigation, navigate]);


  const leaveMeeting = () => {
    clearMeetingState();
    navigate('/');
  };

  // Show a loading/redirect message if the meeting is not yet ready for navigation
  if (!isMeetingReadyForNavigation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <p className="text-xl">Loading meeting... Please ensure camera/mic permissions are granted and you joined from the home page.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300 ease-in-out"
        >
          Go to Home
        </button>
      </div>
    );
  }

  // Filter out the local user from the participants map for rendering remote videos
  const remoteParticipantsArray: [string, ParticipantData][] = Array.from(participants.entries())
    .filter(([id, _]) => id !== socket?.id);

  return (
    <div className="flex flex-col h-screen w-full bg-gray-900 text-white font-inter">
      {/* Header */}
      <header className="bg-gray-800 p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold text-blue-400">Meeting ID: {meetingId}</h1>
        <div className="flex space-x-4">
          <button
            onClick={toggleLocalVideo}
            className={`p-3 rounded-full transition duration-300 ease-in-out shadow-lg
              ${localVideoEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}
              text-white text-lg flex items-center justify-center`}
            title={localVideoEnabled ? "Turn off video" : "Turn on video"}
          >
            {localVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
          </button>
          <button
            onClick={toggleLocalAudio}
            className={`p-3 rounded-full transition duration-300 ease-in-out shadow-lg
              ${localAudioEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}
              text-white text-lg flex items-center justify-center`}
            title={localAudioEnabled ? "Turn off microphone" : "Turn on microphone"}
          >
            {localAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
          </button>
          <button
            onClick={leaveMeeting}
            className="p-3 rounded-full bg-red-700 hover:bg-red-800 text-white text-lg flex items-center justify-center transition duration-300 ease-in-out shadow-lg"
            title="Leave meeting"
          >
            <FaPhoneSlash />
          </button>
          <button
            onClick={() => setShowChat(prev => !prev)}
            className={`p-3 rounded-full transition duration-300 ease-in-out shadow-lg
              ${showChat ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'}
              text-white text-lg flex items-center justify-center`}
            title={showChat ? "Hide chat" : "Show chat"}
          >
            <FaComment />
          </button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video grid */}
        <div className={`flex-1 p-4 grid gap-4 ${showChat ? 'lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'} auto-rows-fr overflow-y-auto`}>
          {/* Local Video */}
          <div className="relative bg-gray-800 rounded-lg shadow-lg overflow-hidden border-2 border-blue-500">
            <VideoPlayer
              stream={localStream}
              muted={true} // Always mute local video for self-view
              videoEnabled={localVideoEnabled}
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded-md">
              {userName} (You)
              {!localAudioEnabled && <FaMicrophoneSlash className="inline-block ml-1 text-red-400" />}
            </div>
          </div>

          {/* Remote Videos */}
          {remoteParticipantsArray.map(([userId, participantData]) => (
            <div key={userId} className="relative bg-gray-800 rounded-lg shadow-lg overflow-hidden border-2 border-gray-700">
              <VideoPlayer
                stream={remoteStreams.get(userId) || null} // Ensure stream is MediaStream | null
                muted={false} // Do not mute remote videos
                videoEnabled={participantData.videoEnabled}
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded-md">
                {participantData.userName}
                {!participantData.audioEnabled && <FaMicrophoneSlash className="inline-block ml-1 text-red-400" />}
              </div>
            </div>
          ))}
        </div>

        {/* Chat Box */}
        {showChat && (
          <div className="w-full lg:w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
            <ChatBox /> {/* ChatBox will now get its data from the store */}
          </div>
        )}
      </div>
    </div>
  );
}

export default MeetingRoom;
