#pragma once
#include "AudioBuffer.h"
#include "Envelope.h"
#include "Utils.h"
#include "Voice.h"
#include "effects/delay.h"
#include "modulation/modulationMixer.h"
#include <cstdint>

class ModulationMixer;
class Signal;

class Synth {
public:
  void init(int totalChannelNum, int bufferSize, float sampleRate_,
            ModulationMixer *modMixer_);
  Utils::Signal render(float inputSample);

  void handleMidi(uint8_t data1, uint8_t data2, uint8_t data3);
  void handleMidiCc(uint8_t cc, uint8_t val);

  void setAttack(float attack);
  void setRelease(float release);

  void setGrainLength(float grainLength_);
  void setPlaySpeed(float playSpeed_);
  void setDensity(float rate);
  void setSpray(float sprayFactor_);
  void setSpread(float spreadFactor_);

  void setLoopStart(float loopStart);
  void setLoopLength(float loopLength);

  void setGain(float gain_);

  void record();

  void startPlaying(uint8_t midiNote);
  void stopPlaying(uint8_t midiNote);

  enum MidiCommands {
    NoteOn = 144,
    NoteOff = 128,
    CC = 176,
    startRecording = 22
  };

  enum PlaybackDir { Normal, Reverse, BackAndForth };

  bool isRecording;
  int writePos;
  PlaybackDir grainDir;
  PlaybackDir playbackDir;
  AudioBuffer loopBuffer;
  float gain{0.75f};

  ModulationMixer *modMixer;

  // Modulation
  float grainLengthModDepth{0.0f};
  float grainDenseModDepth{0.0f};
  float playSpeedModDepth{0.0f};
  float gainModDepth{0.0f};
  float delayTimeModDepth{0.0f};
  float delayLazynessModDepth{0.0f};
  float delayInputModDepth{0.0f};

  uint8_t grainDenseModIndex{0};
  uint8_t grainLengthModIndex{0};
  uint8_t playSpeedModIndex{0};
  uint8_t gainModIndex{0};
  uint8_t delayTimeModIndex{0};
  uint8_t delayLazynessModIndex{0};
  uint8_t delayInputModIndex{0};

private:
  static constexpr int VOICE_NUM = 16;
  Voice voices[VOICE_NUM];
};
