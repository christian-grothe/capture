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
  | GrainCommands
  | DelayCommands
  | LfoCommands;

interface RegularData {
  value: number | Waveform
  index?: number,
}

interface LfoCtlData {
  mixIndex: number,
  modIndex: number,
  depth: number
}

export interface Message {
  command: Commands;
  data: RegularData | LfoCtlData; 
}

export enum Waveform {
  Sine,
  Saw,
  Noise,
  Square,
}
