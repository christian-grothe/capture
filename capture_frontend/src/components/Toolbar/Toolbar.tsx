import { useAppStore } from "../../store/useAppStore";
import { AudioVisualizer } from "./AudioVisualizer";

const Toolbar = () => {
  const inputAnalyserNode = useAppStore((state) => state.inputAnalyserNode);
  const outputAnalyserNode = useAppStore((state) => state.outputAnalyserNode);
  return (
    <div className="small-container no-border flex-row">
      <div className="flex-row large-gap">
        <AudioVisualizer label={"In"} analyserNode={inputAnalyserNode} />
        <AudioVisualizer label={"Out"} analyserNode={outputAnalyserNode}/>
      </div>
      <div className="logo">Capture</div>
    </div>
  );
};

export default Toolbar;
