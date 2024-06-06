import { useState } from "react";
import NumberSelect from "../Controllers/NumberSelect/NumberSelect";
import Poti from "../Controllers/Poti/Poti";
import styles from "./lfoController.module.css";
import Fader from "../Controllers/Fader/Fader";
import { useAppStore } from "../../store/useAppStore";

const LfoController = () => {
  const sendMessage = useAppStore((state) => state.sendMessage);
  const [vals, setVals] = useState([0, 0, 0, 0]);

  const [currentMix, setCurrentMix] = useState(0);
  const [mixes, setMixes] = useState([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);

  const setCurrentMixCb = (operation: "inc" | "dec") => {
    if (
      (currentMix === 0 && operation === "dec") ||
      (currentMix === 3 && operation === "inc")
    )
      return;
    if (operation === "inc") {
      setCurrentMix((prev) => prev + 1);
    } else {
      setCurrentMix((prev) => prev - 1);
    }
  };

  const setMix = (index: number, val: number) => {
    const mix = mixes[currentMix];
    mix[index] = val;
    setMixes([...mixes]);
    sendMessage("setMixDepth", {
      mixIndex: currentMix,
      modIndex: index,
      depth: val,
    });
  };

  return (
    <div className={"container"}>
      <span>LFO Mixer</span>
      <div className={styles.controlls}>
        <div>
          <Poti
            label="A"
            unit="Hz"
            min={0.05}
            max={10}
            waveformSelect={0}
            value={vals[0]}
            callback={(val: number) => {
              sendMessage("lfoRate", { index: 0, val });
            }}
          />
          <Fader index={0} setMixVal={setMix} initVal={mixes[currentMix][0]} />
        </div>
        <div>
          <Poti
            label="B"
            unit="Hz"
            min={0.05}
            max={10}
            waveformSelect={1}
            value={vals[1]}
            callback={(val: number) => {
              sendMessage("lfoRate", { index: 1, val });
            }}
          />
          <Fader index={1} setMixVal={setMix} initVal={mixes[currentMix][1]} />
        </div>
        <div>
          <Poti
            label="C"
            unit="Hz"
            min={0.05}
            max={10}
            waveformSelect={2}
            value={vals[2]}
            callback={(val: number) => {
              sendMessage("lfoRate", { index: 2, val });
            }}
          />
          <Fader index={2} setMixVal={setMix} initVal={mixes[currentMix][2]} />
        </div>
        <div>
          <Poti
            label="D"
            unit="Hz"
            min={0.05}
            max={10}
            waveformSelect={3}
            value={vals[3]}
            callback={(val: number) => {
              sendMessage("lfoRate", { index: 3, val });
            }}
          />
          <Fader index={3} setMixVal={setMix} initVal={mixes[currentMix][3]} />
        </div>
      </div>
      <div className={styles.controlls}>
        <div></div>
        <NumberSelect
          label={"Mix"}
          min={1}
          max={4}
          initVal={1}
          callback={setCurrentMixCb}
        />
        <div></div>
      </div>
    </div>
  );
};

export default LfoController;
