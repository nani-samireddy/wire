// in App.tsx or a separate Room.tsx if you separate it
import { useEffect, useState, type JSXElementConstructor, type Key, type ReactElement, type ReactNode, type ReactPortal } from "react";
import type { Room as RoomType } from "../types";
import VideoPreview from "./VideoPreview";

function Room({ roomId, roomData }: { roomId: string; roomData: RoomType | null }) {
	const [localStream, setLocalStream] = useState<MediaStream | null>(null);

	useEffect(() => {
		navigator.mediaDevices
			.getUserMedia({ video: true, audio: true })
			.then((stream) => {
				setLocalStream(stream);
			})
			.catch((err) => {
				console.error("Permission denied or error: ", err);
				alert("Please allow camera and microphone access.");
			});
	}, []);

	return (
		<div>
			<h2>Room: {roomId}</h2>
			<h3>Participants:</h3>
			<ul>
				{roomData?.participants.map((p: { id: Key | null | undefined; name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }) => (
					<li key={p.id}>{p.name}</li>
				))}
			</ul>

			{localStream && (
				<div style={{ marginTop: "1rem" }}>
					<h4>Your Camera Preview:</h4>
					<VideoPreview stream={localStream} />
				</div>
			)}
		</div>
	);
}
