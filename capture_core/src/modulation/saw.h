#pragma once

class Saw {
public:
  float nextSample() {

    phase += inc;
    if (phase > 1.0f) {
      phase = 0.0f;
    }
    return phase;
  }

  void setInc(float inc_) { inc = inc_; }

private:
  float phase{0.0f};
  float inc;
};
