import { create } from "zustand";

interface UseAppStore {
	isInit: boolean;
	audioCtx: AudioContext | undefined;
	captureNode: AudioWorkletNode | undefined;
	sourceNode: MediaStreamAudioSourceNode | undefined;
	init: () => void;
	record: () => void;
	playNote: (midiNote: number) => void;
	stopNote: (midiNote: number) => void;
}

export const useAppStore = create<UseAppStore>((set, get) => {
	return {
		isInit: false,
		audioCtx: undefined,
		captureNode: undefined,
		sourceNode: undefined,
		init: async () => {
			if (get().isInit) return;
			const audioCtx = new AudioContext();
			await audioCtx.audioWorklet.addModule("worklets/capture_processor.js");
			const captureNode = new AudioWorkletNode(audioCtx, "capture", {
				numberOfInputs: 1,
				outputChannelCount: [2],
			});

			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: false,
			});
			const sourceNode = audioCtx.createMediaStreamSource(stream);

			sourceNode.connect(captureNode);
			captureNode.connect(audioCtx.destination);

			audioCtx.resume();

			set({ audioCtx, captureNode, isInit: true });
		},
		record: () => {
			const captureNode = get().captureNode;
			if (captureNode) {
				captureNode.port.postMessage({ cmd: "rec" });
			}
		},
		playNote: (midiNote: number) => {
			const captureNode = get().captureNode;
			if (captureNode) {
				captureNode.port.postMessage({ cmd: "play", val: midiNote });
			}
		},
		stopNote: (midiNote: number) => {
			const captureNode = get().captureNode;
			if (captureNode) {
				captureNode.port.postMessage({ cmd: "stop", val: midiNote });
			}
		},
	};
});
