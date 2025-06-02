import { useRef, useEffect } from 'react';
import { FaVideoSlash } from 'react-icons/fa';

// Define prop types for VideoPlayer
interface VideoPlayerProps {
  stream: MediaStream | null; // Stream can be null initially
  muted: boolean;
  videoEnabled: boolean;
}

function VideoPlayer({ stream, muted, videoEnabled }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null); // Specify HTMLVideoElement type

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(error => {
        console.error("Error playing video:", error);
        // Handle autoplay policy errors, e.g., show a play button if needed
      });
    }
    // Cleanup: if stream changes or component unmounts, stop tracks from the *previous* stream
    // This is less critical here as the store manages stream lifecycle, but good practice.
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null; // Detach stream
      }
    };
  }, [stream]); // Re-run effect if stream changes

  // Ensure video element reflects the videoEnabled state
  // This effect ensures that the video track itself is enabled/disabled,
  // which affects what the remote peer receives.
  useEffect(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = videoEnabled;
      }
    }
  }, [videoEnabled, stream]);


  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        className="w-full h-full object-cover transform scale-x-[-1]" // Flip horizontally for selfie view
        autoPlay
        playsInline
        muted={muted}
        style={{ display: videoEnabled ? 'block' : 'none' }} // Hide video element if video is off
      />
      {!videoEnabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <FaVideoSlash className="text-white text-6xl" />
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;
