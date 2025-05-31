// src/components/VideoPreview.tsx
import { useEffect, useRef } from "react";

interface Props {
	stream: MediaStream | null;
}

const VideoPreview: React.FC<Props> = ({ stream }) => {
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		if (videoRef.current && stream) {
			videoRef.current.srcObject = stream;
		}
	}, [stream]);

	return (
		<video
			ref={videoRef}
			autoPlay
			muted
			playsInline
			style={{ width: "300px", borderRadius: "8px", border: "2px solid #ccc" }}
		/>
	);
};

export default VideoPreview;
