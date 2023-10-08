import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import ContextsProvider from "./contexts/contextsProvider";
import { NextUIProvider } from "@nextui-org/react";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <NextUIProvider>
      <ContextsProvider>
        <App />
      </ContextsProvider>
    </NextUIProvider>
  </React.StrictMode>
);
