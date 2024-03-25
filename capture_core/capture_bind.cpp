#include <emscripten/bind.h>
#include "./src/Synth.h"
#include <iostream>

using namespace emscripten;

class SynthWrapper : public Synth
{
public:
    void render(uintptr_t inputPtr, uintptr_t outputPtr, int32_t numFrames)
    {
        float *outputFloat = reinterpret_cast<float *>(outputPtr);
        float **outputs;

        outputs[0] = outputFloat + 0 * numFrames;
        outputs[1] = outputFloat + 1 * numFrames;

        float *inputFloat = reinterpret_cast<float *>(inputPtr);
        Synth::render(inputFloat, outputs, numFrames);
    }
    void startPlaying(int midiNote)
    {
        uint8_t midiNoteCasted = static_cast<uint8_t>(midiNote);
        Synth::startPlaying(midiNoteCasted);
    }
    void stopPlaying(int midiNote)
    {
        uint8_t midiNoteCasted = static_cast<uint8_t>(midiNote);
        Synth::stopPlaying(midiNoteCasted);
    }
};

EMSCRIPTEN_BINDINGS(CAPTURE_CLASS)
{
    class_<SynthWrapper, base<Synth>>("Synth")
        .constructor()
        .function("render", &SynthWrapper::render, allow_raw_pointers())
        .function("startPlaying", &SynthWrapper::startPlaying)
        .function("stopPlaying", &SynthWrapper::stopPlaying);

    class_<Synth>("SynthBase")
        .constructor<>()
        .function("init", &Synth::init)
        .function("record", &Synth::record)
        .function("settAttack", &Synth::setAttack);
};
