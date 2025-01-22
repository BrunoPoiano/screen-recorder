import { useEffect, useState } from "react";
import styles from "./styles.module.css";

export const ScreenRecorder = () => {
	const [oprionsMenu, setOprionsMenu] = useState<any[]>([]);
	const [screenSelected, setScreenSelected] = useState<any>();
	const [mediaRecorder, setMediaRecorder] = useState<any>();
	const [recording, setRecording] = useState<boolean>(false);

	let recordedChunks: any[] = [];
	let interval: NodeJS.Timeout | undefined;
	const [seconds, setSeconds] = useState<number>(0);
	const [timer, setTimer] = useState<boolean>(false);

	useEffect(() => {
		getDesktopSources();
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
	}, [timer]);

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
			const Options = sources.map((item: any) => {
				const name =
					item.name.length >= 40 ? item.name.slice(0, 35) + "..." : item.name;
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

	async function selectSource(sourceId: any) {
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

			const options = { mimeType: "video/webm; codecs=H264" };
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
		recordedChunks = [];
		mediaRecorder.start(10);
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
			type: "video/webm; codecs=H264",
		});

		const buffer = Buffer.from(await blob.arrayBuffer());

		setSeconds(0);
		setTimer(false);
		try {
			await ipcRenderer.invoke("saveScreenRecorded", buffer);
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
			<video></video>
			<small>{formatTime(seconds)}</small>
			<ActionButtons
				screenSelected={screenSelected}
				mediaRecorder={mediaRecorder}
				recording={recording}
				handleStartReccording={handleStartReccording}
			/>

			<div className={styles.SelectWrapper}>
				<select
					value={screenSelected}
					onChange={(event) => setScreenSelected(event.target.value)}
					disabled={recording}
				>
					{!screenSelected && <option value="">Screens</option>}
					{oprionsMenu.map((item: any, index: number) => (
						<option key={index} value={item.id}>
							{item.label}
						</option>
					))}
				</select>
			</div>
			<button onClick={() => getDesktopSources()}>Refresh Screens</button>
		</div>
	);
};

type ActionButtonsProps = {
	handleStartReccording: any;
	screenSelected: any;
	mediaRecorder: any;
	recording: boolean;
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

	if (!mediaRecorder) {
		return null;
	}

	return (
		<div className={styles.buttonWrapper}>
			<button
				className={styles.StartButton}
				onClick={() => handleStartReccording()}
				disabled={recording}
			>
				{" "}
				Start
			</button>
			<button
				className={styles.StopButton}
				onClick={() => mediaRecorder.stop()}
				disabled={!recording}
			>
				{" "}
				Stop
			</button>
		</div>
	);
};
