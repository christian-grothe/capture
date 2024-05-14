import { useState } from "react";
import NumberSelect from "../Controllers/NumberSelect/NumberSelect";
import Poti from "../Controllers/Poti/Poti";
import styles from "./lfoController.module.css";
import Fader from "../Controllers/Fader/Fader";
import { useAppStore } from "../../store/useAppStore";

const LfoController = () => {
  const sendMessage = useAppStore((state) => state.sendMessage);

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
    <div className={"container grow"}>
      <span>LFO Mixer</span>
      <div className={styles.controlls}>
        <div>
          <Poti cmd="lfo1Rate" label="A" min={0.5} max={10} />
          <Fader index={0} setMixVal={setMix} initVal={mixes[currentMix][0]} />
        </div>
        <div>
          <Poti cmd="lfo2Rate" label="B"  min={0.5} max={10} />
          <Fader index={1} setMixVal={setMix} initVal={mixes[currentMix][1]} />
        </div>
        <div>
          <Poti cmd="lfo3Rate" label="C"  min={0.5} max={10} />
          <Fader index={2} setMixVal={setMix} initVal={mixes[currentMix][2]} />
        </div>
        <div>
          <Poti cmd="lfo4Rate" label="D"  min={0.5} max={10} />
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
