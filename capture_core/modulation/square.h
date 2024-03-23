/*
  ==============================================================================

    square.h
    Created: 2 Mar 2024 11:06:02pm
    Author:  christiangrothe

  ==============================================================================
*/

#pragma once

class Square
{
public:
  float nextSample()
  {
    phase += inc;
    if (phase > 1.0f)
    {
      phase = 0.0f;
    }

    return phase > duty ? 1.0f : 0.0f;
  }

  void setInc(float inc_)
  {
    inc = inc_;
  }

  void setDuty(float duty_)
  {
    duty = duty_;
  }

private:
  float phase{0.0f};
  float duty{0.5f};
  float inc;
};