#include "./src/Synth.h"
#include "emscripten/bind.h"

using namespace emscripten;

class SynthWrapper : public Synth {
public:
  void render(uintptr_t inputPtr, uintptr_t outputPtr, int32_t numFrames) {
    float *outputFloat = reinterpret_cast<float *>(outputPtr);
    float **outputs;

    outputs[0] = outputFloat + 0 * numFrames;
    outputs[1] = outputFloat + 1 * numFrames;

    float *inputFloat = reinterpret_cast<float *>(inputPtr);
    Synth::render(inputFloat, outputs, numFrames);
  }

  void startPlaying(int midiNote) {
    uint8_t midiNoteCasted = static_cast<uint8_t>(midiNote);
    Synth::startPlaying(midiNoteCasted);
  }

  void stopPlaying(int midiNote) {
    uint8_t midiNoteCasted = static_cast<uint8_t>(midiNote);
    Synth::stopPlaying(midiNoteCasted);
  }

  void setModFreq(int modIndex, double freq) {
    Synth::modMixer.setModFreq(modIndex, float(freq));
  }

  void setMixDepth(int mixIndex, int modIndex, float val) {
    Synth::modMixer.setMixDepth(mixIndex, modIndex, val);
  }

  void setModType(int modIndex, int newType) {
    Modulator::ModulationType type =
        static_cast<Modulator::ModulationType>(newType);
    Synth::modMixer.mods[modIndex].setModulationType(type);
  }
};

EMSCRIPTEN_BINDINGS(CAPTURE_CLASS) {
  class_<SynthWrapper, base<Synth>>("Synth")
      .constructor()
      .function("render", &SynthWrapper::render, allow_raw_pointers())
      .function("startPlaying", &SynthWrapper::startPlaying)
      .function("stopPlaying", &SynthWrapper::stopPlaying)
      .function("setModFreq", &SynthWrapper::setModFreq)
      .function("setMixDepth", &SynthWrapper::setMixDepth)
      .function("setModFreq", &SynthWrapper::setModFreq)
      .function("setModType", &SynthWrapper::setModType);

  class_<Synth>("SynthBase")
      .constructor<>()
      .function("init", &Synth::init)
      .function("record", &Synth::record)
      .function("setAttack", &Synth::setAttack)
      .function("setLoopStart", &Synth::setLoopStart)
      .function("setLoopLength", &Synth::setLoopLength)
      .function("setGrainLength", &Synth::setGrainLength)
      .function("setDensity", &Synth::setDensity)
      .function("setPlaySpeed", &Synth::setPlaySpeed)
      .function("setSpray", &Synth::setSpray)
      .function("setSpread", &Synth::setSpread)
      .function("setDelaytime", &Synth::setDelaytime)
      .function("setDelayFeedback", &Synth::setDelayFeedback)
      .function("setInterpolationTime", &Synth::setInterpolationTime)
      .function("setDelayInputGain", &Synth::setDelayInputGain)
      .function("setDelayOutputGain", &Synth::setDelayOutputGain)
      .property("isRecording", &Synth::isRecording)
      .property("grainLengthModDepth", &Synth::grainLengthModDepth)
      .property("grainDenseModDepth", &Synth::grainDenseModDepth)
      .property("playSpeedModDepth", &Synth::playSpeedModDepth)
      .property("delayTimeModDepth", &Synth::delayTimeModDepth)
      .property("delayLazynessModDepth", &Synth::delayLazynessModDepth)
      .property("delayInputModDepth", &Synth::grainLengthModDepth)
      .property("grainLengthModIndex", &Synth::grainLengthModIndex)
      .property("grainDenseModIndex", &Synth::grainDenseModIndex)
      .property("playSpeedModIndex", &Synth::playSpeedModIndex)
      .property("delayTimeModIndex", &Synth::delayTimeModIndex)
      .property("delayLazynessModIndex", &Synth::delayLazynessModIndex)
      .property("delayInputModIndex", &Synth::grainLengthModIndex);
};
