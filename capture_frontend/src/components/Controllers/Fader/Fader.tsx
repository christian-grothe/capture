import { MouseEvent, useEffect, useRef, useState } from "react";
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

  const handleMouseMove = (ev: MouseEvent<HTMLDivElement>) => {
    if (!isClicked || !markRef.current || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const height = wrapperRef.current.clientHeight;
    const y = (ev.clientY - rect.top) / height;
    if (y > 1 || y < 0) return;
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

  return (
    <div
      className={styles.wrapper}
      ref={wrapperRef}
      onMouseDown={() => setIsClicked(true)}
      onMouseUp={() => setIsClicked(false)}
      onMouseMove={handleMouseMove}
    >
      <div className={styles.line}></div>
      <div className={styles.mark} ref={markRef}></div>
      <span>{val.toFixed(2)}</span>
    </div>
  );
};

export default Fader;
