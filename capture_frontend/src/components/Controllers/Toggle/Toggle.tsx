import { useEffect, useState } from "react";
import styles from "./toggle.module.css";

interface Props {
  label: string;
  callback: (state: boolean) => void;
}

const Toggle = ({ label, callback }: Props) => {
  const [state, setState] = useState(false);

  useEffect(() => {
    callback(state);
  }, [state, callback]);

  return (
    <div className={styles.wrapper}>
      <span>{label}</span>
      <div
        onClick={() => setState(!state)}
        className={`${styles.toggle} ${state ? styles.active : ""}`}
      ></div>
    </div>
  );
};

export default Toggle;
