import Module from "./capture.wasm.js";
import HeapAudioBuffer from "./AudioHeap.js";

const NUM_FRAMES = 128;
export class CaptureProcessor extends AudioWorkletProcessor {
	constructor() {
		super();
		this._synth = new Module.Synth();
		this._heapInputBuffer = new HeapAudioBuffer(Module, NUM_FRAMES, 1, 1);
		this._heapOutputBuffer = new HeapAudioBuffer(Module, NUM_FRAMES, 2, 2);
		this._synth.init(2, 1 * 48000, 48000);
		this.port.onmessage = this.handleMessage.bind(this);
	}

	process(inputs, outputs) {
		const input = inputs[0][0];
		const output = outputs[0];
		const outputChannelCount = output.length;

		this._heapInputBuffer.getChannelData(0).set(input);

		this._synth.render(
			this._heapInputBuffer.getHeapAddress(),
			this._heapOutputBuffer.getHeapAddress(),
			NUM_FRAMES
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
			case "play":
				this._synth.startPlaying(event.data.val);
				break;
			case "stop":
				this._synth.stopPlaying(event.data.val);
				break;
			default:
				break;
		}
	}
}

registerProcessor("capture", CaptureProcessor);
