import { useRef, useState, useEffect } from "react";
import styles from "./poti.module.css";
import { useAppStore } from "../../../store/useAppStore";
import { Commands, ModCommands } from "../../../types/types";
import ModDepth from "./ModDepth";
import ModIndex from "./ModIndex";
import WaveformSelect from "./WaveformSelect";

interface Props {
  label: string;
  unit?: string;
  cmd?: Commands;
  min?: number;
  max?: number;
  modCmd?: ModCommands;
  modIdCmd?: ModCommands;
  waveformSelect?: boolean;
  index?: number;
  callback?:
    | React.Dispatch<React.SetStateAction<number>>
    | ((val: number) => void);
}

const Poti = ({
  label,
  unit,
  cmd,
  min,
  max,
  modCmd,
  modIdCmd,
  waveformSelect,
  index,
  callback,
}: Props) => {
  const sendMessage = useAppStore((state) => state.sendMessage);

  const [isActive, setIsActive] = useState(false);
  const [val, setVal] = useState(min || 0);
  const startRef = useRef(0);
  const currentVal = useRef(0);
  const prevY = useRef(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = (e: React.MouseEvent) => {
    startRef.current = e.clientY;
    setIsActive(true);
  };

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
        setVal(currentVal.current * (max - min) + min);
      } else {
        setVal(currentVal.current);
      }
      const rotation = currentVal.current * 245 - 45;
      containerRef.current.style.transform = `rotate(${rotation}deg)`;
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

  useEffect(() => {
    if (cmd) {
      sendMessage(cmd, val);
    }
    if (callback) {
      callback(val);
    }
  }, [val]);

  return (
    <div className={styles.wrapper}>
      <span>{label}</span>
      <div className={styles.container} onMouseDown={handleStart}>
        <div className={styles.circle} ref={containerRef}>
          <div className={styles.mark} />
        </div>
      </div>
      <span>
        {val.toFixed(2)} {unit}
      </span>
      {waveformSelect && index !== undefined ? (
        <WaveformSelect index={index} />
      ) : null}
      {modCmd && modIdCmd ? (
        <>
          <ModDepth modCmd={modCmd} />
          <ModIndex min={1} max={4} cmd={modIdCmd} />
        </>
      ) : null}
    </div>
  );
};

export default Poti;
