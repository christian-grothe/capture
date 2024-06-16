import styles from "./waveformSelect.module.css";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import {
  PiWaveSquareLight,
  PiWaveSineLight,
  PiWaveSawtoothLight,
} from "react-icons/pi";
import { LuBarChart2 } from "react-icons/lu";
import { useEffect, useState } from "react";
import { Waveform } from "../../../types/types";
import { useAppStore } from "../../../store/useAppStore";

interface Props {
  index: number;
}
const WaveformSelect = ({ index }: Props) => {
  const sendMessage = useAppStore((state) => state.sendMessage);
  const [currentWaveform, setCurrentWaveform] = useState<Waveform>(
    Waveform.Sine,
  );
  const [hasInteraction, setHasInteraction] = useState<boolean>(false);
  const [icons] = useState([
    PiWaveSineLight,
    PiWaveSawtoothLight,
    LuBarChart2,
    PiWaveSquareLight,
  ]);

  const handleClick = (operation: "inc" | "dec") => {
    setHasInteraction(true);
    if (currentWaveform === 0 && operation === "dec") {
      setCurrentWaveform(icons.length - 1);
      return;
    }
    if (currentWaveform === icons.length - 1 && operation === "inc") {
      setCurrentWaveform(0);
      return;
    }
    if (operation === "inc") {
      setCurrentWaveform((prev) => prev + 1);
    } else {
      setCurrentWaveform((prev) => prev - 1);
    }
  };

  useEffect(() => {
    if (!hasInteraction) return;
    sendMessage({ command: "setWaveform", data: { waveform: currentWaveform, index } });
  }, [currentWaveform]);

  return (
    <div className={styles.wrapper}>
      <IoIosArrowUp size={30} onClick={() => handleClick("inc")} />
      {icons[currentWaveform]({ size: 30 })}
      <IoIosArrowDown size={30} onClick={() => handleClick("dec")} />
    </div>
  );
};

export default WaveformSelect;
