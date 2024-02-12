import { useEffect, useState } from 'react';
import styles from './styles.module.css';


export const ScreenRecorder = () => {
  const [oprionsMenu, setOprionsMenu] = useState<any[]>([]);
  const [screenSelected, setScreenSelected] = useState<any>();
  const [mediaRecorder, setMediaRecorder] = useState<any>();
  const [recording, setRecording] = useState<boolean>(false);

  let recordedChunks: any[] = [];

  useEffect(() => {
    getDesktopSources()
  }, []);

  useEffect(() => {
    selectSource(screenSelected)
  }, [screenSelected]);

  const getDesktopSources = async () => {

    if (!window) return
    if (!window.require) return

    const electron = window.require('electron');

    if (!electron) return

    const ipcRenderer = electron.ipcRenderer;

    if (!ipcRenderer) {
      console.error('Electron IPC renderer not available.');
      return;
    }

    try {
      const sources = await ipcRenderer.invoke('getDesktopSources', { types: ['screen', 'window'] });
      const Options = sources.map((item: any) => {
        return {
          label: item.name,
          id: item.id
        }
      })

      setOprionsMenu(Options)

    } catch (error) {
      console.error('Error getting desktop sources from main process:', error);
    }
  };

  async function selectSource(sourceId: any) {
    const videoElement = document.querySelector('video');

    if (!videoElement) return

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
          }
        } as MediaTrackConstraints
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      videoElement.srcObject = stream;
      videoElement.play();

      const options = { mimeType: 'video/webm; codecs=H264' };
      const mediaRecorderOprions = new MediaRecorder(stream, options);

      mediaRecorderOprions.ondataavailable = handleDataAvailable;
      mediaRecorderOprions.onstop = handleStop;

      setMediaRecorder(mediaRecorderOprions)

    } catch (error) {
      console.error('Error accessing user media', error);
    }

  }

  const handleDataAvailable = (event: BlobEvent) => {
    if (event.data.size === 0) return

    recordedChunks.push(event.data);
    setRecording(true)
  }

  async function handleStop() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }

    if (!window) return
    if (!window.require) return

    const electron = window.require('electron');

    if (!electron) return

    const ipcRenderer = electron.ipcRenderer;

    if (!ipcRenderer) {
      console.error('Electron IPC renderer not available.');
      return;
    }

    const blob = new Blob(recordedChunks, {
      type: 'video/webm; codecs=H264'
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    try {
      await ipcRenderer.invoke('saveScreenRecorded', buffer);
      setRecording(false)
    } catch (error) {
      console.error('Error invoking saveScreenRecorded:', error);
    }

  }

  return (
    <div className={styles.ScreenRecorderWrapper}>

      {!screenSelected ?
        <h3>Select a screen</h3>
        :
        <>
          <video></video>
          <div className={styles.buttonWrapper}>
            <button onClick={() => mediaRecorder && mediaRecorder.start(10)} disabled={recording} > Start</button>
            <button onClick={() => mediaRecorder && mediaRecorder.stop()} disabled={!recording}> Stop</button>
          </div>
        </>
      }

      <div>
        <select
          onChange={(event) =>
            setScreenSelected(event.target.value)}
          disabled={recording}
        >
          {
            oprionsMenu.map((item: any, index: number) => (
              <option key={index} value={item.id}>{item.label}</option>
            ))
          }
        </select>
      </div>
    </div>
  )
}