import { useRef, useState, useEffect } from "react";
import styles from "./poti.module.css";
import { useAppStore } from "../../../store/useAppStore";
import { Commands, ModCommands } from "../../../types/types";
import ModDepth from "./ModDepth";
import ModIndex from "./ModIndex";

interface Props {
  label: string;
  cmd: Commands;
  min?: number;
  max?: number;
  modCmd?: ModCommands;
  modIdCmd?: ModCommands;
}

const Poti = ({ label, cmd, min, max, modCmd, modIdCmd }: Props) => {
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

      if (y > prevY.current) {
        currentVal.current += 0.01;
      } else {
        currentVal.current -= 0.01;
      }

      currentVal.current = Math.min(Math.max(currentVal.current, 0), 1);
      prevY.current = y;

      if (min && max) {
        setVal(currentVal.current * (max - min) + min);
      } else {
        setVal(currentVal.current);
      }
      sendMessage(cmd, currentVal);
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

  return (
    <div className={styles.wrapper}>
      <span>{label}</span>
      <div className={styles.container} onMouseDown={handleStart}>
        <div className={styles.circle} ref={containerRef}>
          <div className={styles.mark} />
        </div>
      </div>
      <span>{val.toFixed(2)}</span>
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
