#pragma once
#include "Envelope.h"
#include "Synth.h"
#include "effects/delay.h"
#include "modulation/modulationMixer.h"
#include "modulation/modulator.h"

class Capture {
public:
  void init(int totalChannelNum, int bufferSize, float sampleRate);
  void render(const float *readPtr, float **writePtrs, int numSamples);

  void startPlaying(int midiNote);
  void stopPlaying(int midiNote);

  void setGrainLength(float grainLength, int index);
  void setPlaySpeed(float playSpeed, int index);
  void setDensity(float density, int index);
  void setSpray(float sprayFactor, int index);
  void setSpread(float spreadFactor, int index);

  void setDelaytime(float delaytime);
  void setDelayFeedback(float feedback);
  void setDelayInterpolationTime(float interpolationTime);
  void setDelayInputGain(float inputGain);
  void setDelayOutputGain(float outputGain);

  void setGrainLengthModDepth(float grainLengthModDepth, int index);
  void setGrainDenseModDepth(float densityModDepth, int index);
  void setPlaySpeedModDepth(float playSpeedModDepth, int index);
  void setGainModDepth(float gainModDepth, int index);
  void setDelayTimeModDepth(float delayTimeModDepth);
  void setDelayLazynessModDepth(float delayLazynessModDepth);
  void setDelayInputModDepth(float delayInputModDepth);

  void setGrainLengthModIndex(float grainLengthModIndex, int index);
  void setDenseModIndex(float densityModIndex, int index);
  void setPlaySpeedModIndex(float playSpeedModIndex, int index);
  void setGainModIndex(float gainModIndex, int index);
  void setDelayTimeModIndex(float delayTimeModDepth);
  void setDelayLazynessModIndex(float delayLazynessModIndex);
  void setDelayInputModIndex(float delayInputModIndex);

  void setLoopStart(float loopStart, int index);
  void setLoopLength(float loopLength, int index);

  void setGain(float gain, int index);

  void record(int index);
  bool isRecording(int index);

  void setModulationType(int index, Modulator::ModulationType newType);
  void setModulationFreq(int index, Modulator::ModulationType newFreq);

  static constexpr int SYNTH_NUM = 4;
  Synth synths[SYNTH_NUM];
  Delay delay;
  ModulationMixer modMixer;
};
