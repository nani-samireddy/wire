import RoomClient from '@/components/app/RoomClient';
import { cookies } from 'next/headers';

export default async function RoomPage({ params }: { params: { id: string } }) {
	const roomId = params.id;
	const userName = (await cookies()).get('userName')?.value || 'Anonymous';

	return (
		<RoomClient roomId={roomId} userName={userName} />
	);
}
