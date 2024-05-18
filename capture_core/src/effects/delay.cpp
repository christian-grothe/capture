#include "delay.h"
#include <vector>
#include <cmath>
#include "../Synth.h"

void Delay::init(Synth *synth_)
{
  synth = synth_;
}

void Delay::setSize(int bufferSize_, float sampleRate_)
{
  bufferSize = bufferSize_;
  bufferL.resize(bufferSize);
  bufferR.resize(bufferSize);
  sampleRate = sampleRate_;
}

Utils::Signal Delay::render(Utils::Signal input)
{
  write(input);
  return nextSample();
}

void Delay::write(Utils::Signal input)
{
  float modInc = synth->modMixer.getModulationIncrement(synth->delayInputModIndex, synth->delayInputModDepth, inputGain, 1.0f);
  bufferL[writePos] = (input.left * (inputGain + modInc)) + (bufferL[readPos] * feedback);
  bufferR[writePos] = (input.right * (inputGain + modInc)) + (bufferR[readPos] * feedback);

  if (++writePos >= bufferSize)
  {
    writePos = 0.0f;
  }
}

Utils::Signal Delay::nextSample()
{
  Utils::Signal output;

  float delayTimeModInc = synth->modMixer.getModulationIncrement(synth->delayTimeModIndex, synth->delayTimeModDepth, targetDelaytime, 1.0f);
  float targetDelayMod = fmod(targetDelaytime + delayTimeModInc, 1.0f);

  if (delaytime != targetDelayMod)
  {
    delaytime = Utils::lerp(delaytime, targetDelayMod, interpolationTime);
  }

  int offset = bufferSize * delaytime;
  readPos = writePos - offset;

  if (readPos < 0.0f)
  {
    readPos += bufferSize;
  }

  float sampleL = Utils::cubicHermiteSpline(bufferL.data(), static_cast<float>(readPos), bufferSize);
  float sampleR = Utils::cubicHermiteSpline(bufferR.data(), static_cast<float>(readPos), bufferSize);

  output.left = sampleL;
  output.right = sampleR;

  output *= outputGain;

  return output;
}

void Delay::setFeedback(float feedback_)
{
  feedback = feedback_;
}

void Delay::setDelaytime(float delaytime_)
{
  targetDelaytime = delaytime_;
}

void Delay::setInputGain(float inputGain_)
{
  inputGain = inputGain_;
}

void Delay::setOutputGain(float outputGain_)
{
  outputGain = outputGain_;
}

void Delay::setInterpolationTime(float interpolationTime_)
{

  interpolationTime = interpolationTime_ * 0.0001f;
}
