#pragma once
#include "saw.h"

class Noise {
public:
  float nextSample() {
    noiseSeed = noiseSeed * 196314165 + 907633515;
    float temp = int(noiseSeed >> 7) - 16777216;
    temp = temp / 16777215.0f;
    temp = (temp + 1.0f) * 0.5f;
    return temp;
  }

private:
  unsigned int noiseSeed{22222};
};

class SampleAndHold {
public:
  void setInc(float inc_) { inc = inc_; }

  float nextSample() {

    phase += inc;
    if (phase > 1.0f) {
      phase = 0.0f;
      currentSample = noise.nextSample();
    }
    return currentSample;
  }

private:
  Noise noise;
  float currentSample{0.0f};
  float phase{0.0f};
  float inc;
};
