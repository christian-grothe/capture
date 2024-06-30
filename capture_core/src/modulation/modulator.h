#pragma once
#include "noise.h"
#include "saw.h"
#include "sine.h"
#include "square.h"
#include <cstdint>
#include <iostream>

class Modulator {
public:
  enum class ModulationType { Sine, Saw, Noise, Square };

  void init(int sampleRate_) {
    modulationType = ModulationType::Sine;
    sampleRate = sampleRate_;
    float inc = (1.0f / sampleRate) * 1.0;
    saw.setInc(inc);
    noise.setInc(inc);
    square.setInc(inc);
    sine.setInc(inc);
  }

  void setFreq(float freq) {
    float inc = (1.0f / sampleRate) * freq;
    saw.setInc(inc);
    noise.setInc(inc);
    square.setInc(inc);
    sine.setInc(inc);
  }

  void setModulationType(ModulationType newType) { modulationType = newType; }

  void nextSample() {
    float nextSample = 0.0f;
    switch (modulationType) {
    case ModulationType::Sine:
      nextSample = (sine.nextSample() + 1.0f) * 0.5f;
      break;

    case ModulationType::Saw:
      nextSample = saw.nextSample();
      break;

    case ModulationType::Noise:
      nextSample = noise.nextSample();
      break;

    case ModulationType::Square:
      nextSample = square.nextSample();
      break;
    }
    currentSample = nextSample;
  }

  const float getCurrentSample(const float depth, float offset = 1.0f) {  
    return (currentSample * depth);
  }
  float currentSample;

private:
  int sampleRate;
  ModulationType modulationType;
  SampleAndHold noise;
  Saw saw;
  Sine sine;
  Square square;
};
