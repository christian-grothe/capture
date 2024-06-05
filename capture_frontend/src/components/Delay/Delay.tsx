import { useState } from "react";
import Poti from "../Controllers/Poti/Poti";

const Delay = () => {
  const [value, setValue] = useState(0.3);
  const [modDepth, setModDepth] = useState(0.5);
  const [modIndex, setModIndex] = useState(1);
  return (
    <div className="container grow">
      <Poti
        label="Time"
        min={0}
        max={1}
        value={value}
        callback={setValue}
        modProps={{
          valueModDepth: modDepth,
          callbackModDepth: setModDepth,
          valueModIndex: modIndex,
          callbackModIndex: setModIndex,
        }}
      />
      <Poti
        label="Time"
        min={0}
        max={1}
        value={value}
        callback={setValue}
        modProps={{
          valueModDepth: modDepth,
          callbackModDepth: setModDepth,
          valueModIndex: modIndex,
          callbackModIndex: setModIndex,
        }}
      />
    </div>
  );
};

export default Delay;
