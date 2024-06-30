#include "delay.h"
#include "../modulation/modulationMixer.h"
#include <cmath>
#include <vector>

void Delay::init(ModulationMixer *modMixer_) { modMixer = modMixer_; }

void Delay::setSize(int bufferSize_, float sampleRate_) {
  bufferSize = bufferSize_;
  bufferL.resize(bufferSize);
  bufferR.resize(bufferSize);
  sampleRate = sampleRate_;
}

Utils::Signal Delay::render(Utils::Signal input) {
  write(input);
  return nextSample();
}

void Delay::setDelayColor(float color_) {
  filterL.setAlpha(color_);
  filterR.setAlpha(color_);
}

void Delay::write(Utils::Signal input) {
  float inputGainModInc = modMixer->getModulationIncrement(
      delayInputModIndex, delayInputModDepth, inputGain, 1.0f);

  float feedbackSamleL = bufferL[readPos] * feedback;
  float feedbackSamleR = bufferR[readPos] * feedback;
  float filteredFeedbackL = filterL.next(feedbackSamleL);
  float filteredFeedbackR = filterR.next(feedbackSamleR);

  bufferL[writePos] =
      (input.left * (inputGain + inputGainModInc)) + filteredFeedbackL;
  bufferR[writePos] =
      (input.right * (inputGain + inputGainModInc)) + filteredFeedbackR;

  if (++writePos >= bufferSize) {
    writePos = 0.0f;
  }
}

Utils::Signal Delay::nextSample() {
  Utils::Signal output;

  float delayTimeModInc = modMixer->getModulationIncrement(
      delayTimeModIndex, delayTimeModDepth, targetDelaytime, 1.0f);
  float targetDelayMod = fmod(targetDelaytime + delayTimeModInc, 1.0f);

  if (delaytime != targetDelayMod) {
    delaytime = Utils::lerp(delaytime, targetDelayMod, interpolationTime);
  }

  int offset = bufferSize * delaytime;
  readPos = writePos - offset;

  if (readPos < 0.0f) {
    readPos += bufferSize;
  }

  float sampleL = Utils::cubicHermiteSpline(
      bufferL.data(), static_cast<float>(readPos), bufferSize);
  float sampleR = Utils::cubicHermiteSpline(
      bufferR.data(), static_cast<float>(readPos), bufferSize);

  output.left = sampleL;
  output.right = sampleR;

  float delayOutputModInc = modMixer->getModulationIncrement(
      delayOutputModIndex, delayOutputModDepth, outputGain, 1.0f);

  output *= outputGain + delayOutputModInc;

  return output;
}

void Delay::setFeedback(float feedback_) { feedback = feedback_; }

void Delay::setDelaytime(float delaytime_) { targetDelaytime = delaytime_; }

void Delay::setInputGain(float inputGain_) { inputGain = inputGain_; }

void Delay::setOutputGain(float outputGain_) { outputGain = outputGain_; }

void Delay::setInterpolationTime(float interpolationTime_) {

  interpolationTime = interpolationTime_ * 0.0001f;
}
