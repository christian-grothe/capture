#pragma once
#include "modulator.h"
#include <iostream>

class ModulationMixer {

public:
  void init(float sampleRate_) {
    for (int mod = 0; mod < MOD_NUM; mod++) {
      mods[mod].init(sampleRate_);
      for (int mix = 0; mix < MIX_NUM; mix++) {
        setMixDepth(mix, mod, 0.0f);
      }
    }
    mods[0].setModulationType(Modulator::ModulationType::Square);
    mods[1].setModulationType(Modulator::ModulationType::Saw);
    mods[2].setModulationType(Modulator::ModulationType::Square);
    mods[3].setModulationType(Modulator::ModulationType::Sine);
  }

  void update() {
    normalize();
    for (int mod = 0; mod < MOD_NUM; mod++) {
      mods[mod].nextSample();
    }
  }

  float getCurrentSample(uint8_t mixIndex, float depth, float offset = 1.0f) {
    float sample = 0.0f;
    for (int i = 0; i < MOD_NUM; i++) {
      sample += mods[i].getCurrentSample(mixes[mixIndex][i]);
    }
    return (sample * depth) + offset;
  }

  float getModulationIncrement(uint8_t mixIndex, float depth, float current,
                               float max) {
    float sample = getCurrentSample(mixIndex, depth, 0.0f);
    return (max - current) * sample;
  }

  void setMixDepth(int mixIndex, int modIndex, float val) {
    mixes[mixIndex][modIndex] = val;
  }

  void setModFreq(int modIndex, float freq) { mods[modIndex].setFreq(freq); }

  void setModType(int modIndex, Modulator::ModulationType newType) {
    mods[modIndex].setModulationType(newType);
  }

  void normalize() {
    for (int mixIndex = 0; mixIndex < MIX_NUM; mixIndex++) {

      float *currentMix = mixes[mixIndex];
      float sum = 0.0f;
      for (int i = 0; i < MOD_NUM; i++) {
        sum += currentMix[i];
      }
      if (sum > 1.0f) {
        float scaleFactor = 1.0f / sum;
        for (int i = 0; i < MOD_NUM; i++) {
          currentMix[i] *= scaleFactor;
        }
      }
    }
  }

  static constexpr int MIX_NUM = 4;
  static constexpr int MOD_NUM = 4;
  Modulator mods[MOD_NUM];

private:
  float mixes[MIX_NUM][MOD_NUM];
};
