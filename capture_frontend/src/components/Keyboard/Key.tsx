import { useEffect, useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import styles from "./keyboard.module.css";

interface Props {
  midiNote: number;
  isLatch: boolean;
}
export const Key = ({ midiNote, isLatch }: Props) => {
  const sendMessage = useAppStore((state) => state.sendMessage);
  const [currentNote, setCurrentNote] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [hasInteraction, setHasInteraction]= useState<boolean>(false);

  useEffect(() => {
    if (!isLatch && hasInteraction) {
      setIsActive(false);
      setCurrentNote(0);
      sendMessage({ command: "stopNote", data: { value: currentNote } });
    }
  }, [isLatch]);

  const handlePlay = () => {
    setHasInteraction(true);
    if (isLatch && isActive) {
      sendMessage({ command: "stopNote", data: { value: currentNote } });
      setCurrentNote(0);
      setIsActive(false);
    } else {
      sendMessage({ command: "playNote", data: { value: midiNote } });
      setCurrentNote(midiNote);
      setIsActive(true);
    }
  };

  const stopPlaying = () => {
    if (isLatch) return;
    sendMessage({ command: "stopNote", data: { value: midiNote } });
    setCurrentNote(0);
    setIsActive(false);
  };

  return (
    <div
      className={`${styles.key} ${isActive ? styles.active : ""}`}
      onMouseDown={handlePlay}
      onMouseUp={stopPlaying}
    ></div>
  );
};
