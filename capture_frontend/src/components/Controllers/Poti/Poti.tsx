import { useRef, useState, useEffect } from "react";
import styles from "./poti.module.css";
import ModDepth from "./ModDepth";
import ModIndex from "./ModIndex";

interface ModProps {
  valueModDepth: number;
  callbackModDepth:
    | React.Dispatch<React.SetStateAction<number>>
    | ((val: number) => void);
  valueModIndex: number;
  callbackModIndex:
    | React.Dispatch<React.SetStateAction<number>>
    | ((val: number) => void);
}

interface Props {
  label: string;
  unit?: string;
  min?: number;
  max?: number;
  value: number;
  callback:
    | React.Dispatch<React.SetStateAction<number>>
    | ((val: number) => void);
  modProps?: ModProps;
}

const Poti = ({ label, unit, min, max, value, callback, modProps }: Props) => {
  const [isActive, setIsActive] = useState(false);
  const startRef = useRef(0);
  const currentVal = useRef(0);
  const prevY = useRef(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = (e: React.MouseEvent) => {
    startRef.current = e.clientY;
    setIsActive(true);
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const rotation = value * 245 - 45;
    containerRef.current.style.transform = `rotate(${rotation}deg)`;
    currentVal.current = value;
  }, [value]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !isActive) return;
      const y = startRef.current - e.clientY;
      const inc = 0.015;

      if (y > prevY.current) {
        currentVal.current += inc;
      } else {
        currentVal.current -= inc;
      }
      currentVal.current = Math.min(Math.max(currentVal.current, 0), 1);
      prevY.current = y;

      if (min !== undefined && max !== undefined) {
        callback(currentVal.current * (max - min) + min);
      } else {
        callback(currentVal.current);
      }
    };

    const handleMouseUp = () => {
      setIsActive(false);
    };

    if (isActive) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isActive]);

  return (
    <div className={styles.wrapper}>
      <span>{label}</span>
      <div className={styles.container} onMouseDown={handleStart}>
        <div className={styles.circle} ref={containerRef}>
          <div className={styles.mark} />
        </div>
      </div>
      <span>
        {value.toFixed(2)} {unit}
      </span>
      {modProps ? (
        <>
          <ModDepth
            callback={modProps.callbackModDepth}
            value={modProps.valueModDepth}
          />
          <ModIndex
            callback={modProps.callbackModIndex}
            value={modProps.valueModIndex}
            min={1}
            max={4}
          />
        </>
      ) : null}
    </div>
  );
};

export default Poti;
