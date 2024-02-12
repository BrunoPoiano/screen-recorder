import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { ScreenRecorder } from './pages/screen-recorder';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <main>
      <h1>Simple Screen Recorder App</h1>
      <ScreenRecorder />
    </main>
  </React.StrictMode>
);

reportWebVitals();
