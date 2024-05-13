import { Controller } from "../../types/types";

export const granular: Controller[] = [
  {
    label: "Length",
    cmd: "setGrainLength",
    modCmd: "grainLengthModDepth",
    modIdCmd: "grainLengthModIndex",
  },
  {
    label: "Density",
    cmd: "setDensity",
    modCmd: "grainDenseModDepth",
    modIdCmd: "grainDenseModIndex",
  },
  {
    label: "Speed",
    cmd: "setPlaySpeed",
    modCmd: "playSpeedModDepth",
    modIdCmd: "playSpeedModIndex",
  },
  {
    label: "Spray",
    cmd: "setSpray",
  },
  {
    label: "Spread",
    cmd: "setSpread",
  },
];

export const delay: Controller[] = [
  {
    label: "Feedback",
    cmd: "setDelayFeedback",
  },
  {
    label: "Time",
    cmd: "setDelaytime",
    modCmd: "delayTimeModDepth",
    modIdCmd: "delayTimeModIndex",
  },
  {
    label: "Interp.",
    cmd: "setInterpolationTime",
    modCmd: "delayLazynessModDepth",
    modIdCmd: "delayLazynessModIndex",
  },
  {
    label: "Input",
    cmd: "setDelayInputGain",
    modCmd: "delayInputModDepth",
    modIdCmd: "delayInputModIndex",
  },
  {
    label: "Output",
    cmd: "setDelayOutputGain",
  },
];
