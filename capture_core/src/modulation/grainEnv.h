#pragma once
#include "sine.h"
#include <math.h>

class GrainEnv : public Sine {
public:
  void reset() override {
    phase = 0.0;
    sin0 = std::sin(phase * Utils::PI);
    sin1 = std::sin((phase - inc) * Utils::PI);
    dsin = 2.0 * std::cos(inc * Utils::PI);
  }
};
