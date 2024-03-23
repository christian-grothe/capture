import Module from "./capture.wasm.js"
import HeapAudioBuffer from "./AudioHeap.js"

const NUM_FRAMES = 128;
class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._synth = new Module.Synth();    
    this._wasmHeapBufferIn = new HeapAudioBuffer(Module,NUM_FRAMES,1,1);
    this._wasmHeapBufferOut = new HeapAudioBuffer(Module,NUM_FRAMES,1,1);
    this._synth.init(1 , 5 * 48000, 48000);
    this.port.onmessage = this.handleMessage.bind(this);
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
   
    const channelCount = input.length;
    
    this._wasmHeapBufferIn.adaptChannel(channelCount);
    this._wasmHeapBufferOut.adaptChannel(channelCount);

    for (let channel = 0; channel < channelCount; ++channel) {
      this._wasmHeapBufferIn.getChannelData(channel).set(input[channel]);
    }

    this._synth.render(
      this._wasmHeapBufferIn.getHeapAddress(),
      this._wasmHeapBufferOut.getHeapAddress(),
      NUM_FRAMES);
      
    for (let channel = 0; channel < channelCount; ++channel) {
       output[channel].set(this._wasmHeapBufferOut.getChannelData(channel));
     }
  }

 handleMessage(event){
  switch (event.data) {
    case "rec":
      this._synth.record()
      break;
    case "play":
      this._synth.startPlaying(60);
      break;
    case "stop":
      this._synth.stopPlaying(60);
      break;
    default: 
      break;
  }
 } 
}

registerProcessor('capture', CaptureProcessor);