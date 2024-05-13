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
  const currentPos = useRef(0);
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
        currentPos.current += 4;
      } else {
        currentPos.current -= 4;
      }

      prevY.current = y;

      const currentVal = (currentPos.current + 45) / 265;
      const bounds = { min: min || 0, max: max || 1 };
      if (currentVal < bounds.min) {
        setVal(bounds.min);
        sendMessage(cmd, bounds.min);
        return;
      } else if (currentVal > bounds.max) {
        setVal(bounds.max);
        sendMessage(cmd, bounds.max);
        return;
      }
      setVal(currentVal);
      sendMessage(cmd, currentVal);

      containerRef.current.style.transform = `rotate(${currentPos.current}deg)`;
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
