import React from "react";
import { useSocketContext } from "../contexts/socketContext";
import { Button } from "@nextui-org/react";

export default function Notifications() {
  const { call, callAccepted, answerCall } = useSocketContext();
  return (
    <>
      {call.isReceivingCall && !callAccepted && (
        <div className="flex flex-col items-center justify-center gap-4">
          <h1>{call.name} is calling...</h1>
          <Button
            color="primary"
            onPress={() => {
              answerCall();
            }}
          >
            Answer
          </Button>
        </div>
      )}
    </>
  );
}
