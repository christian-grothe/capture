#include "Synth.h"
#include <cstdint>

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

void Synth::record() { isRecording = true; }

Utils::Signal Synth::render() {
  Utils::Signal output;

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

/* void Synth::render(const float *readPtr, float **writePtrs, int numSamples) { */

/*   int loopBufferSize = loopBuffer.getNumSamples(); */
/*   float *loopWritePtr = loopBuffer.getWritePtr(); */

/*   for (int sample = 0; sample < numSamples; sample++) { */
/*     modMixer.update(); */
/*     Utils::Signal output; */

/*     if (isRecording) { */
/*       loopWritePtr[writePos] = readPtr[sample]; */
/*       writePos++; */

/*       if (writePos > loopBufferSize) { */
/*         writePos = 0; */
/*         isRecording = false; */
/*       } */
/*     } */

/*     writePtrs[0][sample] = 0.0f; */
/*     writePtrs[1][sample] = 0.0f; */

/*     for (int voice = 0; voice < VOICE_NUM; voice++) { */
/*       if (voices[voice].getIsPlaying()) { */
/*         output += voices[voice].render(); */
/*       } */
/*     } */

/*     output *= 0.25; */
/*     output += delay.render(output); */

/*     writePtrs[0][sample] += output.left; */
/*     writePtrs[1][sample] += output.right; */
/*   } */
/* } */
