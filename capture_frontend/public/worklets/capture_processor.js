import Module from "./capture.wasm.js";
import HeapAudioBuffer from "./AudioHeap.js";

const NUM_FRAMES = 128;

class BufferToDraw {
  constructor(bufIndex, bufferSize, bars, processor) {
    this.bufIndex = bufIndex;
    this.buffer = new Float32Array(bufferSize).fill(0);
    this.currentSampleSum = 0;
    this.currentIndex = 0;
    this.currentSample = 0;
    this.samplesPerBar = Math.floor(bufferSize / bars);
    this.processor = processor;
  }

  addSample(sample) {
    this.currentSampleSum += Math.abs(sample);
    this.currentSample++;
    if (this.currentSample >= this.samplesPerBar) {
      const average = this.currentSampleSum / this.samplesPerBar;
      this.buffer[this.currentIndex] = average;
      this.currentIndex++;
      this.currentSampleSum = 0;
      this.currentSample = 0;
      this.postMessage();
    }
  }

  postMessage() {
    this.processor.port.postMessage({
      cmd: "audioData",
      data: this.buffer,
      bufIndex: this.bufIndex,
    });
  }

  reset() {
    this.currentSampleSum = 0;
    this.currentSample = 0;
    this.currentIndex = 0;
  }
}

export class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._capture = new Module.Capture();
    this.audioBufferSizeSec = 10;
    this.audioBufferSize = this.audioBufferSizeSec * sampleRate;
    this._heapInputBuffer = new HeapAudioBuffer(Module, NUM_FRAMES, 1, 1);
    this._heapOutputBuffer = new HeapAudioBuffer(Module, NUM_FRAMES, 2, 2);
    this.port.onmessage = this.handleMessage.bind(this);
    this.buffersToDraw = [
      new BufferToDraw(0, 128, (10 * sampleRate) / 128, this),
      new BufferToDraw(1, 128, (10 * sampleRate) / 128, this),
      new BufferToDraw(2, 128, (10 * sampleRate) / 128, this),
      new BufferToDraw(3, 128, (10 * sampleRate) / 128, this),
    ];
    this._capture.init(2, this.audioBufferSize, sampleRate);
  }

  isRecording() {
    for (let i = 0; i < this._capture.SYNTH_NUM; i++) {
      if (this._capture.synths[i].isRecording) {
        console.log("Recording", i);
        return true;
      }
    }
    return false;
  }

  process(inputs, outputs) {
    const input = inputs[0][0];
    const output = outputs[0];
    const outputChannelCount = output.length;

    if (input) {
      this._heapInputBuffer.getChannelData(0).set(input);
    }

    // if (this.isRecording()) {
    //   for (let i = 0; i < input.length; i++) {
    //     const currentSample = Math.abs(input[i]);
    //     for (let i = 0; i < this._capture.SYNTH_NUM; i++) {
    //       if (this._capture.synths[i].isRecording) {
    //         this.buffersToDraw[i].addSample(currentSample);
    //       } else {
    //         this.buffersToDraw[i].reset();
    //       }
    //     }
    //   }
    // }

    this._capture.render(
      this._heapInputBuffer.getHeapAddress(),
      this._heapOutputBuffer.getHeapAddress(),
      NUM_FRAMES,
    );

    for (let channel = 0; channel < outputChannelCount; ++channel) {
      output[channel].set(this._heapOutputBuffer.getChannelData(channel));
    }
  }

  handleMessage(event) {
    switch (event.data.cmd) {
      case "rec":
        this._capture.record(event.data.val);
        break;
      default:
        console.log(event.data);
        break;
    }
  }
}

registerProcessor("capture", CaptureProcessor);
