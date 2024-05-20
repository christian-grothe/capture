import { create } from "zustand";
import { Commands, ModCommands } from "../types/types";

interface UseAppStore {
  audioCtx: AudioContext | undefined;
  captureNode: AudioWorkletNode | undefined;
  sourceNode: MediaStreamAudioSourceNode | undefined;
  audioBufferSize: number;
  bufferToDraw: Array<number>;
  init: () => void;
  sendMessage: (cmd: Commands | ModCommands, val?: any) => void;
}

export const useAppStore = create<UseAppStore>((set, get) => {
  return {
    audioCtx: undefined,
    captureNode: undefined,
    sourceNode: undefined,
    bufferToDraw: [],
    audioBufferSize: 0,
    init: async () => {
      if (get().audioCtx) return;
      console.log("init");
      const audioCtx = new AudioContext();
      set({ audioCtx });

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

      set({ captureNode, sourceNode });
    },
    sendMessage: (cmd: Commands | ModCommands, val?: any) => {
      const captureNode = get().captureNode;
      if (!captureNode) {
        get().init();
      } else {
        captureNode.port.postMessage({ cmd, val });
      }
    },
  };
});
