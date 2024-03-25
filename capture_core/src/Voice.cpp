/*
  ==============================================================================

    Voice.cpp
    Created: 12 Jan 2024 7:39:58am
    Author:  christiangrothe

  ==============================================================================
*/
#include "Voice.h"
#include "Synth.h"
#include "AudioBuffer.h"

void Voice::setPlaySpeed(float playSpeed)
{
  playHeadInc = (1 / loopBufferSize) * playSpeed;
}

void Voice::setAttack(float attack)
{
  env.setAttackMultiplier(attack);
}

void Voice::setRelease(float release)
{
  env.setReleaseMultiploer(release);
}

void Voice::setGrainTriggerRate(float rate)
{
  grainTriggerRate = sampleRate * (rate / 1000.0f);
}

void Voice::startPlaying(int note_)
{
  note = note_;
  int semitoneDifference = note - 60;
  float newPitch = pow(2.0f, static_cast<float>(semitoneDifference) / 12.0f);
  pitch = newPitch;
  isPlaying = true;
  env.attack();
}

void Voice::stopPlaying()
{
  note = -1;
  env.release();
}

bool Voice::getIsPlaying()
{
  return isPlaying;
}

void Voice::init(int totalChannelNum, int bufferSize, float sampleRate_, Synth *synth_)
{
  synth = synth_;
  loopBufferSize = bufferSize;
  sampleRate = sampleRate_;
  grainTriggerRate = sampleRate * (50.0f / 1000.0f);
  grainTriggerInc = grainTriggerRate;
  isPlaying = false;
  grainLength = 100.0f;
  setAttack(0.01f);
  setRelease(0.01f);

  playHead = 0.0f;
  playHeadInc = (1 / loopBufferSize);
  writePos = 0.0f;

  pitch = 1.0f;
  sprayFactor = 0.0f;
  spreadFactor = 1.0f;

  loopStart = 0.0f;
  loopLength = 1.0f;

  env.init(sampleRate, 0.1f, [this]()
           { 
            isPlaying = false;
            note = -1; });

  for (int grain = 0; grain < GRAIN_NUMS; grain++)
  {
    grains[grain].init(&synth->loopBuffer, sampleRate);
  }
}

Utils::Signal Voice::render()
{
  setPlayHead();
  activateGrain();
  return getGrainVals();
}

inline void Voice::setPlayHead()
{
  float playSpeedModInc = synth->modMixer.getModulationIncrement(synth->playSpeedModIndex, synth->playSpeedModDepth, playHeadInc, (1 / loopBufferSize) * 4);
  float playHeadNew;
  switch (synth->playbackDir)
  {
  case Synth::PlaybackDir::Normal:
    playHeadNew = playHead + playHeadInc + playSpeedModInc;
    playHead = (playHeadNew >= 1.0f) || (playHeadNew >= loopStart + loopLength)
                   ? loopStart
                   : playHeadNew;
    break;

  case Synth::PlaybackDir::Reverse:
    playHeadNew = playHead - (playHeadInc + playSpeedModInc);
    playHead = playHeadNew <= loopStart
                   ? loopStart + loopLength
                   : playHeadNew;
    break;

  case Synth::PlaybackDir::BackAndForth:
    // TO DO
    break;
  }
}

void Voice::activateGrain()
{
  float grainDensModInc = synth->modMixer.getModulationIncrement(synth->grainDenseModIndex, synth->grainDenseModDepth, grainTriggerRate, sampleRate);
  float grainLengthModInc = synth->modMixer.getModulationIncrement(synth->grainLengthModIndex, synth->grainLengthModDepth, grainLength, maxGrainLength);

  if (grainTriggerInc++ >= grainTriggerRate + grainDensModInc)
  {
    float spray = random.nextSample() * sprayFactor;
    for (int grain = 0; grain < GRAIN_NUMS; grain++)
    {
      if (!grains[grain].isActive())
      {
        playHead = playHead < loopStart ? loopStart : playHead;
        float withSpray = (playHead + spray > 1.0f) ? playHead : playHead + spray;
        float pos = (random.nextSample() - 0.5f) * 2 * spreadFactor;
        bool isReverse = synth->grainDir == Synth::PlaybackDir::Normal ? false : true;
        grains[grain].activateGrain(withSpray, grainLength + grainLengthModInc, pos, pitch, isReverse);
        break;
      }
    }

    grainTriggerInc = 0;
  }
}

Utils::Signal Voice::getGrainVals()
{
  Utils::Signal output;
  float envVal = env.nextValue();
  for (int grain = 0; grain < GRAIN_NUMS; grain++)
  {
    if (grains[grain].isActive())
    {
      Utils::Signal newOutput = grains[grain].getValues();
      output.left += newOutput.left * envVal;
      output.right += newOutput.right * envVal;
    }
  }
  return output;
}
