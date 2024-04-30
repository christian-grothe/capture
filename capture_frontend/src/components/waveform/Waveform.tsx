import { useAppStore } from "../../store/useAppStore";
import styles from "./styles/waveform.module.css";



const Waveform = () => {
  const caputerNode = useAppStore((state) => state.captureNode);
  return (
    <div className={styles.wrapper}>
      <canvas className={styles.canvas} />
    </div>
  );
};

export default Waveform;
