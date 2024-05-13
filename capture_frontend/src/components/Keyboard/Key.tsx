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

  useEffect(() => {
    if (!isLatch) {
      setIsActive(false);
      setCurrentNote(0);
      sendMessage("stopNote", currentNote);
    }
  }, [isLatch]);

  const handlePlay = () => {
    if (isLatch && isActive) {
      sendMessage("stopNote", currentNote);
      setCurrentNote(0);
      setIsActive(false);
    } else {
      sendMessage("playNote", midiNote);
      setCurrentNote(midiNote);
      setIsActive(true);
    }
  };

  const stopPlaying = () => {
    if (isLatch) return;
    sendMessage("stopNote", midiNote);
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
