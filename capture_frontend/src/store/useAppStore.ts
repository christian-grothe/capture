import { create } from "zustand";
import { Message } from "../types/types";

interface UseAppStore {
  audioCtx: AudioContext | undefined;
  captureNode: AudioWorkletNode | undefined;
  sourceNode: MediaStreamAudioSourceNode | undefined;
  inputAnalyserNode: AnalyserNode | undefined;
  outputAnalyserNode: AnalyserNode | undefined;
  audioBufferSize: number;
  bufferToDraw: Array<number>;
  init: (data: Message) => void;
  sendMessage: (data: Message) => void;
}

export const useAppStore = create<UseAppStore>((set, get) => {
  return {
    audioCtx: undefined,
    captureNode: undefined,
    sourceNode: undefined,
    inputAnalyserNode: undefined,
    outputAnalyserNode: undefined,
    bufferToDraw: [],
    audioBufferSize: 0,
    init: async (data: Message) => {
      if (get().audioCtx) return;
      const audioCtx = new AudioContext();
      set({ audioCtx });

      await audioCtx.audioWorklet.addModule("worklets/capture_processor.js");
      const captureNode = new AudioWorkletNode(audioCtx, "capture", {
        numberOfInputs: 1,
        outputChannelCount: [2],
      });

      const constraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 2,
        },
        video: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      const sourceNode = audioCtx.createMediaStreamSource(stream);

      const inputAnalyserNode = audioCtx.createAnalyser();
      const outputAnalyserNode = audioCtx.createAnalyser();

      sourceNode.connect(captureNode);
      captureNode.connect(audioCtx.destination);

      sourceNode.connect(inputAnalyserNode);
      captureNode.connect(outputAnalyserNode);

      audioCtx.resume();

      captureNode.port.postMessage(data);
      set({ captureNode, sourceNode, inputAnalyserNode, outputAnalyserNode });
    },
    sendMessage: async (data: Message) => {
      const captureNode = get().captureNode;
      if (!captureNode) {
        get().init(data);
      } else {
        captureNode.port.postMessage(data);
      }
    },
  };
});
