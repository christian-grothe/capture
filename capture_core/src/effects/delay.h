#pragma once
#include "../Utils.h"
#include <vector>

class ModulationMixer;

struct OnePole {
  float z1{0.0f};
  float alpha{0.45};
  float next(float input) {
    z1 = z1 + alpha * (input - z1);
    return z1;
  }
  void setAlpha(float alpha_) { alpha = alpha_; }
};

class Delay {
public:
  void init(ModulationMixer *modMixer_);

  Utils::Signal nextSample();
  Utils::Signal render(Utils::Signal input);

  OnePole filterL;
  OnePole filterR;

  void write(Utils::Signal input);
  void setSize(int bufferSize_, float sampleRate_);
  void setFeedback(float feedback_);
  void setDelaytime(float delaytime_);
  void setInputGain(float inputGain_);
  void setOutputGain(float outputGain_);
  void setInterpolationTime(float interpolationTime_);
  void setDelayColor(float color_);

  int delayInputModIndex{0};
  int delayTimeModIndex{0};
  int delayOutputModIndex{0};
  float delayInputModDepth{0.0f};
  float delayOutputModDepth{0.0f};
  float delayTimeModDepth{0.0f};

private:
  int writePos{0};
  int readPos{0};
  int newReadPos{0};
  float interpolationTime{0.001f};
  int bufferSize;
  float sampleRate;

  ModulationMixer *modMixer;

  float delaytime{0.5f};
  float targetDelaytime{0.5f};

  float feedback{0.5f};
  float inputGain{0.0f};
  float outputGain{0.0f};

  std::vector<float> bufferL;
  std::vector<float> bufferR;
};
