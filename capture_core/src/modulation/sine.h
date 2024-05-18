#pragma once
#include "../Utils.h"
#include <cmath>

class Sine {
public:
  double inc;
  double phase;

  virtual void reset() {
    phase = 0.0;
    sin0 = std::sin(phase * Utils::TWO_PI);
    sin1 = std::sin((phase - inc) * Utils::TWO_PI);
    dsin = 2.0 * std::cos(inc * Utils::TWO_PI);
  }

  void setInc(double inc_) {
    inc = inc_;
    reset();
  }

  double nextSample() {
    double sinx = dsin * sin0 - sin1;
    sin1 = sin0;
    sin0 = sinx;
    return sinx;
  }

  double sin0;
  double sin1;
  double dsin;
};
