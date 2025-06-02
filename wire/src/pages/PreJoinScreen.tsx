import { useEffect, useRef, useState } from 'react';
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Import the Zustand store
import VideoPlayer from '../components/VideoPlayer.tsx';
import { useMeetingStore } from '../store/useMeetingStore.tsx';

function PreJoinScreen() {
  const navigate = useNavigate();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [permissionError, setPermissionError] = useState<string>('');

  // --- FIX: Select state and actions individually to prevent new object creation on every render ---
  const userName = useMeetingStore((state) => state.userName);
  const meetingId = useMeetingStore((state) => state.meetingId);
  const localStream = useMeetingStore((state) => state.localStream);
  const setLocalStream = useMeetingStore((state) => state.setLocalStream);
  const localVideoEnabled = useMeetingStore((state) => state.localVideoEnabled);
  const localAudioEnabled = useMeetingStore((state) => state.localAudioEnabled);
  const toggleLocalVideo = useMeetingStore((state) => state.toggleLocalVideo);
  const toggleLocalAudio = useMeetingStore((state) => state.toggleLocalAudio);
  const isSocketReady = useMeetingStore((state) => state.isSocketReady);
  // --- END FIX ---

  useEffect(() => {
    const getMedia = async () => {
      if (!isSocketReady || localStream) {
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play();
          localVideoRef.current.muted = true;
        }
        setPermissionError('');
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setPermissionError('Please allow camera and microphone access to join the meeting.');
        // Update store to reflect media being off if permission denied
        useMeetingStore.setState({ localVideoEnabled: false, localAudioEnabled: false });
      }
    };

    getMedia();

    return () => {
        // The `clearMeetingState` in the store's disconnect handler already stops tracks.
        // This component's cleanup is less critical for stream management now.
    };
  }, [isSocketReady, localStream, setLocalStream]);

  const handleJoinMeeting = () => {
    if (!localStream) {
      setPermissionError('Cannot join without camera/microphone access. Please allow permissions.');
      return;
    }
    navigate('/meeting');
  };

  if (!userName || !meetingId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <p className="text-xl">Please go back to the home page and create or join a meeting first.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300 ease-in-out"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-400">
          Ready to Join, {userName}?
        </h2>
        <p className="text-center text-gray-300 mb-4">Meeting ID: <span className="font-semibold text-blue-300">{meetingId}</span></p>

        <div className="relative w-full h-80 bg-black rounded-lg overflow-hidden mb-6 border-2 border-gray-700">
          <VideoPlayer
            stream={localStream}
            muted={true}
            videoEnabled={localVideoEnabled}
          />
          {permissionError && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-80 p-4 text-center">
              <p className="text-red-300 text-lg">{permissionError}</p>
            </div>
          )}
        </div>

        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={toggleLocalVideo}
            className={`p-4 rounded-full transition duration-300 ease-in-out shadow-md
              ${localVideoEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}
              text-white text-xl flex items-center justify-center`}
            disabled={!localStream && !permissionError}
          >
            {localVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
          </button>
          <button
            onClick={toggleLocalAudio}
            className={`p-4 rounded-full transition duration-300 ease-in-out shadow-md
              ${localAudioEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}
              text-white text-xl flex items-center justify-center`}
            disabled={!localStream && !permissionError}
          >
            {localAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
          </button>
        </div>

        <button
          onClick={handleJoinMeeting}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center shadow-lg"
          disabled={!localStream || permissionError}
        >
          Join Meeting <FaArrowRight className="ml-2" />
        </button>
      </div>
    </div>
  );
}

export default PreJoinScreen;
