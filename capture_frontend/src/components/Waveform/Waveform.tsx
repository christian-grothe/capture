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

  const createContext = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvasRef.current.getContext(
      "2d",
    ) as CanvasRenderingContext2D;

    canvas.width = wrapperRef.current?.clientWidth || 400;
    canvas.height = wrapperRef.current?.clientHeight || 80;
    context.strokeStyle = "white";
    context.fillStyle = "white";
    context.lineWidth = 0.5;
    setContext(context);
  };

  const draw = () => {
    if (!context || !canvasRef.current) return;

    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const canvasBaseline = canvasRef.current.height / 2;

    for (let i = 0; i < bufferToDraw.current.length; i++) {
      const bar = bufferToDraw.current[i];

      const height = bar * canvasRef.current.height;
      const x = (i / bufferToDraw.current.length) * canvasRef.current.width;
      const y = canvasBaseline - height / 2;

      context.fillRect(x, y, 2, height);
    }
  };

  useEffect(() => {
    createContext();
  }, []);

  useEffect(() => {
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
  }, [context]);

  return (
    <div className={"container grow"}>
      <div className={styles.canvasContainer} ref={wrapperRef}>
        <div className={styles.record}>
          <button onClick={() => sendMessage("rec")}></button>
        </div>
        <canvas className={styles.canvas} ref={canvasRef} />
      </div>
    </div>
  );
};

export default Waveform;
