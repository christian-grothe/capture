import { useEffect, useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import styles from "./keyboard.module.css";

interface Props {
  midiNote: number;
  isLatch: boolean;
}
export const Key = ({ midiNote, isLatch }: Props) => {
  const playNote = useAppStore((state) => state.playNote);
  const stopNote = useAppStore((state) => state.stopNote);
  const [currentNote, setCurrentNote] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);

  useEffect(()=>{
    if(!isLatch){
      setIsActive(false);
      setCurrentNote(0);
      stopNote(currentNote);
    }
  },[isLatch])

  const handlePlay = () => {
    if (isLatch && isActive) {
      stopNote(currentNote);
      setCurrentNote(0);
      setIsActive(false);
    } else {
      playNote(midiNote);
      setCurrentNote(midiNote);
      setIsActive(true);
    }
  }

  const stopPlaying = () => {
    if (isLatch) return;
    stopNote(currentNote);
    setCurrentNote(0);
    setIsActive(false);
  }

  return (
    <div
      className={`${styles.key} ${isActive ? styles.active : ""}`}
      onMouseDown={handlePlay}
      onMouseUp={stopPlaying}
    ></div>
  );
};
