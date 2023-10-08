import { useState } from "react";
import "./App.css";
import Controls from "./components/controls";
import { VideoPlayer } from "./components/videoPlayer";
import { useSocketContext } from "./contexts/socketContext";
import { Button, Card, CardHeader, Input, Snippet } from "@nextui-org/react";
import Notifications from "./components/notifications";
import Navbar from "./components/navbar";

function App() {
  const {
    myVideo,
    name,
    setName,
    callAccepted,
    userVideo,
    callEnded,
    stream,
    call,
    userId,
    setUserId,
    callUser,
    me,
  } = useSocketContext();
  return (
    <div className="App">
      <Navbar />
      <div className=" flex-col flex flex-wrap items-center justify-evenly w-screen my-10 lg:flex-row gap-10 lg:gap-0">
        <div className="w-[80vw] lg:w-[45vw]">
          {stream && <VideoPlayer videoRef={myVideo} name="You" mute={true} />}
        </div>
        <div
          className={`${
            callAccepted && !callEnded ? " lg:w-[45vw]" : "lg:w-[30vw]"
          }`}
        >
          {
            // If call is accepted, show userVideo
            callAccepted && !callEnded ? (
              <div className="rounded-lg shadow-xl">
                <VideoPlayer videoRef={userVideo} name={name} />
              </div>
            ) : (
              <div className="flex flex-col  justify-center gap-6 pb-36">
                <Input
                  placeholder="Enter your name here"
                  value={name}
                  onValueChange={(e) => setName(e)}
                  required
                />
                <Input
                  placeholder="Enter the ID of the person you want to call"
                  value={userId}
                  onValueChange={(e) => setUserId(e)}
                  required
                />
                <Button
                  color="primary"
                  onPress={() => {
                    callUser(userId);
                  }}
                >
                  Make a call
                </Button>
                <p>or</p>
                <span className=" font-semibold">
                  Copy your ID <Snippet hideSymbol>{`${me}`}</Snippet>
                </span>
              </div>
            )
          }
        </div>
      </div>
      <div className=" fixed bottom-0 left-0 w-full flex items-center justify-center mb-6">
        <Controls />
      </div>
      <div className=" fixed bottom-0 right-0 w-max flex items-center justify-center mb-6">
        <Notifications />
      </div>
    </div>
  );
}

export default App;
