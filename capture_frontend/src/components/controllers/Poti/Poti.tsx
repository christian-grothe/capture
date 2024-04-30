import { useRef, useState, useEffect } from "react";
import styles from "./poti.module.css";

interface Props {
  label: string;
}

const Poti = ({ label }: Props) => {
  const [isActive, setIsActive] = useState(false);
  const [val, setVal] = useState(0);
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
        currentPos.current += 6;
      } else {
        currentPos.current -= 6;
      }

      prevY.current = y;

      if (currentPos.current < -45 || currentPos.current > 220) return;

      setVal((currentPos.current + 45) / 265);

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
      {label}
      <div className={styles.container} onMouseDown={handleStart}>
        <div className={styles.circle} ref={containerRef}>
          <div className={styles.mark} />
        </div>
      </div>
      {val.toFixed(2)}
    </div>
  );
};

export default Poti;
