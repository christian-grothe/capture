import Module from "./capture.wasm.js";
import HeapAudioBuffer from "./AudioHeap.js";

const NUM_FRAMES = 128;

class BufferToDraw {
  constructor(bufIndex, bufferSize, samplesPerBar, processor) {
    this.bufIndex = bufIndex;
    this.buffer = new Float32Array(bufferSize).fill(0);
    this.currentSampleSum = 0;
    this.currentIndex = 0;
    this.currentSample = 0;
    this.samplesPerBar = samplesPerBar;
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
      new BufferToDraw(0, 256, (10 * sampleRate) / 256, this),
      new BufferToDraw(1, 256, (10 * sampleRate) / 256, this),
      new BufferToDraw(2, 256, (10 * sampleRate) / 256, this),
      new BufferToDraw(3, 256, (10 * sampleRate) / 256, this),
    ];
    this._capture.init(2, this.audioBufferSize, sampleRate);
  }

  isRecording() {
    for (let i = 0; i < 4; i++) {
      if (this._capture.isRecording(i)) {
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

    for (let i = 0; i < input.length; i++) {
      const currentSample = Math.abs(input[i]);
      for (let i = 0; i < this.buffersToDraw.length; i++) {
        if (this._capture.isRecording(i)) {
          this.buffersToDraw[i].addSample(currentSample);
        } else {
          this.buffersToDraw[i].reset();
        }
      }
    }

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
      case "playNote":
        this._capture.startPlaying(event.data.val);
        break;
      case "stopNote":
        this._capture.stopPlaying(event.data.val);
        break;
      default:
        console.log(event.data);
        break;
    }
  }
}

registerProcessor("capture", CaptureProcessor);
