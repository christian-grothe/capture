import { useState } from "react";
import { Key } from "./Key";
import { Space } from "./Space";
import styles from "./keyboard.module.css";
import NumberSelect from "../Controllers/NumberSelect/NumberSelect";
import Toggle from "../Controllers/Toggle/Toggle";
import Poti from "../Controllers/Poti/Poti";

const Keyboard = () => {
  const [baseNote, setBaseNote] = useState(60);
  const [isLatch, setIsLatch] = useState(false);
  const [attack, setAttack] = useState(0.1);
  const [release, setRelease] = useState(0.1);

  const changeOctave = (operation: "inc" | "dec") => {
    if (operation === "inc") {
      setBaseNote(baseNote + 12);
    } else {
      setBaseNote(baseNote - 12);
    }
  };

  return (
    <div className={"container"}>
      <div className={styles.toolbar}>
        <div>
          <NumberSelect
            callback={changeOctave}
            label={"Oct"}
            min={-3}
            max={3}
          />
          <Toggle
            label={"Latch"}
            callback={(state: boolean) => setIsLatch(state)}
          />
        </div>
        <div>
          <Poti label={"Attack"} value={attack} callback={setAttack} />
          <Poti label={"Release"} value={release} callback={setRelease} />
        </div>
      </div>
      <div className={`${styles.keyboard} ${styles.blackRow}`}>
        <Key midiNote={baseNote + 1} isLatch={isLatch} />
        <Key midiNote={baseNote + 3} isLatch={isLatch} />
        <Space />
        <Key midiNote={baseNote + 6} isLatch={isLatch} />
        <Key midiNote={baseNote + 8} isLatch={isLatch} />
        <Key midiNote={baseNote + 10} isLatch={isLatch} />
      </div>
      <div className={styles.keyboard}>
        <Key midiNote={baseNote} isLatch={isLatch} />
        <Key midiNote={baseNote + 2} isLatch={isLatch} />
        <Key midiNote={baseNote + 4} isLatch={isLatch} />
        <Key midiNote={baseNote + 5} isLatch={isLatch} />
        <Key midiNote={baseNote + 7} isLatch={isLatch} />
        <Key midiNote={baseNote + 9} isLatch={isLatch} />
        <Key midiNote={baseNote + 11} isLatch={isLatch} />
        <Key midiNote={baseNote + 12} isLatch={isLatch} />
      </div>
    </div>
  );
};

export default Keyboard
