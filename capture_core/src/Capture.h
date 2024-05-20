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

  void startPlaying(int midiNote);
  void stopPlaying(int midiNote);

  void setGrainLength(float grainLength_, int bufIndex);
  void setPlaySpeed(float playSpeed_, int bufIndex);
  void setDensity(float density_, int bufIndex);
  void setSpray(float sprayFactor_, int bufIndex);
  void setSpread(float spreadFactor_, int bufIndex);

  void setDelaytime(float delaytime);
  void setDelayFeedback(float feedback);
  void setDelayInterpolationTime(float interpolationTime);
  void setDelayInputGain(float inputGain);
  void setDelayOutputGain(float outputGain);

  void record(int bufIndex);

  void setModulationType(int index, Modulator::ModulationType newType);
  void setModulationFreq(int index, Modulator::ModulationType newFreq);

  static constexpr int SYNTH_NUM = 4;
  Synth synths[SYNTH_NUM];
  Delay delay;
  ModulationMixer modMixer;
};
