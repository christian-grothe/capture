#pragma once
#include "Envelope.h"
#include "Synth.h"
#include "effects/delay.h"
#include "modulation/modulationMixer.h"
#include "modulation/modulator.h"

class Capture {
public:
  void init(int totalChannelNum, int bufferSize, float sampleRate_);
  void render(const float *readPtr, float **writePtrs, int numSamples);

  void startPlaying(uint8_t midiNote);
  void stopPlaying(uint8_t midiNote);

  void setGrainLength(float grainLength_, uint8_t bufIndex);
  void setPlaySpeed(float playSpeed_, uint8_t bufIndex);
  void setDensity(float density_, uint8_t bufIndex);
  void setSpray(float sprayFactor_, uint8_t bufIndex);
  void setSpread(float spreadFactor_, uint8_t bufIndex);

  void setDelaytime(float delaytime);
  void setDelayFeedback(float feedback);
  void setDelayInterpolationTime(float interpolationTime);
  void setDelayInputGain(float inputGain);
  void setDelayOutputGain(float outputGain);

  void record(uint8_t bufIndex);

  void setModulationType(uint8_t index, Modulator::ModulationType newType);
  void setModulationFreq(uint8_t index, Modulator::ModulationType newFreq);

  static constexpr int SYNTH_NUM = 4;
  Synth synths[SYNTH_NUM];
  Delay delay;
  ModulationMixer modMixer;
};
