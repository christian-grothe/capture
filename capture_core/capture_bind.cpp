#include "./src/Capture.h"
#include "emscripten/bind.h"

using namespace emscripten;

class CaptureWrapper : public Capture {
public:
  void render(uintptr_t inputPtr, uintptr_t outputPtr, int32_t numFrames) {
    float *outputFloat = reinterpret_cast<float *>(outputPtr);
    float *outputs[2];

    outputs[0] = outputFloat;
    outputs[1] = outputFloat + numFrames;

    float *inputFloat = reinterpret_cast<float *>(inputPtr);
    Capture::render(inputFloat, outputs, numFrames);
  }

  void setModFreq(int index, float freq) {
    Capture::modMixer.setModFreq(index, freq);
  }
  void setMixDepth(int mixIndex, int modIndex, float val) {
    Capture::modMixer.setMixDepth(mixIndex, modIndex, val);
  }
  void setModType(int index, int newTypeInt) {
    Modulator::ModulationType newType =
        static_cast<Modulator::ModulationType>(newTypeInt);
    Capture::modMixer.setModType(index, newType);
  }
};

EMSCRIPTEN_BINDINGS(CAPTURE_CLASS) {
  class_<CaptureWrapper, base<Capture>>("Capture")
      .constructor()
      .function("render", &CaptureWrapper::render, allow_raw_pointers())
      .function("setModFreq", &CaptureWrapper::setModFreq)
      .function("setMixDepth", &CaptureWrapper::setMixDepth)
      .function("setModType", &CaptureWrapper::setModType);

  class_<Capture>("CaptureBase")
      .function("init", &Capture::init)
      .function("startPlaying", &Capture::startPlaying)
      .function("stopPlaying", &Capture::stopPlaying)
      .function("record", &Capture::record)
      .function("isRecording", &Capture::isRecording)
      .function("setGrainLength", &Capture::setGrainLength)
      .function("setPlaySpeed", &Capture::setPlaySpeed)
      .function("setDensity", &Capture::setDensity)
      .function("setSpray", &Capture::setSpray)
      .function("setSpread", &Capture::setSpread)
      .function("setLoopStart", &Capture::setLoopStart)
      .function("setLoopLength", &Capture::setLoopLength)
      .function("setGain", &Capture::setGain)
      .function("setGrainLengthModDepth", &Capture::setGrainLengthModDepth)
      .function("setGrainDenseModDepth", &Capture::setGrainDenseModDepth)
      .function("setPlaySpeedModDepth", &Capture::setPlaySpeedModDepth)
      .function("setGainModDepth", &Capture::setGainModDepth)
      .function("setGrainLengthModIndex", &Capture::setGrainLengthModIndex)
      .function("setGrainDenseModIndex", &Capture::setGrainDenseModIndex)
      .function("setPlaySpeedModIndex", &Capture::setPlaySpeedModIndex)
      .function("setGainModIndex", &Capture::setGainModIndex)
      .function("setDelaytime", &Capture::setDelaytime)
      .function("setDelayFeedback", &Capture::setDelayFeedback)
      .function("setDelayInterpolationTime",
                &Capture::setDelayInterpolationTime)
      .function("setDelayInputGain", &Capture::setDelayInputGain)
      .function("setDelayOutputGain", &Capture::setDelayOutputGain)
      .function("setDelayColor", &Capture::setDelayColor)
      .function("setDelayInputGainModDepth",
                &Capture::setDelayInputGainModDepth)
      .function("setDelayOutputGainModDepth",
                &Capture::setDelayOutputGainModDepth)
      .function("setDelaytimeModDepth", &Capture::setDelaytimeModDepth)
      .function("setDelayInputGainModIndex",
                &Capture::setDelayInputGainModIndex)
      .function("setDelayOutputGainModIndex",
                &Capture::setDelayOutputGainModIndex)
      .function("setDelaytimeModIndex", &Capture::setDelaytimeModIndex)
      .function("setAttack", &Capture::setAttack)
      .function("setRelease", &Capture::setRelease);
};
