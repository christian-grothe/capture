import './App.css'
import { Keyboard } from './components/keyboard/Keyboard';
import { useAppStore } from './store/useAppStore'
import Poti from './components/controllers/Poti/Poti'

function App() {
  const init = useAppStore((state) => state.init);
  const record = useAppStore((state) => state.record);

  return (
    <>
      <h1>CAPTURE</h1>
      <div>
        <button onClick={init}>Init</button>
        <button onClick={record}>Record</button>
      </div>
      <Poti label={"test"} />
      <Poti label={"test"} />
      <Keyboard />
    </>
  )
}

export default App
