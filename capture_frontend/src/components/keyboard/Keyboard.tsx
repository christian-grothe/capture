import { useState } from "react";
import { Key } from "./Key";
import { Space } from "./Space";
import styles from "./keyboard.module.css";
import NumberSelect from "../controllers/NumberSelect/NumberSelect";
import Toggle from "../controllers/Toggle/Toggle";

export const Keyboard = () => {
  const [baseNote, setBaseNote] = useState(60);
  const [isLatch, setIsLatch] = useState(false);

  const changeOctave = (operation: "inc" | "dec") => {
    if (operation === "inc") {
      setBaseNote(baseNote + 12);
    } else {
      setBaseNote(baseNote - 12);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <NumberSelect callback={changeOctave} label={"Oct"} min={-3} max={3} />
        <Toggle
          label={"Latch"}
          callback={(state: boolean) => setIsLatch(state)}
        />
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
