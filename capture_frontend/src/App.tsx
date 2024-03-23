import './App.css'
import { useAppStore } from './store/useAppStore'

function App() {
  const init = useAppStore((state) => state.init)
  return (
    <>
      <h1>CAPTURE</h1>
      <button onClick={init}>INIT</button>
    </>
  )
}

export default App
