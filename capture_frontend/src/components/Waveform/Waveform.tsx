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
  const [startPos, setStartPos] = useState(0);
  const [endPos, setEndPos] = useState(0);
  const [isStartDragging, setIsStartDragging] = useState(false);
  const [isEndDragging, setIsEndDragging] = useState(false);

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
    setStartPos(canvas.width * 0.15);
    setEndPos(canvas.width * 0.85);
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
    context.fillRect(startPos, 0, 2, height);
    context.fillRect(endPos, 0, 2, height);
    context.fillStyle = "rgba(255, 255, 255, 0.1)";
    context.fillRect(startPos, 0, endPos - startPos, height);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    console.log(startPos, x);
    if (x === startPos) {
      console.log("startPos");
    } else if (x === endPos) {
      console.log("endpos");
    }
  };

  // useEffect(() => {
  //   if (!canvasRef.current) return;
  //   canvasRef.current.addEventListener("mousedown", (e) => {
  //     const rect = canvasRef.current?.getBoundingClientRect();
  //     const x = e.clientX - rect!.left;
  //     setStartPos(x);
  //   });
  // }, []);

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
  }, [context, startPos, endPos]);

  return (
    <div className={"container grow"}>
      <div className={styles.canvasContainer} ref={wrapperRef}>
        <div className={styles.record}>
          <button onClick={() => sendMessage("rec")}></button>
        </div>
        <canvas
          className={styles.canvas}
          ref={canvasRef}
          onClick={handleClick}
        />
      </div>
    </div>
  );
};

export default Waveform;
