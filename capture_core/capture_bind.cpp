#include "./src/Capture.h"
#include "emscripten/bind.h"

using namespace emscripten;

class CaptureWrapper : public Capture {
public:
  void render(uintptr_t inputPtr, uintptr_t outputPtr, int32_t numFrames) {
    float *outputFloat = reinterpret_cast<float *>(outputPtr);
    float **outputs;

    outputs[0] = outputFloat + 0 * numFrames;
    outputs[1] = outputFloat + 1 * numFrames;

    float *inputFloat = reinterpret_cast<float *>(inputPtr);
    Capture::render(inputFloat, outputs, numFrames);
  }
};

EMSCRIPTEN_BINDINGS(CAPTURE_CLASS) {
  class_<CaptureWrapper, base<Capture>>("Capture").constructor().function(
      "render", &CaptureWrapper::render, allow_raw_pointers());

  class_<Capture>("CaptureBase")
      .function("init", &Capture::init)
      .function("startPlaying", &Capture::startPlaying)
      .function("stopPlaying", &Capture::stopPlaying)
      .function("record", &Capture::record);
};
