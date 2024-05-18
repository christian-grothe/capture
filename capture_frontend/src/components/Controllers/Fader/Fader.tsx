import { useEffect, useRef, useState } from "react";
import styles from "./fader.module.css";

interface Props {
  initVal: number;
  index: number;
  setMixVal: (index: number, val: number) => void;
}

const Fader = ({ initVal, setMixVal, index }: Props) => {
  const [val, setVal] = useState(initVal || 0);
  const [isClicked, setIsClicked] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (ev: MouseEvent) => {
    if (!isClicked || !markRef.current || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const height = wrapperRef.current.clientHeight;
    let y = (ev.clientY - rect.top) / height;
    y = Math.min(Math.max(y, 0), 1);
    setVal(1 - y);
    setMixVal(index, 1 - y);
    markRef.current.style.top = `${y * 100}%`;
  };

  useEffect(() => {
    if (initVal !== undefined) {
      setVal(initVal);
      if (markRef.current) {
        markRef.current.style.top = `${(1 - initVal) * 100}%`;
      }
    }
  }, [initVal]);

  useEffect(() => {
    window.addEventListener("mouseup", () => setIsClicked(false));
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mouseup", () => setIsClicked(false));
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isClicked]);

  return (
    <div
      className={styles.wrapper}
      ref={wrapperRef}
      onMouseDown={() => setIsClicked(true)}
    >
      <div className={styles.line}></div>
      <div className={styles.mark} ref={markRef}></div>
      <span>{val.toFixed(2)}</span>
    </div>
  );
};

export default Fader;
