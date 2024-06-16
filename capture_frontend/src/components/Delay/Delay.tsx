import { useState } from "react";
import Poti from "../Controllers/Poti/Poti";

const Delay = () => {
  const [value, setValue] = useState(0.3);
  const [modDepth, setModDepth] = useState(0.5);
  const [modIndex, setModIndex] = useState(1);
  return (
    <div className="container">
      <span style={{width:"100%", display:"flex",justifyContent:"flex-end"}}>Delay</span>
      <div className="center" style={{ marginTop: "15px" }}>
        <div className="flex-row center full-width large-gap margin-top-bottom">
          <Poti
            label="Time"
            value={value}
            callback={setValue}
            modProps={{
              valueModDepth: modDepth,
              callbackModDepth: setModDepth,
              valueModIndex: modIndex,
              callbackModIndex: setModIndex,
            }}
          />
          <Poti label="Feedback" value={value} callback={setValue} />
        </div>
        <div className="flex-row center full-width large-gap margin-top-botom">
          <Poti
            label="In"
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
            label="Out"
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
        <div
          className="flex-row full-width center  margin-top-bottom"
          style={{ justifyContent: "center" }}
        >
          <Poti
            label="Lazyness"
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
      </div>
    </div>
  );
};

export default Delay;
