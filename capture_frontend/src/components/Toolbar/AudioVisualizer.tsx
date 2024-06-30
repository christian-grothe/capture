import { useEffect, useRef, useState } from "react";
import styles from "./styles/toolbar.module.css";

interface Props {
  label: string;
  analyserNode: AnalyserNode | undefined;
}

export const AudioVisualizer = ({ label, analyserNode }: Props) => {
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();

  const createContext = () => {
    if (!canvasRef.current || !wrapperRef.current || context) return;
    const canvas = canvasRef.current;
    canvas.width = wrapperRef.current.clientWidth;
    canvas.height = wrapperRef.current.clientHeight;

    const ctx = canvasRef.current.getContext("2d") as CanvasRenderingContext2D;

    ctx.strokeStyle = "white";
    ctx.lineWidth = 0.5;
    setContext(ctx);
  };

  const draw = () => {
    if (!context || !canvasRef.current || !analyserNode) return;
    const canvas = canvasRef.current;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyserNode.getByteTimeDomainData(dataArray);

    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    context.lineWidth = 1;
    context.strokeStyle = "#ffa0aa";

    context.beginPath();

    const sliceWidth = (canvas.width * 1.0) / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }

      x += sliceWidth;
    }

    context.lineTo(canvas.width, canvas.height / 2);
    context.stroke();
  };

  useEffect(() => {
    createContext();
  }, [analyserNode]);

  useEffect(() => {
    if (!context || !AnalyserNode) return;

    const animate = () => {
      draw();
      requestRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(requestRef.current as number);
    };
  }, [context, analyserNode]);

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <span>{label}</span>
      <canvas ref={canvasRef} />
    </div>
  );
};
