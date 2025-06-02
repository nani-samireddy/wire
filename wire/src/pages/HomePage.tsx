import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input.tsx';
import { Button } from '../components/ui/button.tsx';
import VideoPlayer from '../components/VideoPlayer.tsx';
import { useMeetingStore } from '../store/useMeetingStore.tsx';
import Camera from '../components/icons/Camera.tsx';
import Microphone from '../components/icons/Microphone.tsx';

function HomePage() {
  const navigate = useNavigate();
  const [nameInput, setNameInput] = useState<string>('');
  const [meetingIdInput, setMeetingIdInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [permissionError, setPermissionError] = useState<string>(''); // For media permission errors

  // Get state and actions from the Zustand store
  const socket = useMeetingStore((state) => state.socket);
  const setUserName = useMeetingStore((state) => state.setUserName);
  const setMeetingId = useMeetingStore((state) => state.setMeetingId);
  const localStream = useMeetingStore((state) => state.localStream);
  const setLocalStream = useMeetingStore((state) => state.setLocalStream);
  const localVideoEnabled = useMeetingStore((state) => state.localVideoEnabled);
  const localAudioEnabled = useMeetingStore((state) => state.localAudioEnabled);
  const toggleLocalVideo = useMeetingStore((state) => state.toggleLocalVideo);
  const toggleLocalAudio = useMeetingStore((state) => state.toggleLocalAudio);
  const isSocketReady = useMeetingStore((state) => state.isSocketReady);

  // Effect to get local media stream for preview
  useEffect(() => {
    const getMedia = async () => {
      // Only attempt to get media if socket is ready and stream is not already set
      if (!isSocketReady || localStream) {
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream); // Update the store with the new local stream
        // The VideoPlayer component will handle attaching this stream to its video element
        setPermissionError(''); // Clear any previous permission errors
      } catch (err) {
        console.error('Error accessing media devices on HomePage:', err);
        setPermissionError('Please allow camera and microphone access for video preview and meeting.');
        // If permission is denied, ensure local stream is null and video/audio are off in store
        setLocalStream(null); // Explicitly clear stream in store
        useMeetingStore.setState({ localVideoEnabled: false, localAudioEnabled: false });
      }
    };

    getMedia();

    // No explicit stream stopping here as the store's setLocalStream handles it
    // when a new stream is set or when clearMeetingState is called (on disconnect).
  }, [isSocketReady, localStream, setLocalStream]);

  // Listen for meeting creation/joining events from the backend (via store)
  useEffect(() => {
    if (!socket) return; // Wait for socket to be ready

    const handleMeetingCreated = ({ meetingId: createdId, userId, userName: createdUserName }: { meetingId: string, userId: string, userName: string }) => {
      console.log('HomePage: Meeting created confirmation received. Navigating to meeting room.');
      console.log(`Meeting created with ID: ${createdId}, User ID: ${userId}, User Name: ${createdUserName}`);
      navigate('/meeting'); // Directly navigate to meeting room
    };

    const handleMeetingJoined = ({ meetingId: joinedId, userId, userName: joinedUserName }: { meetingId: string, userId: string, userName: string, existingParticipants: any[] }) => {
      console.log('HomePage: Meeting joined confirmation received. Navigating to meeting room.');
      console.log(`HomePage: Meeting joined confirmation received. Meeting ID: ${joinedId}, User ID: ${userId}, User Name: ${joinedUserName}`);
      navigate('/meeting'); // Directly navigate to meeting room
    };

    socket.on('meeting-created', handleMeetingCreated);
    socket.on('meeting-joined', handleMeetingJoined);

    // Cleanup: remove event listeners when component unmounts
    return () => {
      socket.off('meeting-created', handleMeetingCreated);
      socket.off('meeting-joined', handleMeetingJoined);
    };
  }, [socket, navigate]);

  // Combined handler for both Create Meeting and Join Meeting
  const handleAction = () => {
    if (nameInput.trim() === '') {
      setErrorMessage('Please enter your name.');
      return;
    }
    // Check if media stream is available (permissions granted)
    // This is the critical check before emitting the socket event
    if (!localStream) {
        setErrorMessage('Please allow camera and microphone access to proceed.');
        return;
    }

    setErrorMessage(''); // Clear previous errors

    if (meetingIdInput.trim() === '') {
      // Logic for Create Meeting
      setUserName(nameInput.trim());
      socket?.emit('create-meeting', { userName: nameInput.trim() });
    } else {
      // Logic for Join Meeting
      const meetingIdPattern = /^[a-zA-Z0-9]{3}-[a-zA-Z0-9]{3}-[a-zA-Z0-9]{3}$/;
      if (!meetingIdInput.trim().match(meetingIdPattern)) {
        setErrorMessage('Please enter a valid meeting ID (e.g., xxx-xxx-xxx).');
        return;
      }
      setUserName(nameInput.trim());
      setMeetingId(meetingIdInput.trim());
      socket?.emit('join-meeting', { meetingId: meetingIdInput.trim(), userName: nameInput.trim() });
    }
  };

  return (
    <div className="font-inter">
      <div className='border-b border-gray-800'>
        <h1 className='text-3xl font-bold text-center p-4'>WIRE</h1>
      </div>
      <div className="flex flex-col lg:flex-row justify-evenly gap-10 p-10">
        {/* Video Preview Section */}
        <div className="relative flex-1 bg-black rounded-lg overflow-hidden border-2 border-black h-[450px]">
          <VideoPlayer
            stream={localStream}
            muted={true} // Always mute local video for self-view
            videoEnabled={localVideoEnabled} // Use localVideoEnabled from store
          />
          {permissionError && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-80 p-4 text-center">
              <p className="text-red-300 text-lg">{permissionError}</p>
            </div>
          )}
          {!localStream && !permissionError && (
              <div className="absolute inset-0 flex items-center justify-center bg-opacity-75">
                <p className="text-white text-center">Awaiting camera/mic permissions...</p>
              </div>
          )}
          {/* Video/Audio Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
            <Button variant="secondary" size="icon" className="size-8" onClick={toggleLocalVideo} disabled={!localStream && !permissionError}>
              <Camera status={localVideoEnabled} />
            </Button>
            <Button variant="secondary" size="icon" className="size-8" onClick={toggleLocalAudio} disabled={!localStream && !permissionError}>
              <Microphone status={localAudioEnabled} />
            </Button>
          </div>
        </div>

        {/* Form Section */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className=' w-10/12 lg:w-[60%] flex flex-col justify-center'>
            {errorMessage && (
            <p className="text-red-500 text-center mb-4">{errorMessage}</p>
          )}

            <Input
              type="text"
              id="name"
              placeholder="Enter your name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className='mb-4'
              required
            />
            <Input
              type="text"
              id="meetingId"
              placeholder="Enter meeting ID to join (leave empty to create)"
              value={meetingIdInput}
              onChange={(e) => setMeetingIdInput(e.target.value)}
              className='mb-4'
            />

          <Button
            onClick={handleAction}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
            disabled={!socket || !localStream || !!permissionError} // Disable if socket not ready, no stream, or permission error
          >
            {meetingIdInput.trim() === '' ? 'Create Meeting' : 'Join Meeting'}
          </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
