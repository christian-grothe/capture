import { useState } from "react";
import { Key } from "./Key";
import { Space } from "./Space";
import styles from "./keyboard.module.css";
import NumberSelect from "../Controllers/NumberSelect/NumberSelect";
import Toggle from "../Controllers/Toggle/Toggle";
import Poti from "../Controllers/Poti/Poti";
import { useAppStore } from "../../store/useAppStore";

const Keyboard = () => {
  const sendMessage = useAppStore((state) => state.sendMessage);
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
    <div className={"container grow"}>
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
          <Poti
            label={"Attack"}
            min={0.01}
            max={1}
            value={attack}
            callback={(val: number) => {
              setAttack(val);
              sendMessage({ command: "setAttack", data: { value: val } });
            }}
          />
          <Poti
            label={"Release"}
            min={0.01}
            max={1}
            value={release}
            callback={(val: number) => {
              setRelease(val);
              sendMessage({ command: "setRelease", data: { value: val } });
            }}
          />
        </div>
      </div>
      <div className={`${styles.keyboard} ${styles.blackRow}`}>
        <Key keypress={"w"} midiNote={baseNote + 1} isLatch={isLatch} />
        <Key keypress={"e"} midiNote={baseNote + 3} isLatch={isLatch} />
        <Space />
        <Key keypress={"t"} midiNote={baseNote + 6} isLatch={isLatch} />
        <Key keypress={"z"} midiNote={baseNote + 8} isLatch={isLatch} />
        <Key keypress={"u"} midiNote={baseNote + 10} isLatch={isLatch} />
      </div>
      <div className={styles.keyboard}>
        <Key keypress={"a"} midiNote={baseNote} isLatch={isLatch} />
        <Key keypress={"s"} midiNote={baseNote + 2} isLatch={isLatch} />
        <Key keypress={"d"} midiNote={baseNote + 4} isLatch={isLatch} />
        <Key keypress={"f"} midiNote={baseNote + 5} isLatch={isLatch} />
        <Key keypress={"g"} midiNote={baseNote + 7} isLatch={isLatch} />
        <Key keypress={"h"} midiNote={baseNote + 9} isLatch={isLatch} />
        <Key keypress={"j"} midiNote={baseNote + 11} isLatch={isLatch} />
        <Key keypress={"k"} midiNote={baseNote + 12} isLatch={isLatch} />
      </div>
    </div>
  );
};

export default Keyboard;
