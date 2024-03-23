import './App.css'
import { useAppStore } from './store/useAppStore'

function App() {
  const init = useAppStore((state) => state.init)
  const record = useAppStore((state) => state.record)
  const playNote = useAppStore((state) => state.playNote)
  const stopNote = useAppStore((state) => state.stopNote)
  return (
    <>
      <h1>CAPTURE</h1>
      <button onClick={init}>INIT</button>
      <button onClick={record}>REC</button>
      <button onMouseDown={playNote} onMouseUp={stopNote}>Play</button>
    </>
  )
}

export default App
