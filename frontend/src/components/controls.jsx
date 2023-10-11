import { useState } from "react";
import {
  ButtonGroup,
  Button,
  Card,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Snippet,
} from "@nextui-org/react";
import Microphone from "../icons/microphone";
import Camera from "../icons/camera";
import MenuIcon from "../icons/menu";
import InfoIcon from "../icons/info";
import HangUpIcon from "../icons/hangup";
import { useSocketContext } from "../contexts/socketContext";

export default function Controls() {
  const {
    me,
    isMenuOpen,
    setIsMenuOpen,
    isMicOn,
    setIsMicOn,
    isCamOn,
    setisCamOn,
    leaveCall,
  } = useSocketContext();

  const handleMenuToggle = () => {
    console.log("menu toggle");
    setIsMenuOpen(!isMenuOpen);
  };

  const handleChatToggle = () => {
    console.log("chat toggle");
  };

  const handleMicToggle = () => {
    console.log("mic toggle");
    setIsMicOn(!isMicOn);
  };

  const handleCameraToggle = () => {
    console.log("camera toggle");
    setisCamOn(!isCamOn);
  };
  return (
    <Card isBlurred shadow="sm" className="p-2">
      <ButtonGroup>
        {/* <Button
          className="mx-2"
          isIconOnly
          variant="light"
          onPress={handleMicToggle}
        >
          <Microphone status={isMicOn} />
        </Button>
        <Button
          className="mx-2"
          isIconOnly
          variant="light"
          onPress={handleCameraToggle}
        >
          <Camera status={isCamOn} />
        </Button> */}

        <Button className="mx-2" isIconOnly variant="light" onPress={leaveCall}>
          <HangUpIcon />
        </Button>
        <Button
          className="mx-2"
          isIconOnly
          variant="light"
          onPress={handleMenuToggle}
        >
          <MenuIcon />
        </Button>
        <Popover>
          <PopoverTrigger>
            <Button className="mx-2" isIconOnly variant="light">
              <InfoIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="px-1 py-2">
              <div className=" text-base font-bold">Meeting info</div>
              <div className="text-sm p-2">
                Meeting ID:
                <Snippet hideSymbol="true" size="sm" variant="flat">
                  {me}
                </Snippet>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </ButtonGroup>
    </Card>
  );
}
