import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";

const SocketContext = createContext();

export const useSocketContext = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const socket = useMemo(() => io("http://localhost:5002"), []);
  const [stream, setStream] = useState(null);
  const myVideo = useRef();
  const userVideo = useRef(null);
  const connectionRef = useRef();
  const [me, setMe] = useState("");
  const [call, setCall] = useState({});
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setisCamOn] = useState(true);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: isCamOn, audio: true })
      .then((currentStream) => {
        if (currentStream) {
          currentStream
            .getTracks()
            .find((track) => track.kind === "audio").enabled = isMicOn;
        }
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      });
  }, [isCamOn, isMicOn]);

  useEffect(() => {
    socket.on("me", (id) => setMe(id));
    socket.on("callUser", ({ from, name: callerName, signal }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });
  }, [socket]);

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: call.from });
    });
    peer.on("stream", (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });
    peer.signal(call.signal);
    connectionRef.current = peer;
  };
  const callUser = () => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: userId,
        signalData: data,
        from: me,
        name,
      });
    });
    peer.on("stream", (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });
    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });
    connectionRef.current = peer;
  };
  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
    window.location.reload();
  };
  return (
    <SocketContext.Provider
      value={{
        socket,
        call,
        callAccepted,
        myVideo,
        userVideo,
        name,
        setName,
        stream,
        callEnded,
        callUser,
        leaveCall,
        answerCall,
        me,
        userId,
        setUserId,
        isMenuOpen,
        setIsMenuOpen,
        isMicOn,
        setIsMicOn,
        isCamOn,
        setisCamOn,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
