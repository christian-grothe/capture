import { useRef, useState, useEffect } from "react";
import styles from "./poti.module.css";

const Poti = () => {
    const [isActive, setIsActive] = useState(false);
    const [val, setVal] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current || !isActive) return;
            const rect = containerRef.current.getBoundingClientRect();
            const y = e.clientY - rect.top;
            containerRef.current.style.transform = `rotate(${-45 - y * 2}deg)`;
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
        <div
            className={styles.container}
            onMouseDown={() => setIsActive(true)}
        >
            <div className={styles.circle} ref={containerRef}>
                <div className={styles.mark} />
            </div>
        </div>
    );
};

export default Poti;
