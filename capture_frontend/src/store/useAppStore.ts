import { create } from "zustand";

interface UseAppStore{
    number:number
    audioCtx: AudioContext | undefined;
    captureNode: AudioWorkletNode | undefined;
    oscNode: OscillatorNode | undefined;
    isInit: boolean;
    init: ()=>void;
}

export const useAppStore = create<UseAppStore>((set, get)=>{
    return{
        number: 10,
        audioCtx: undefined,
        captureNode: undefined,
        oscNode: undefined,
        isInit: false,
        init: async ()=>{
            if(get().isInit) return;
            console.log("init");
            
            const audioCtx = new AudioContext;
            await audioCtx.audioWorklet.addModule("worklets/capture_processor.js")
            const captureNode = new AudioWorkletNode(audioCtx, "capture");
            const oscNode = audioCtx.createOscillator();
            oscNode.connect(captureNode);
            captureNode.connect(audioCtx.destination);
            
            set({oscNode, audioCtx, captureNode, isInit:true});
        }
    }
})