import { Card } from "@nextui-org/react";

export const VideoPlayer = ({ videoRef, name, mute }) => {
  return (
    <Card className="w-full  object-cover rounded-lg">
      <video
        className="w-full object-cover rounded-lg"
        autoPlay
        playsInline
        muted={mute}
        ref={videoRef}
      />
      <Card
        shadow="none"
        isBlurred
        className="absolute bottom-0 left-0   text-xs m-2 text-black px-2"
      >
        {name}
      </Card>
    </Card>
  );
};
