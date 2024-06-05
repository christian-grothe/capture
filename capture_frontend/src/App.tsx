import "./App.css";
import Delay from "./components/Delay/Delay";
import { Keyboard } from "./components/Keyboard/Keyboard";
import LfoController from "./components/LfoController/LfoController";
import Waveforms from "./components/Waveform/Waveforms";

function App() {
  return (
    <div className="app">
      <div className="section gap">
        <Waveforms />
        <Delay />
      </div>
      <div className="section gap">
      </div>
    </div>
  );
}

export default App;
