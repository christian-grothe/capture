import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import styles from "./styles/waveform.module.css";

import Waveform from "./Waveform";
import Thumbnail from "./Thumbnail";
import ControllSection from "../ControllSection/ControllSection";

const Waveforms = () => {
  const captureNode = useAppStore((state) => state.captureNode);
  const buffersToDraw = useRef<number[][]>([
    new Array(256).fill(0.01),
    new Array(256).fill(0.01),
    new Array(256).fill(0.01),
    new Array(256).fill(0.01),
  ]);
  const [, setRenderTrigger] = useState(0);
  const [selectedBuffer, setSelectedBuffer] = useState(0);

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
    <div className="container flex-column gap">
      <div className={styles.thumbnailContainer}>
        {buffersToDraw.current.map((buffer, i) => (
          <Thumbnail
            key={i}
            audioBuffer={buffer}
            selectBuffer={() => setSelectedBuffer(i)}
            isSelected={selectedBuffer === i}
          />
        ))}
      </div>
      <Waveform
        index={selectedBuffer}
        bufferToDraw={buffersToDraw.current[selectedBuffer]}
      />
      <ControllSection index={selectedBuffer} />
    </div>
  );
};

export default Waveforms;
