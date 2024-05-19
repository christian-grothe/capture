import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import styles from "./styles/waveform.module.css";

const Waveform = () => {
  const sendMessage = useAppStore((state) => state.sendMessage);
  const captureNode = useAppStore((state) => state.captureNode);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const bufferToDraw = useRef<number[]>(new Array(129).fill(0.01));
  const startRef = useRef(0);
  const endRef = useRef(0);
  const [isStartDragging, setIsStartDragging] = useState(false);
  const [isEndDragging, setIsEndDragging] = useState(false);
  const [isDraggingLoop, setIsDraggingLoop] = useState(false);
  const [update, setUpdate] = useState(0);
const[distToStart,setDistToStart] = useState(0)

  const createContext = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvasRef.current.getContext(
      "2d",
    ) as CanvasRenderingContext2D;

    canvas.width = wrapperRef.current?.clientWidth || 400;
    canvas.height = wrapperRef.current?.clientHeight || 80;
    context.strokeStyle = "white";
    context.lineWidth = 0.5;
    startRef.current = canvas.width * 0.15;
    endRef.current = canvas.width * 0.85;
    setContext(context);
  };

  const draw = () => {
    if (!context || !canvasRef.current) return;

    context.fillStyle = "white";
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const canvasBaseline = canvasRef.current.height / 2;

    for (let i = 0; i < bufferToDraw.current.length; i++) {
      const bar = bufferToDraw.current[i];

      const height = bar * canvasRef.current.height;
      const x = (i / bufferToDraw.current.length) * canvasRef.current.width;
      const y = canvasBaseline - height / 2;

      context.fillRect(x, y, 2, height);
    }

    const height = canvasRef.current.height;
    context.fillRect(startRef.current, 0, 2, height);
    context.fillRect(endRef.current, 0, 2, height);
    context.fillStyle = "rgba(255, 255, 255, 0.1)";
    context.fillRect(
      startRef.current,
      0,
      endRef.current - startRef.current,
      height,
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x > startRef.current - 10 && x < startRef.current + 10) {
      setIsStartDragging(true);
    } else if (x > endRef.current - 10 && x < endRef.current + 10) {
      setIsEndDragging(true);
    } else if (x > startRef.current && x < endRef.current) {
      setIsDraggingLoop(true);
      setDistToStart(x-startRef.current)
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (isStartDragging) {
      startRef.current = x;
      const loopLength =
        (endRef.current - startRef.current) / canvasRef.current.width;
      sendMessage("setLoopLength", loopLength);
      sendMessage("setLoopStart", startRef.current / canvasRef.current.width);
    } else if (isEndDragging) {
      endRef.current = x;
      const loopLength =
        (endRef.current - startRef.current) / canvasRef.current.width;
      sendMessage("setLoopLength", loopLength);
    } else if (isDraggingLoop) {
      const diff = x - startRef.current - distToStart;
      startRef.current += diff;
      endRef.current += diff;
      sendMessage("setLoopStart", startRef.current / canvasRef.current.width);
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

    if (!captureNode) return;
    captureNode.port.onmessage = (event) => {
      switch (event.data.cmd) {
        case "audioData":
          bufferToDraw.current[event.data.index] = event.data.val;
          draw();
          break;
        default:
          break;
      }
    };
  }, [captureNode]);

  useEffect(() => {
    if (!context) return;
    draw();
  }, [context, update]);

  return (
    <div className={"container grow"}>
      <div className={styles.canvasContainer} ref={wrapperRef}>
        <div className={styles.record}>
          <button onClick={() => sendMessage("rec")}></button>
        </div>
        <canvas
          className={styles.canvas}
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        />
      </div>
    </div>
  );
};

export default Waveform;
