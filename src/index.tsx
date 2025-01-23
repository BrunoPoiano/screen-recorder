import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { ScreenRecorder } from "./pages/screen-recorder";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <main>
      <h2>Screen Recorder</h2>
      <ScreenRecorder />
      {/* <AppStyles /> */}
    </main>
  </React.StrictMode>,
);

reportWebVitals();
