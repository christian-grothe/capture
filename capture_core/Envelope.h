/*
  ==============================================================================

    Envelope.h
    Created: 4 Jan 2024 8:42:56am
    Author:  christiangrothe

  ==============================================================================
*/

#pragma once
#include <math.h>
#include <functional>

class Envelope
{

public:
  const float SILENCE{0.00011f};
  float level{SILENCE};

  enum EnvState
  {
    Attack,
    Release,
    Hold
  };

  EnvState state = EnvState::Attack;

  void reset()
  {
    level = SILENCE;
  }

  void attack()
  {
    state = EnvState::Attack;
  }

  void release()
  {
    state = EnvState::Release;
  }

  void setAttackMultiplier(float attackAmount)
  {

    float attackSamples = maxSamples * attackAmount;
    attackMultiplier = std::exp(std::log(SILENCE) / attackSamples);
  }

  void setReleaseMultiploer(float releaseAmount)
  {
    float releaseSamples = maxSamples * releaseAmount;
    releaseMultiplier = std::exp(std::log(SILENCE) / releaseSamples);
  }

  float nextValue()
  {
    if (state == EnvState::Release)
    {
      level *= releaseMultiplier;
      if (level <= SILENCE)
      {
        onEnded();
        state = EnvState::Hold;
      }
    }
    else if (state == EnvState::Attack)
    {
      if (level >= 1.0f - SILENCE)
      {
        state = EnvState::Hold;
      }
      level = attackMultiplier * (level - 1.0f) + 1.0f;
    }
    return level;
  }

  void init(float sampleRate, float initAttRel, std::function<void()> onEndedCb)
  {
    maxSamples = MAX_TIME * sampleRate;
    setAttackMultiplier(initAttRel);
    setReleaseMultiploer(initAttRel);
    onEnded = onEndedCb;
  }

private:
  const int MAX_TIME{20};
  float maxSamples;
  std::function<void()> onEnded = []() {};
  float attackMultiplier;
  float releaseMultiplier;
};