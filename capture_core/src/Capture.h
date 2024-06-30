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

  void setAttack(float attack);
  void setRelease(float release);

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
  void setDelayColor(float color);

  void setDelayInputGainModDepth(float delayInputModDepth);
  void setDelayOutputGainModDepth(float delayOutputModDepth);
  void setDelaytimeModDepth(float delaytimeModDepth);
  void setDelayInputGainModIndex(int delayInputModIndex);
  void setDelayOutputGainModIndex(int delayOutputModIndex);
  void setDelaytimeModIndex(int delaytimeModIndex);

  void setGrainLengthModDepth(float grainLengthModDepth, int index);
  void setGrainDenseModDepth(float densityModDepth, int index);
  void setPlaySpeedModDepth(float playSpeedModDepth, int index);
  void setGainModDepth(float gainModDepth, int index);

  void setGrainLengthModIndex(float grainLengthModIndex, int index);
  void setGrainDenseModIndex(float densityModIndex, int index);
  void setPlaySpeedModIndex(float playSpeedModIndex, int index);
  void setGainModIndex(float gainModIndex, int index);

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
