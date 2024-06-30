import "./App.css";
import Delay from "./components/Delay/Delay";
import Keyboard from "./components/Keyboard/Keyboard";
import LfoController from "./components/LfoController/LfoController";
import Waveforms from "./components/Waveform/Waveforms";
import Toolbar from "./components/Toolbar/Toolbar";

function App() {
  return (
    <div className="app">
      <Toolbar />
      <div className="section gap">
        <Waveforms />
        <Delay />
      </div>
      <div className="section gap">
        <Keyboard />
        <LfoController />
      </div>
    </div>
  );
}

export default App;
