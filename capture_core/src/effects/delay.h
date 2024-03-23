/*
  ==============================================================================

    delay.h
    Created: 8 Mar 2024 10:53:10am
    Author:  christiangrothe

  ==============================================================================
*/

#pragma once
#include <vector>
#include "../Utils.h"

class Synth;

class Delay
{
public:
  void init(Synth *synth_);

  Utils::Signal nextSample();
  Utils::Signal render(Utils::Signal input);

  void write(Utils::Signal input);
  void setSize(int bufferSize_, float sampleRate_);
  void setFeedback(float feedback_);
  void setDelaytime(float delaytime_);
  void setInputGain(float inputGain_);
  void setOutputGain(float outputGain_);
  void setInterpolationTime(float interpolationTime_);

private:
  int writePos{0};
  int readPos{0};
  int newReadPos{0};
  float interpolationTime{0.001f};
  int bufferSize;
  float sampleRate;

  Synth *synth;

  float delaytime{0.5f};
  float targetDelaytime{0.5f};

  float feedback{0.99f};
  float inputGain{1.0f};
  float outputGain{1.0f};

  std::vector<float> bufferL;
  std::vector<float> bufferR;
};