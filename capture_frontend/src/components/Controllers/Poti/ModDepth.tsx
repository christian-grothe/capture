import { useEffect, useRef, useState } from "react";
import styles from "./modDepth.module.css";
import { ModCommands } from "../../../types/types";
import { useAppStore } from "../../../store/useAppStore";

interface Props {
  modCmd: ModCommands;
}

const ModDepth = ({ modCmd }: Props) => {
  const [isActive, setIsActive] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sendMessage = useAppStore((state) => state.sendMessage);

  const handleMouseMove = (ev: MouseEvent) => {
    if (!isActive || !wrapperRef.current || !barRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    let y = (ev.clientY - rect.top) / wrapperRef.current.clientHeight;
    y = Math.min(Math.max(y, 0), 1);
    barRef.current.style.top = `${y * 100}%`;
    sendMessage(modCmd, 1 - y);
  };

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
