import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../../store/useAppStore";

import Waveform from "./Waveform";

const Waveforms = () => {
  const captureNode = useAppStore((state) => state.captureNode);
  const buffersToDraw = useRef<number[][]>([
    new Array(128).fill(0.01),
    new Array(128).fill(0.01),
    new Array(128).fill(0.01),
    new Array(128).fill(0.01),
  ]);  
  const [, setRenderTrigger] = useState(0); 

  useEffect(() => {
    if (!captureNode) return;
    captureNode.port.onmessage = (event) => {
      if (event.data.cmd === "audioData") {
        const { data, bufIndex } = event.data;
        buffersToDraw.current[bufIndex] = data;
        setRenderTrigger((prev) => prev + 1);
      }
    };
  }, [captureNode]);

  return (
    <div className="container grow">
      {buffersToDraw.current.map((buffer, i) => (
        <Waveform key={i} index={i} bufferToDraw={buffer} />
      ))}
    </div>
  );
};

export default Waveforms;
