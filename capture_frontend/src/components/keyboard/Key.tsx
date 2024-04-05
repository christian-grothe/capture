import { useAppStore } from "../../store/useAppStore";
import styles from "./keyboard.module.css";

interface Props {
  midiNote: number;
}
export const Key = ({ midiNote }: Props) => {
  const playNote = useAppStore((state) => state.playNote);
  const stopNote = useAppStore((state) => state.stopNote);

  return (
    <div
      className={styles.key}
      onMouseDown={() => playNote(midiNote)}
      onMouseUp={() => stopNote(midiNote)}
    ></div>
  );
};
