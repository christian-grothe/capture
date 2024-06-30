type GrainCommands =
  | "setDensity"
  | "setSpray"
  | "setSpread"
  | "setGrainLength"
  | "setGrainPosition"
  | "setGrainSize"
  | "setPlaySpeed"
  | "setGain";


type DelayCommands =
  | "setDelaytime"
  | "setDelayFeedback"
  | "setInterpolationTime"
  | "setDelayInputGain"
  | "setDelayOutputGain";

type LfoCommands = "lfoRate" | "setWaveform" | "setMixDepth";

export type ModCommands =
  | "grainLengthModDepth"
  | "grainDenseModDepth"
  | "playSpeedModDepth"
  | "delayTimeModDepth"
  | "delayLazynessModDepth"
  | "delayInputModDepth"
  | "gainModDepth"
  | "grainDenseModIndex"
  | "grainLengthModIndex"
  | "playSpeedModIndex"
  | "delayTimeModIndex"
  | "delayLazynessModIndex"
  | "delayInputModIndex"
  | "setModFreq"
  | "gainModIndex";

export type Commands =
  | "setLoopStart"
  | "setLoopLength"
  | "setAttack"
  | "setRelease"
  | "stopNote"
  | "playNote"
  | "rec"
  | "getAudioData"
  | "getBufferSize"
  | "getBufferPtr"
  | GrainCommands
  | DelayCommands
  | LfoCommands;

export interface Controller {
  label: string;
  cmd: Commands;
  min?: number;
  max?: number;
  modCmd?: ModCommands;
  modIdCmd?: ModCommands;
}

export enum Waveform {
  Sine,
  Saw,
  Noise,
  Square,
}
