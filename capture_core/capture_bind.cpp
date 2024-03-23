#include <emscripten/bind.h>
#include "./Synth.h"
#include <iostream>

using namespace emscripten;

class SynthWrapper : public Synth
{
public:
    void render(uintptr_t outputPtr, uintptr_t inputPtr, int32_t numFrames)
    {
        float *outputFloat = reinterpret_cast<float *>(outputPtr);
        float **outputs;
        outputs[0] = outputFloat;
        outputs[1] = outputFloat;
        float *inputFloat = reinterpret_cast<float *>(inputPtr);
        Synth::render(inputFloat, outputs, numFrames);
    }
};

EMSCRIPTEN_BINDINGS(synth)
{
    class_<SynthWrapper, base<Synth>>("Synth")
        .constructor()
        .function("render", &SynthWrapper::render, allow_raw_pointers());

    class_<Synth>("SynthBase")
        .constructor<>()
        .function("init", &Synth::init)
        .function("record", &Synth::record)
        .function("startPlaying", &Synth::startPlaying)
        .function("stopPlaying", &Synth::stopPlaying)
        .function("settAttack", &Synth::setAttack);
};