import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import styles from "./styles/waveform.module.css";

interface Props {
  bufferToDraw: number[];
  index: number;
}
const Waveform = ({ bufferToDraw, index }: Props) => {
  const sendMessage = useAppStore((state) => state.sendMessage);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const startRef = useRef<number[]>([]);
  const endRef = useRef<number[]>([]);
  const [isStartDragging, setIsStartDragging] = useState(false);
  const [isEndDragging, setIsEndDragging] = useState(false);
  const [isDraggingLoop, setIsDraggingLoop] = useState(false);
  const [update, setUpdate] = useState(0);
  const [distToStart, setDistToStart] = useState(0);

  const createContext = () => {
    if (!canvasRef.current || !wrapperRef.current || context) return;
    const canvas = canvasRef.current;
    canvas.width = wrapperRef.current.clientWidth;
    canvas.height = wrapperRef.current.clientHeight;

    const ctx = canvasRef.current.getContext("2d") as CanvasRenderingContext2D;

    ctx.strokeStyle = "white";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
      startRef.current[i] = canvas.width * 0.15;
      endRef.current[i] = canvas.width * 0.85;
    }
    setContext(ctx);
  };

  const draw = () => {
    if (!context || !canvasRef.current) return;

    context.fillStyle = "white";
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const canvasBaseline = canvasRef.current.height / 2;

    for (let i = 0; i < bufferToDraw.length; i++) {
      const bar = bufferToDraw[i];

      const height = bar * canvasRef.current.height;
      const x = (i / bufferToDraw.length) * canvasRef.current.width;
      const y = canvasBaseline - height / 2;

      context.fillRect(x, y, 2, height);
    }

    const height = canvasRef.current.height;
    context.fillRect(startRef.current[index], 0, 2, height);
    context.fillRect(endRef.current[index], 0, 2, height);
    context.fillStyle = "rgba(255, 255, 255, 0.1)";
    context.fillRect(
      startRef.current[index],
      0,
      endRef.current[index] - startRef.current[index],
      height,
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x > startRef.current[index] - 10 && x < startRef.current[index] + 10) {
      setIsStartDragging(true);
    } else if (
      x > endRef.current[index] - 10 &&
      x < endRef.current[index] + 10
    ) {
      setIsEndDragging(true);
    } else if (x > startRef.current[index] && x < endRef.current[index]) {
      setIsDraggingLoop(true);
      setDistToStart(x - startRef.current[index]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (isStartDragging) {
      startRef.current[index] = x;
      const loopLength =
        (endRef.current[index] - startRef.current[index]) /
        canvasRef.current.width;
      sendMessage({
        command: "setLoopLength",
        data: { value: loopLength, index },
      });
      sendMessage({
        command: "setLoopStart",
        data: {
          value: startRef.current[index] / canvasRef.current.width,
          index,
        },
      });
    } else if (isEndDragging) {
      endRef.current[index] = x;
      const loopLength =
        (endRef.current[index] - startRef.current[index]) /
        canvasRef.current.width;
      sendMessage({
        command: "setLoopLength",
        data: { value: loopLength, index },
      });
      setUpdate(x);
    } else if (isDraggingLoop) {
      const diff = x - startRef.current[index] - distToStart;
      startRef.current[index] += diff;
      endRef.current[index] += diff;
      sendMessage({
        command: "setLoopLength",
        data: {
          value: startRef.current[index] / canvasRef.current.width,
          index,
        },
      });
    }
    setUpdate(x);
  };

  useEffect(() => {
    createContext();
    window.addEventListener("mouseup", () => {
      setIsStartDragging(false);
      setIsEndDragging(false);
      setIsDraggingLoop(false);
    });
  }, []);

  useEffect(() => {
    if (!context) return;
    draw();
  }, [context, update, bufferToDraw]);

  return (
    <div className={styles.canvasContainer} ref={wrapperRef}>
      <div className={styles.record}>
        <button
          onClick={() =>
            sendMessage({ command: "rec", data: { value: index } })
          }
        ></button>
      </div>
      <canvas
        className={styles.canvas}
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      />
    </div>
  );
};

export default Waveform;
