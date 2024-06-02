import { useEffect, useRef, useState } from "react";

interface Props {
  audioBuffer: number[];
}

const Thumbnail = ({ audioBuffer }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

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
    setContext(context);
  };

  const draw = () => {
    if (!context || !canvasRef.current) return;

    context.fillStyle = "white";
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const canvasBaseline = canvasRef.current.height / 2;

    for (let i = 0; i < audioBuffer.length; i++) {
      const bar = audioBuffer[i];

      const height = bar * canvasRef.current.height;
      const x = (i / audioBuffer.length) * canvasRef.current.width;
      const y = canvasBaseline - height / 2;

      context.fillRect(x, y, 2, height);
    }
  };

  useEffect(() => {
    draw();
  }, [audioBuffer]);

  useEffect(() => {
    createContext();
  }, []);

  return (
    <div ref={wrapperRef}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default Thumbnail;
