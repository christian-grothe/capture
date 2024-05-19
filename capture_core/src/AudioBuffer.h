#pragma once
#include <vector>

class AudioBuffer {
public:
  void setSize(size_t size) { buffer.resize(size); }

  const float *getReadPtr() { return buffer.data(); }

  float *getWritePtr() { return buffer.data(); }

  int getNumSamples() { return buffer.size(); }

  float loopStart{0.0f};
  float loopEnd{1.0f};

private:
  std::vector<float> buffer;
};
