import React from "react";
import { SocketProvider } from "./socketContext";

export default function ContextsProvider(props) {
  return <SocketProvider>{props.children}</SocketProvider>;
}
