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
  | "setDelayInterpolationTime"
  | "setDelayInputGain"
  | "setDelayOutputGain"
  | "setDelayColor";

export type ModCommands =
  | "setGrainLengthModDepth"
  | "setGrainDenseModDepth"
  | "setPlaySpeedModDepth"
  | "setDelaytimeModDepth"
  | "setDelayInputGainModDepth"
  | "setDelayOutputGainModDepth"
  | "setGainModDepth"
  | "setGrainDenseModIndex"
  | "setGrainLengthModIndex"
  | "setPlaySpeedModIndex"
  | "setDelaytimeModIndex"
  | "setDelayInputGainModIndex"
  | "setDelayOutputGainModIndex"
  | "setGainModIndex"
  | "setModFreq"
  | "setModType"
  | "setModDepth";

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
  | ModCommands;

interface RegularData {
  value: number | Waveform;
  index?: number;
}

interface LfoCtlData {
  mixIndex: number;
  modIndex: number;
  depth: number;
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
