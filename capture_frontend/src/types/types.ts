type GrainCommands =
  | "setDensity"
  | "setSpray"
  | "setSpread"
  | "setGrainLength"
  | "setGrainPosition"
  | "setGrainSize"
  | "setPlaySpeed";

type DelayCommands =
  | "setDelaytime"
  | "setDelayFeedback"
  | "setInterpolationTime"
  | "setDelayInputGain"
  | "setDelayOutputGain";

type LfoCommands =
  | "lfo1Rate"
  | "lfo2Rate"
  | "lfo3Rate"
  | "lfo4Rate"
  | "setMixDepth";

export type ModCommands =
  | "grainLengthModDepth"
  | "grainDenseModDepth"
  | "playSpeedModDepth"
  | "delayTimeModDepth"
  | "delayLazynessModDepth"
  | "delayInputModDepth"
  | "grainDenseModIndex"
  | "grainLengthModIndex"
  | "playSpeedModIndex"
  | "delayTimeModIndex"
  | "delayLazynessModIndex"
  | "delayInputModIndex";

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
  modCmd?: ModCommands;
}
