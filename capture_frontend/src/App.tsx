import "./App.css";
import { Keyboard } from "./components/Keyboard/Keyboard";
import ControllSection from "./components/ControllSection/ControllSection";
import { delay, granular } from "./components/ControllSection/controllers";
import LfoController from "./components/LfoController/LfoController";
import Waveforms from "./components/Waveform/Waveforms";

function App() {
  return (
    <div className="app">
      <div className="section gap">
        <LfoController />
        <Waveforms />
      </div>
      <div className="section gap">
        <div className="flex-column gap">
          <ControllSection label="Delay" controllers={delay} />
          <ControllSection label="Grain" controllers={granular} />
        </div>
        <Keyboard />
      </div>
    </div>
  );
}

export default App;
