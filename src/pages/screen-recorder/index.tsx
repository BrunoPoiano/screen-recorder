import { useEffect, useState } from "react";
import styles from "./styles.module.css";

type Options = {
  name: string;
  id?: number;
  label: string;
};
type MimeOptions = {
  label: string;
  id: string;
  lang: string;
};

type ActionButtonsProps = {
  handleStartReccording: VoidFunction;
  screenSelected: string | undefined;
  mediaRecorder: MediaRecorder | undefined;
  recording: boolean;
};

export const ScreenRecorder = () => {
  const [oprionsMenu, setOprionsMenu] = useState<Options[]>([]);
  const [screenSelected, setScreenSelected] = useState<string>();
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder>();
  const [recording, setRecording] = useState<boolean>(false);

  let recordedChunks: Blob[] = [];
  let interval: NodeJS.Timeout | undefined;
  const [seconds, setSeconds] = useState<number>(0);
  const [timer, setTimer] = useState<boolean>(false);

  const [mimeTypeOptions, setMimeTypeOptions] = useState<MimeOptions[]>([]);
  const [mimeType, setMimeType] = useState<string>("video/webm; codecs=h264");

  useEffect(() => {
    getDesktopSources();
    setMimeTypeOptions(supportedMimeTypes());
  }, []);

  useEffect(() => {
    if (!screenSelected) return;
    selectSource(screenSelected);
  }, [screenSelected]);

  useEffect(() => {
    if (timer) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [timer, interval]);

  const getDesktopSources = async () => {
    window.require("electron");

    if (!window) return;
    if (!window.require) return;

    const electron = window.require("electron");

    if (!electron) return;

    const ipcRenderer = electron.ipcRenderer;

    if (!ipcRenderer) {
      console.error("Electron IPC renderer not available.");
      return;
    }

    try {
      const sources = await ipcRenderer.invoke("getDesktopSources", {
        types: ["screen", "window"],
      });

      const Options = sources.map((item: Options) => {
        const name =
          item.name.length >= 40 ? `${item.name.slice(0, 35)}...` : item.name;
        return {
          label: name,
          id: item.id,
        };
      });

      setOprionsMenu(Options);
    } catch (error) {
      console.error("Error getting desktop sources from main process:", error);
    }
  };

  async function selectSource(sourceId: string) {
    const videoElement = document.querySelector("video");

    if (!videoElement) return;

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: sourceId,
          },
        } as MediaTrackConstraints,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      videoElement.srcObject = stream;
      videoElement.play();

      const options = { mimeType: mimeType };
      const mediaRecorderOprions = new MediaRecorder(stream, options);

      mediaRecorderOprions.ondataavailable = handleDataAvailable;
      mediaRecorderOprions.onstop = handleStop;

      setMediaRecorder(mediaRecorderOprions);
    } catch (error) {
      console.error("Error accessing user media", error);
    }
  }

  const handleDataAvailable = (event: BlobEvent) => {
    if (event.data.size === 0) return;

    recordedChunks.push(event.data);
    setRecording(true);
    setTimer(true);
  };

  const handleStartReccording = () => {
    if (mediaRecorder) {
      recordedChunks = [];
      mediaRecorder.start(10);
    }
  };

  async function handleStop() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }

    if (!window) return;
    if (!window.require) return;

    const electron = window.require("electron");

    if (!electron) return;

    const ipcRenderer = electron.ipcRenderer;

    if (!ipcRenderer) {
      console.error("Electron IPC renderer not available.");
      return;
    }

    const blob = new Blob(recordedChunks, {
      type: mimeType,
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    const format = mimeTypeOptions.find((item) => item.id === mimeType)?.lang;

    setSeconds(0);
    setTimer(false);
    try {
      await ipcRenderer.invoke("saveScreenRecorded", buffer, format);
      setRecording(false);
      recordedChunks = [];
    } catch (error) {
      console.error("Error invoking saveScreenRecorded:", error);
    }
  }

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <div className={styles.ScreenRecorderWrapper}>
      <video />
      <small>{formatTime(seconds)}</small>

      <ActionButtons
        screenSelected={screenSelected}
        mediaRecorder={mediaRecorder}
        recording={recording}
        handleStartReccording={handleStartReccording}
      />
      <div className={styles.SelectWrapper}>
        <select
          value={mimeType}
          onChange={(event) => setMimeType(event.target.value)}
          disabled={recording}
        >
          {mimeTypeOptions.map((item: MimeOptions) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.SelectWrapper}>
        <select
          value={screenSelected}
          onChange={(event) => setScreenSelected(event.target.value)}
          disabled={recording}
        >
          {!screenSelected && <option value="">Screens</option>}
          {oprionsMenu.map((item: Options) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <button type="button" onClick={() => getDesktopSources()}>
        Refresh Screens
      </button>
    </div>
  );
};

const supportedMimeTypes = (): MimeOptions[] => {
  const commonCodecs = ["h264", "vp8", "vp9", "hevc", "theora"];
  const containers = [
    "avi",
    "mov",
    "mkv",
    "wmv",
    "flv",
    "3gp",
    "mpeg",
    "divx",
    "webm",
    "mp4",
    "ogg",
  ];

  const supportedTypes = [];

  for (const container of containers) {
    for (const commonCodec of commonCodecs) {
      if (
        MediaRecorder.isTypeSupported(
          `video/${container}; codecs=${commonCodec}`,
        )
      ) {
        supportedTypes.push({
          id: `video/${container}; codecs=${commonCodec}`,
          label: `${container} (${commonCodec})`,
          lang: container,
        });
      }
    }
  }

  return supportedTypes;
};

const ActionButtons: React.FC<ActionButtonsProps> = ({
  screenSelected,
  handleStartReccording,
  mediaRecorder,
  recording = false,
}) => {
  if (!screenSelected) {
    return <h3>Select a screen</h3>;
  }

  console.log(mediaRecorder);
  if (mediaRecorder === undefined) {
    return null;
  }

  return (
    <div className={styles.buttonWrapper}>
      <button
        type="button"
        className={styles.StartButton}
        onClick={() => handleStartReccording()}
        disabled={recording}
      >
        Start
      </button>
      <button
        type="button"
        className={styles.StopButton}
        onClick={() => mediaRecorder.stop()}
        disabled={!recording}
      >
        Stop
      </button>
    </div>
  );
};
