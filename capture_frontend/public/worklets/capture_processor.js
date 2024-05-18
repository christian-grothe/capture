import Module from "./capture.wasm.js";
import HeapAudioBuffer from "./AudioHeap.js";

const NUM_FRAMES = 128;
export class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._synth = new Module.Synth();
    this.sampleRate = sampleRate;
    this.audioBufferSizeSec = 10;
    this.audioBufferSize = this.audioBufferSizeSec * sampleRate;
    this._heapInputBuffer = new HeapAudioBuffer(Module, NUM_FRAMES, 1, 1);
    this._heapOutputBuffer = new HeapAudioBuffer(Module, NUM_FRAMES, 2, 2);
    this.port.onmessage = this.handleMessage.bind(this);
    this.bufferToDrawSize = 128;
    this.currentSampleSum = 0;
    this.currentIndex = 0;
    this.currentSample = 0;
    this.samplesPerBar = Math.floor(
      this.audioBufferSize / this.bufferToDrawSize,
    );
    this.bufferToDraw = new Float32Array(this.bufferToDrawSize).fill(0);
    this._synth.init(2, this.audioBufferSize, sampleRate);
  }

  process(inputs, outputs) {
    const input = inputs[0][0];
    const output = outputs[0];
    const outputChannelCount = output.length;

    if (input) {
      this._heapInputBuffer.getChannelData(0).set(input);
    }

    if (this._synth.isRecording) {
      for (let i = 0; i < input.length; i++) {
        this.currentSampleSum += Math.abs(input[i]);
        this.currentSample++;
        if (this.currentSample >= this.samplesPerBar) {
          const average = this.currentSampleSum / this.samplesPerBar;
          this.bufferToDraw[this.currentIndex] = average;
          this.currentIndex++;
          this.currentSampleSum = 0;
          this.currentSample = 0;
          this.port.postMessage({
            cmd: "audioData",
            val: average,
            index: this.currentIndex,
          });
        }
      }
    } else {
      this.currentSampleSum = 0;
      this.currentIndex = 0;
      this.currentSample = 0;
    }

    this._synth.render(
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
        this._synth.record();
        break;
      case "playNote":
        this._synth.startPlaying(event.data.val);
        break;
      case "stopNote":
        this._synth.stopPlaying(event.data.val);
        break;
      case "setGrainLength":
        this._synth.setGrainLength(event.data.val);
        break;
      case "setDensity":
        this._synth.setDensity(event.data.val);
        break;
      case "setPlaySpeed":
        this._synth.setPlaySpeed(event.data.val);
        break;
      case "setSpray":
        this._synth.setSpray(event.data.val);
        break;
      case "setSpread":
        this._synth.setSpread(event.data.val);
        break;
      case "setDelaytime":
        this._synth.setDelaytime(event.data.val);
        break;
      case "setDelayFeedback":
        this._synth.setDelayFeedback(event.data.val);
        break;
      case "setInterpolationTime":
        this._synth.setInterpolationTime(event.data.val);
        break;
      case "setDelayInputGain":
        this._synth.setDelayInputGain(event.data.val);
        break;
      case "setDelayOutputGain":
        this._synth.setDelayOutputGain(event.data.val);
        break;
      case "setMixDepth":
        this._synth.setMixDepth(
          event.data.val.mixIndex,
          event.data.val.modIndex,
          event.data.val.depth,
        );
        break;
      case "grainLengthModDepth":
      case "grainDenseModDepth":
      case "playSpeedModDepth":
      case "delayTimeModDepth":
      case "delayLazynessModDepth":
      case "delayInputModDepth":
      case "grainLengthModIndex":
      case "grainDenseModIndex":
      case "playSpeedModIndex":
      case "delayTimeModIndex":
      case "delayLazynessModIndex":
      case "delayInputModIndex":
        this._synth[event.data.cmd] = event.data.val;
        break;
      case "lfoRate":
        this._synth.setModFreq(event.data.val.index, event.data.val.val);
        break;
      case "setWaveform":
        this._synth.setModType(event.data.val.index, event.data.val.waveform);
        break;
      default:
        console.log(event.data);
        break;
    }
  }
}

registerProcessor("capture", CaptureProcessor);
