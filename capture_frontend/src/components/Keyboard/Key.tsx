import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import styles from "./keyboard.module.css";

interface Props {
  midiNote: number;
  isLatch: boolean;
  keypress: string;
}
export const Key = ({ keypress, midiNote, isLatch }: Props) => {
  const sendMessage = useAppStore((state) => state.sendMessage);
  const [currentNote, setCurrentNote] = useState<number>(0);
  const [hasInteraction, setHasInteraction] = useState<boolean>(false);
  const isActiveRef = useRef(false);
  const isLatchRef = useRef(false);
  const isKeydownRef = useRef(false);

  useEffect(() => {
    if (!isLatch && hasInteraction) {
      isActiveRef.current = false;
      setCurrentNote(0);
      sendMessage({ command: "stopNote", data: { value: currentNote } });
    }
    isLatchRef.current = isLatch;
  }, [isLatch]);

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === keypress && !isKeydownRef.current) {
      handlePlay();
      isKeydownRef.current = true;
    }
  };

  const handleKeyup = (e: KeyboardEvent) => {
    if (e.key == keypress) {
      stopPlaying();
      isKeydownRef.current = false;
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("keyup", handleKeyup);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("keyup", handleKeyup);
    };
  }, [keypress]);

  const handlePlay = () => {
    setHasInteraction(true);
    if (isLatchRef.current && isActiveRef.current) {
      sendMessage({ command: "stopNote", data: { value: currentNote } });
      setCurrentNote(0);
      isActiveRef.current = false;
    } else {
      sendMessage({ command: "playNote", data: { value: midiNote } });
      setCurrentNote(midiNote);
      isActiveRef.current = true;
    }
  };

  const stopPlaying = () => {
    if (isLatchRef.current) return;
    sendMessage({ command: "stopNote", data: { value: midiNote } });
    setCurrentNote(0);
    isActiveRef.current = false;
  };

  return (
    <div
      className={`${styles.key} ${isActiveRef.current ? styles.active : ""}`}
      onMouseDown={handlePlay}
      onMouseUp={stopPlaying}
    >
      {keypress.toUpperCase()}
    </div>
  );
};
