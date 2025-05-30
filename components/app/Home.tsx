'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ShinyButton } from '../magicui/shiny-button';
import { setUserNameCookie } from '@/app/actions/set-user-cookie';
import { generateRoomId } from '@/lib/utils';

export const Home = () => {
	const [userName, setUserName] = useState('');
	const [roomId, setRoomId] = useState('');
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const handleEnter = async () => {
	const finalRoomId = roomId.trim() || generateRoomId();

	if (!userName.trim()) {
		alert('Please enter your name');
		return;
	}

	try {
		// Request camera and mic access
		await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

		// Mute the microphone by default
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

		// Permission granted
		startTransition(async () => {
			await setUserNameCookie(userName);
			router.push(`/room/${finalRoomId}`);
		});
	} catch (err) {
		alert('Please allow access to camera and microphone to join the room.');
		console.error('Media permission denied:', err);
	}
};

	return (
		<div className="h-screen w-full flex flex-col items-center justify-center">
			<h1 className="text-2xl font-bold">Welcome to WIRE</h1>
			<p className="text-sm text-gray-500">A simple video chat app</p>

			<div className="flex flex-col items-center mt-4">
				<input
					type="text"
					name="user-name"
					id="userName"
					className="m-2 border border-gray-300 px-4 py-2 rounded-md"
					placeholder="Enter your name"
					value={userName}
					onChange={(e) => setUserName(e.target.value)}
				/>
				<input
					type="text"
					name="room-id"
					id="roomId"
					className="m-2 border border-gray-300 px-4 py-2 rounded-md"
					placeholder="Enter room ID (or leave empty to create one)"
					value={roomId}
					onChange={(e) => setRoomId(e.target.value)}
				/>
				<ShinyButton onClick={handleEnter}>
					{roomId.trim() ? 'Join Room' : 'Create Room'}
				</ShinyButton>
			</div>
		</div>
	);
};
