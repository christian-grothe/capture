/*
  ==============================================================================

    GrainB.h
    Created: 7 Jan 2024 8:14:20pm
    Author:  christiangrothe

  ==============================================================================
*/

#pragma once
#include <math.h>
#include "modulation/grainEnv.h"
#include "AudioBuffer.h"
#include "Utils.h"

class Grain
{
public:
  void init(AudioBuffer *loopBuffer_, float sampleRate_)
  {
    loopBuffer = loopBuffer_;
    sampleRate = sampleRate_;
  }

  Utils::Signal getValues()
  {
    Utils::Signal output;
    if (active)
    {
      float envelope = grainEnv.nextSample();
      phasor += phasorInc;
      if ((phasor >= 1.0f && !isReverse) || (phasor <= 0.0f && isReverse))
      {
        active = false;
        grainEnv.reset();
      }

      float panMultiplierLeft = std::max(0.0f, 1.0f - pos);
      float panMultiplierRight = std::max(0.0f, 1.0f + pos);

      float sample = getNextSample();
      output.left = sample * envelope * panMultiplierLeft;
      output.right = sample * envelope * panMultiplierRight;
    }

    return output;
  }

  void setGrainLength(float grainLength_, float pitch_)
  {
    grainLength = sampleRate * (grainLength_ / 1000.0f);
    phasorInc = (1 / grainLength) * pitch_;
    grainEnv.inc = phasorInc;
    grainEnv.reset();
  }

  void activateGrain(float playHead, float grainLength, float pos_ = 0.0f, float pitch = 1.0f, bool isReverse_ = false)
  {
    active = true;
    pos = pos_;
    offset = playHead;
    phasor = isReverse ? 1.0f : 0.0f;
    isReverse = isReverse_;
    setGrainLength(grainLength, isReverse ? -pitch : pitch);
  }

  bool isActive()
  {
    return active;
  }

private:
  AudioBuffer *loopBuffer;
  GrainEnv grainEnv;
  float sampleRate;
  float phasor{0.0f};
  float phasorInc;
  float grainLength;
  float pitch{1.0f};
  float offset{0.0f};
  float pos{0};
  bool active{false};
  bool isReverse;

  float getNextSample()
  {
    if (!active)
    {
      return 0.0f;
    }

    int loopBufferLength = loopBuffer->getNumSamples();
    const float *loopBufferData = loopBuffer->getReadPtr();

    float sampleOffset = (loopBufferLength - grainLength) * offset;

    float index = phasor * (grainLength - 1);
    index += sampleOffset;
    auto sample = Utils::cubicHermiteSpline(loopBufferData, index, loopBufferLength);

    return sample;
  }
};