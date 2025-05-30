'use client';

import { useEffect, useRef, useState } from 'react';

interface RoomClientProps {
	roomId: string;
	userName: string;
}

export default function RoomClient({ roomId, userName }: RoomClientProps) {
	const localVideoRef = useRef<HTMLVideoElement>(null);
	const [stream, setStream] = useState<MediaStream | null>(null);

	useEffect(() => {
		const setupMedia = async () => {
			try {
				const userStream = await navigator.mediaDevices.getUserMedia({
					video: true,
					audio: true,
				});
				setStream(userStream);
				if (localVideoRef.current) {
					localVideoRef.current.srcObject = userStream;
				}
			} catch (err) {
				alert('Camera/Mic access denied');
				console.error(err);
			}
		};

		setupMedia();
	}, []);

	return (
		<div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">
			<h1 className="text-lg font-bold mb-2">Welcome, {userName}</h1>
			<h2 className="text-sm mb-4">Room: {roomId}</h2>
			<video
				ref={localVideoRef}
				autoPlay
				muted
				playsInline
				className="w-[400px] rounded shadow"
			></video>
		</div>
	);
}