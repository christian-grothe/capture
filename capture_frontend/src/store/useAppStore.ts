import { create } from "zustand";

interface UseAppStore {
	number: number;
	audioCtx: AudioContext | undefined;
	captureNode: AudioWorkletNode | undefined;
	oscNode: OscillatorNode | undefined;
	init: () => void;
	record: () => void;
	playNote: () => void;
	stopNote: () => void;
}

export const useAppStore = create<UseAppStore>((set, get) => {
	return {
		number: 10,
		audioCtx: undefined,
		captureNode: undefined,
		oscNode: undefined,
		init: async () => {
			const audioCtx = new AudioContext();
			await audioCtx.audioWorklet.addModule("worklets/capture_processor.js");
			const captureNode = new AudioWorkletNode(audioCtx, "capture");
			const oscNode = audioCtx.createOscillator();
			const gainNode = audioCtx.createGain();
			gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
			oscNode.frequency.setValueAtTime(500, audioCtx.currentTime);

			oscNode.connect(gainNode);
			gainNode.connect(captureNode);
			captureNode.connect(audioCtx.destination);

			oscNode.start();
			audioCtx.resume();
			set({ oscNode, audioCtx, captureNode });
		},
		record: () => {
			const captureNode = get().captureNode;
			if (captureNode) {
				captureNode.port.postMessage("rec");
			}
		},
		playNote: () => {
			const captureNode = get().captureNode;
			if (captureNode) {
				captureNode.port.postMessage("play");
			}
		},
		stopNote: () => {
			const captureNode = get().captureNode;
			if (captureNode) {
				captureNode.port.postMessage("stop");
			}
		},
	};
});
