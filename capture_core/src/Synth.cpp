#include "Synth.h"
#include <cstdint>
#include <iostream>

// Parameter Setters
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

void Synth::setLoopStart(float loopStart) {
  for (int voice = 0; voice < VOICE_NUM; voice++) {
    voices[voice].loopStart = loopStart;
  }
}

void Synth::setLoopLength(float loopLength) {
  for (int voice = 0; voice < VOICE_NUM; voice++) {
    voices[voice].loopLength = loopLength;
  }
}

void Synth::setGain(float gain_) { gain = gain_; }

void Synth::record() { isRecording = true; }

Utils::Signal Synth::render(float inputSample) {
  Utils::Signal output;
  if (isRecording) {
    auto writePtr = loopBuffer.getWritePtr();
    writePtr[writePos] = inputSample;
    writePos++;
    if (writePos > loopBuffer.getNumSamples()) {
      std::cout << "FINISH" << std::endl;
      writePos = 0;
      isRecording = false;
    }
  }

  for (int voice = 0; voice < VOICE_NUM; voice++) {
    if (voices[voice].getIsPlaying()) {
      output += voices[voice].render();
    }
  }
  output *= gain;
  return output;
}

void Synth::init(int totalChannelNum, int bufferSize, float sampleRate_,
                 ModulationMixer *modMixer_) {
  writePos = 0.0f;
  playbackDir = PlaybackDir::Normal;
  grainDir = PlaybackDir::Normal;
  loopBuffer.setSize(bufferSize);

  for (int voice = 0; voice < VOICE_NUM; voice++) {
    voices[voice].init(totalChannelNum, bufferSize, sampleRate_, this);
  }
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
