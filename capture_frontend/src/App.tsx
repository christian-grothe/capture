import './App.css'
import { Keyboard } from './components/keyboard/Keyboard';
import Poti from './components/poti/Poti'
import { useAppStore } from './store/useAppStore'

function App() {
  const init = useAppStore((state) => state.init);
  const record = useAppStore((state) => state.record);

  return (
    <>
      <h1>CAPTURE</h1>
      <button onClick={init}>INIT</button>
      <button onClick={record}>REC</button>
      <Poti />
      <Keyboard />
    </>
  )
}

export default App
