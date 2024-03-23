/*
  ==============================================================================

    grainEnv.h
    Created: 2 Mar 2024 8:12:40pm
    Author:  christiangrothe

  ==============================================================================
*/

#pragma once
#include <math.h>
#include "sine.h"

class GrainEnv : public Sine
{
public:
  void reset() override
  {
    phase = 0.0;
    sin0 = std::sin(phase * Utils::PI);
    sin1 = std::sin((phase - inc) * Utils::PI);
    dsin = 2.0 * std::cos(inc * Utils::PI);
  }
};