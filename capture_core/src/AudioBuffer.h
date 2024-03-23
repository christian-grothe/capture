/*
  ==============================================================================

    AudioBuffer.h
    Created: 24 Jan 2024 10:00:22pm
    Author:  christiangrothe

  ==============================================================================
*/

#pragma once
#include <vector>

class AudioBuffer
{
public:
  void setSize(size_t size)
  {
    buffer.resize(size);
  }

  const float *getReadPtr()
  {
    return buffer.data();
  }

  float *getWritePtr()
  {
    return buffer.data();
  }

  int getNumSamples()
  {
    return buffer.size();
  }

private:
  std::vector<float> buffer;
};