#include "Synth.h"
#include "Utils.h"
#include <cstdint>

// Parameter Setters
void Synth::setPlayHead(float playHead) {
  for (int voice = 0; voice < VOICE_NUM; voice++) {
    voices[voice].playHead = playHead;
  }
}
void Synth::setAttack(float attack) {
  for (int voice = 0; voice < VOICE_NUM; voice++) {
    voices[voice].setAttack(attack);
  }
}
void Synth::setRelease(float release) {
  for (int voice = 0; voice < VOICE_NUM; voice++) {
    voices[voice].setRelease(release);
  }
}
void Synth::setGrainLength(float grainLength) {
  for (int voice = 0; voice < VOICE_NUM; voice++) {
    voices[voice].grainLength = grainLength * 1000.0f;
  }
}
void Synth::setDensity(float rate) {
  for (int voice = 0; voice < VOICE_NUM; voice++) {
    voices[voice].setGrainTriggerRate(rate * 1000.0f);
  }
}
void Synth::setPlaySpeed(float playSpeed) {
  for (int voice = 0; voice < VOICE_NUM; voice++) {
    voices[voice].setPlaySpeed(playSpeed);
  }
}
void Synth::setSpray(float sprayfactor) {
  for (int voice = 0; voice < VOICE_NUM; voice++) {
    voices[voice].sprayFactor = sprayfactor;
  }
}

void Synth::setSpread(float spreadFactor) {
  for (int voice = 0; voice < VOICE_NUM; voice++) {
    voices[voice].spreadFactor = spreadFactor;
  }
}

void Synth::setLoopStart(double loopStart) {
  for (int voice = 0; voice < VOICE_NUM; voice++) {
    voices[voice].loopStart = loopStart;
  }
}

void Synth::setLoopLength(double loopLength) {
  for (int voice = 0; voice < VOICE_NUM; voice++) {
    voices[voice].loopLength = loopLength;
  }
}

void Synth::setDelayFeedback(float feedback) { delay.setFeedback(feedback); }

void Synth::setDelaytime(float delaytime) { delay.setDelaytime(delaytime); }

void Synth::setInterpolationTime(float character) {
  delay.setInterpolationTime(character);
}

void Synth::setDelayInputGain(float inputGain) {
  delay.setInputGain(inputGain);
}

void Synth::setDelayOutputGain(float outputGain) {
  delay.setOutputGain(outputGain);
}

// Modulation Setters
void Synth::setModulation(float &depthDestiny, float newDepth,
                          uint8_t &indexDestinty, uint8_t newIndex) {
  depthDestiny = newDepth;
  indexDestinty = newIndex;
}
void Synth::setModulation(float &depthDestiny, float newDepth) {
  depthDestiny = newDepth;
}
void Synth::setModulation(uint8_t &indexDestinty, uint8_t newIndex) {
  indexDestinty = newIndex;
}
void Synth::setModulationType(uint8_t index,
                              Modulator::ModulationType newType) {
  modMixer.mods[index].setModulationType(newType);
}
void Synth::setModulationFreq(uint8_t index, float newFreq) {
  modMixer.mods[index].setFreq(newFreq);
}
void Synth::record() { isRecording = true; }

void Synth::render(const float *readPtr, float **writePtrs, int numSamples) {

  int loopBufferSize = loopBuffer.getNumSamples();
  float *loopWritePtr = loopBuffer.getWritePtr();

  for (int sample = 0; sample < numSamples; sample++) {
    modMixer.update();
    Utils::Signal output;

    if (isRecording) {
      loopWritePtr[writePos] = readPtr[sample];
      writePos++;

      if (writePos > loopBufferSize) {
        writePos = 0;
        isRecording = false;
      }
    }

    writePtrs[0][sample] = 0.0f;
    writePtrs[1][sample] = 0.0f;

    for (int voice = 0; voice < VOICE_NUM; voice++) {
      if (voices[voice].getIsPlaying()) {
        output += voices[voice].render();
      }
    }

    output *= 0.25;
    output += delay.render(output);

    writePtrs[0][sample] += output.left;
    writePtrs[1][sample] += output.right;
  }
}

void Synth::init(int totalChannelNum, int bufferSize, float sampleRate_) {
  loopBuffer.setSize(bufferSize);
  delay.setSize(sampleRate_ * 1, sampleRate_);
  writePos = 0.0f;
  playbackDir = PlaybackDir::Normal;
  grainDir = PlaybackDir::Normal;

  for (int voice = 0; voice < VOICE_NUM; voice++) {
    voices[voice].init(totalChannelNum, bufferSize, sampleRate_, this);
  }

  modMixer.init(sampleRate_);
  delay.init(this);
}

void Synth::startPlaying(uint8_t midiNote) {
  for (int voice = 0; voice < VOICE_NUM; voice++) {
    if (!voices[voice].getIsPlaying()) {
      voices[voice].startPlaying(midiNote);
      break;
    }
  }
}
void Synth::stopPlaying(uint8_t midiNote) {
  for (int voice = 0; voice < VOICE_NUM; voice++) {
    if (voices[voice].note == midiNote) {
      voices[voice].stopPlaying();
    }
  }
}
void Synth::handleMidi(uint8_t data1, uint8_t data2, uint8_t data3) {
  switch (data1) {
  case MidiCommands::NoteOn: {
    startPlaying(data2);
    break;
  }

  case MidiCommands::NoteOff: {
    stopPlaying(data2);
    break;
  }

  case MidiCommands::CC:
    handleMidiCc(data2, data3);
    // DBG(data2 << " " << data3);
    break;

  default:
    // DBG("other message " << data1 << " " << data2 << " " << data3);
    break;
  }
}

void Synth::handleMidiCc(uint8_t cc, uint8_t val) {
  switch (cc) {
  case MidiCommands::startRecording:
    if (val > 50) {
      isRecording = true;
    }
    break;

  default:
    break;
  }
}
