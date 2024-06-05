import { useState } from "react";
import Poti from "../Controllers/Poti/Poti";
import styles from "./controllSection.module.css";

interface Props {
  index: number;
}

const ControllSection = ({ index }: Props) => {
  const [length, setLength] = useState([0.5, 0.3, 0.2, 0.8]);
  const [density, setDensity] = useState([0.5, 0.3, 0.2, 0.8]);
  const [speed, setSpeed] = useState([0.5, 0.3, 0.2, 0.8]);
  const [spray, setSpray] = useState([0.5, 0.3, 0.2, 0.8]);
  const [spread, setSpread] = useState([0.5, 0.3, 0.2, 0.8]);
  const [gain, setGain] = useState([0.5, 0.3, 0.2, 0.8]);

  return (
    <div className={styles.wrapper}>
      <Poti
        label="Length"
        value={length[index]}
        callback={(val: number) => {
          setLength((prev) => {
            const copy = [...prev];
            copy[index] = val;
            return copy;
          });
        }}
      />
      <Poti
        label="Density"
        value={density[index]}
        callback={(val: number) => {
          setDensity((prev) => {
            const copy = [...prev];
            copy[index] = val;
            return copy;
          });
        }}
      />
      <Poti
        label="Speed"
        value={speed[index]}
        callback={(val: number) => {
          setSpeed((prev) => {
            const copy = [...prev];
            copy[index] = val;
            return copy;
          });
        }}
      />
      <Poti
        label="Spray"
        value={spray[index]}
        callback={(val: number) => {
          setSpray((prev) => {
            const copy = [...prev];
            copy[index] = val;
            return copy;
          });
        }}
      />
      <Poti
        label="Spread"
        value={spread[index]}
        callback={(val: number) => {
          setSpread((prev) => {
            const copy = [...prev];
            copy[index] = val;
            return copy;
          });
        }}
      />
      <Poti
        label="Gain"
        value={gain[index]}
        callback={(val: number) => {
          setGain((prev) => {
            const copy = [...prev];
            copy[index] = val;
            return copy;
          });
        }}
      />
    </div>
  );
};

export default ControllSection;
