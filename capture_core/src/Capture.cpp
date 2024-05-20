#include "Capture.h"
#include <iostream>

// Granular Setters
void Capture::setGrainLength(float grainLength_, int bufIndex) {
  synths[bufIndex].setGrainLength(grainLength_);
}

void Capture::setPlaySpeed(float playSpeed_, int bufIndex) {
  synths[bufIndex].setPlaySpeed(playSpeed_);
}

void Capture::setDensity(float density_, int bufIndex) {
  synths[bufIndex].setDensity(density_);
}

void Capture::setSpray(float sprayFactor_, int bufIndex) {
  synths[bufIndex].setSpray(sprayFactor_);
}

void Capture::setSpread(float spreadFactor_, int bufIndex) {
  synths[bufIndex].setSpread(spreadFactor_);
}

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

void Capture::record(int bufIndex) { synths[bufIndex].record(); }

void Capture::render(const float *readPtr, float **writePtrs, int numSamples) {
  for (int sample = 0; sample < numSamples; sample++) {
    modMixer.update();

    Utils::Signal output;

    output.left = 0.0f;
    output.right = 0.0f;

    for (int synth = 0; synth < SYNTH_NUM; synth++) {
      Synth currentSynth = synths[synth];
      if (currentSynth.isRecording) {
        const auto writePtr = currentSynth.loopBuffer.getWritePtr();
        writePtr[currentSynth.writePos] = readPtr[sample];
        currentSynth.writePos++;
        if (currentSynth.writePos >= currentSynth.loopBuffer.getNumSamples()) {
          currentSynth.writePos = 0;
          currentSynth.isRecording = false;
        }
      }
      output += currentSynth.render();
    }

    output *= 0.5;
    output += delay.render(output);

    /* writePtrs[0][sample] += output.left; */
    /* writePtrs[1][sample] += output.right; */
  }
}
