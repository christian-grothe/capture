import { useState } from "react";
import Poti from "../Controllers/Poti/Poti";
import { useAppStore } from "../../store/useAppStore";

const Delay = () => {
  const sendMessage = useAppStore((state) => state.sendMessage);

  const [delayTimeMod, setDelayTimeMod] = useState({
    modIndex: 1,
    modDepth: 0,
  });
  const [delayInputGainMod, setDelayInputGainMod] = useState({
    modIndex: 1,
    modDepth: 0,
  });
  const [delayOutputGainMod, setDelayOutputGainMod] = useState({
    modIndex: 1,
    modDepth: 0,
  });

  const [delayTime, setDelayTime] = useState(0.3);
  const [delayFeedback, setDelayFeedback] = useState(0.3);
  const [delayInputGain, setDelayInputGain] = useState(0.3);
  const [delayOutputGain, setDelayOutputGain] = useState(0.3);
  const [delayInterpolationTime, setDelayInterpolationTime] = useState(0.3);
  const [color, setColor] = useState(0.3);

  return (
    <div className="container">
      <span
        style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}
      >
        Delay
      </span>
      <div className="center" style={{ marginTop: "15px" }}>
        <div className="flex-row center full-width large-gap margin-top-bottom between">
          <Poti
            label="Time"
            value={delayTime}
            callback={(val: number) => {
              setDelayTime(val);
              sendMessage({ command: "setDelaytime", data: { value: val } });
            }}
            modProps={{
              valueModIndex: delayTimeMod.modIndex,
              callbackModIndex: (val: number) => {
                setDelayTimeMod((prev) => {
                  const copy = { ...prev };
                  copy.modIndex = val;
                  return copy;
                });
                sendMessage({
                  command: "setDelaytimeModIndex",
                  data: { value: val - 1 },
                });
              },
              valueModDepth: delayTimeMod.modDepth,
              callbackModDepth: (val: number) => {
                setDelayTimeMod((prev) => {
                  const copy = { ...prev };
                  copy.modDepth = val;
                  return copy;
                });
                sendMessage({
                  command: "setDelaytimeModDepth",
                  data: { value: val },
                });
              },
            }}
          />
          <Poti
            label="Feedback"
            value={delayFeedback}
            callback={(val: number) => {
              setDelayFeedback(val);
              sendMessage({
                command: "setDelayFeedback",
                data: { value: val },
              });
            }}
          />
        </div>
        <div className="flex-row center full-width large-gap margin-top-botom between">
          <Poti
            label="In"
            value={delayInputGain}
            callback={(val: number) => {
              setDelayInputGain(val);
              sendMessage({
                command: "setDelayInputGain",
                data: { value: val },
              });
            }}
            modProps={{
              valueModIndex: delayInputGainMod.modIndex,
              callbackModIndex: (val: number) => {
                setDelayInputGainMod((prev) => {
                  const copy = { ...prev };
                  copy.modIndex = val;
                  return copy;
                });
                sendMessage({
                  command: "setDelayInputGainModIndex",
                  data: { value: val - 1 },
                });
              },
              valueModDepth: delayInputGainMod.modDepth,
              callbackModDepth: (val: number) => {
                setDelayInputGainMod((prev) => {
                  const copy = { ...prev };
                  copy.modDepth = val;
                  return copy;
                });
                sendMessage({
                  command: "setDelayInputGainModDepth",
                  data: { value: val },
                });
              },
            }}
          />
          <Poti
            label="Out"
            value={delayOutputGain}
            callback={(val: number) => {
              setDelayOutputGain(val);
              sendMessage({
                command: "setDelayOutputGain",
                data: { value: val },
              });
            }}
            modProps={{
              valueModIndex: delayOutputGainMod.modIndex,
              callbackModIndex: (val: number) => {
                setDelayOutputGainMod((prev) => {
                  const copy = { ...prev };
                  copy.modIndex = val;
                  return copy;
                });
                sendMessage({
                  command: "setDelayOutputGainModIndex",
                  data: { value: val - 1 },
                });
              },
              valueModDepth: delayOutputGainMod.modDepth,
              callbackModDepth: (val: number) => {
                setDelayOutputGainMod((prev) => {
                  const copy = { ...prev };
                  copy.modDepth = val;
                  return copy;
                });
                sendMessage({
                  command: "setDelayOutputGainModDepth",
                  data: { value: val },
                });
              },
            }}
          />
        </div>
        <div className="flex-row full-width center margin-top-bottom between">
          <Poti
            label="Lazy"
            value={delayInterpolationTime}
            callback={(val: number) => {
              setDelayInterpolationTime(val);
              sendMessage({
                command: "setDelayInterpolationTime",
                data: { value: val },
              });
            }}
          />
          <Poti
            label="Color"
            value={color}
            callback={(val: number) => {
              setColor(val);
              sendMessage({
                command: "setDelayColor",
                data: { value: val },
              });
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Delay;
