import { useEffect, useRef, useState } from "react";
import styles from "./modDepth.module.css";

interface Props {
  callback:
    | React.Dispatch<React.SetStateAction<number>>
    | ((val: number) => void);
  value: number;
}

const ModDepth = ({ callback, value }: Props) => {
  const [isActive, setIsActive] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (ev: MouseEvent) => {
    if (!isActive || !wrapperRef.current || !barRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const value = 1 - (ev.clientY - rect.top) / wrapperRef.current.clientHeight;
    callback(Math.min(Math.max(value, 0), 1));
  };

  useEffect(() => {
    if (!wrapperRef.current || !barRef.current) return;
    barRef.current.style.top = `${100 - value * 100}%`;
  }, [value]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", () => setIsActive(false));
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", () => setIsActive(false));
    };
  }, [isActive]);

  return (
    <div
      className={styles.wrapper}
      ref={wrapperRef}
      onMouseDown={() => setIsActive(true)}
    >
      <div className={styles.bar} ref={barRef}></div>
    </div>
  );
};

export default ModDepth;
