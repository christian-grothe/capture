#include "Capture.h"

// Granular Setters
void Capture::setGrainLength(float grainLength_, int index) {
  synths[index].setGrainLength(grainLength_);
}

void Capture::setPlaySpeed(float playSpeed_, int index) {
  synths[index].setPlaySpeed(playSpeed_);
}

void Capture::setDensity(float density_, int index) {
  synths[index].setDensity(density_);
}

void Capture::setSpray(float sprayFactor_, int index) {
  synths[index].setSpray(sprayFactor_);
}

void Capture::setSpread(float spreadFactor_, int index) {
  synths[index].setSpread(spreadFactor_);
}

void Capture::setLoopStart(float loopStart, int index) {
  synths[index].setLoopStart(loopStart);
}

void Capture::setLoopLength(float loopLength, int index) {
  synths[index].setLoopLength(loopLength);
}

void Capture::setGain(float gain_, int index) { synths[index].setGain(gain_); }

// Delay Setters
void Capture::setDelaytime(float delaytime) { delay.setDelaytime(delaytime); }

void Capture::setDelayFeedback(float feedback) { delay.setFeedback(feedback); }

void Capture::setDelayInterpolationTime(float interpolationTime) {
  delay.setInterpolationTime(interpolationTime);
}

void Capture::setDelayInputGain(float inputGain) {
  delay.setInputGain(inputGain);
}

void Capture::setDelayOutputGain(float outputGain) {
  delay.setOutputGain(outputGain);
}

// Modulation Setters
void Capture::setGrainLengthModDepth(float grainLengthModDepth,
                                     int synthIndex) {
  synths[synthIndex].grainLengthModDepth = grainLengthModDepth;
}
void Capture::setGrainDenseModDepth(float grainDensModDepth, int synthIndex) {
  synths[synthIndex].grainDenseModDepth = grainDensModDepth;
}
void Capture::setPlaySpeedModDepth(float playSpeedModDepth, int synthIndex) {
  synths[synthIndex].playSpeedModDepth = playSpeedModDepth;
}
void Capture::setGainModDepth(float gainModDepth, int synthIndex) {
  synths[synthIndex].gainModDepth = gainModDepth;
}
void Capture::setDelayTimeModDepth(float delayTimeModDepth) {
  delay.delayTimeModDepth = delayTimeModDepth;
}
void Capture::setDelayLazynessModDepth(float delayLazynessModDepth) {}
void Capture::setDelayInputModDepth(float delayInputModDepth) {
  delay.delayInputModDepth = delayInputModDepth;
}

void Capture::setGrainLengthModindex(float grainLengthModIndex,
                                     int synthIndex) {
  synths[synthIndex].grainLengthModIndex = grainLengthModIndex;
}
void Capture::setGrainDenseModIndex(float grainDensModIndex, int synthIndex) {
  synths[synthIndex].grainDenseModIndex = grainDensModIndex
}
void Capture::setPlaySpeedModIndex(float playSpeedModIndex, int synthIndex) {
  synths[synthIndex].playSpeedModDepth = playSpeedModIndex;
}
void Capture::setGainModIndex(float gainModIndex, int synthIndex) {
  synths[synthIndex].gainModIndex = gainModIndex;
}
void Capture::setDelayTimeModIndex(float delayTimeModIndex) {
  delay.delayTimeModIndex = delayTimeModIndex;
}
void Capture::setDelayLazynessModIndex(float delayLazynessModIndex) {}
void Capture::setDelayInputModIndex(float delayInputModIndex) {
  delay.delayInputModIndex = delayInputModIndex;
}

void Capture::init(int totalChannelNum, int bufferSize, float sampleRate_) {
  delay.init(&modMixer);
  delay.setSize(bufferSize, sampleRate_);
  modMixer.init(sampleRate_);
  for (int synth = 0; synth < SYNTH_NUM; synth++) {
    synths[synth].init(totalChannelNum, bufferSize, sampleRate_, &modMixer);
  }
}

void Capture::startPlaying(int midiNote) {
  for (int synth = 0; synth < SYNTH_NUM; synth++) {
    synths[synth].startPlaying(midiNote);
  }
}

void Capture::stopPlaying(int midiNote) {
  for (int synth = 0; synth < SYNTH_NUM; synth++) {
    synths[synth].stopPlaying(midiNote);
  }
}

void Capture::record(int index) { synths[index].record(); }

bool Capture::isRecording(int index) { return synths[index].isRecording; }

void Capture::render(const float *readPtr, float **writePtrs, int numSamples) {

  for (int sample = 0; sample < numSamples; sample++) {
    modMixer.update();

    Utils::Signal output;

    output.left = 0.0f;
    output.right = 0.0f;

    writePtrs[0][sample] = 0.0f;
    writePtrs[1][sample] = 0.0f;

    for (int synth = 0; synth < SYNTH_NUM; synth++) {
      output += synths[synth].render(readPtr[sample]);
    }

    output *= 0.5;
    // output += delay.render(output);

    writePtrs[0][sample] += output.left;
    writePtrs[1][sample] += output.right;
  }
}
