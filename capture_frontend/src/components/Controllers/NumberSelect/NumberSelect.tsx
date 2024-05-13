import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import styles from "./numberselect.module.css";
import { useState } from "react";

interface Props {
  callback?: (operation: "inc" | "dec") => void;
  label: string;
  min?: number;
  max?: number;
  initVal?: number;
}

const NumberSelect = ({ callback, label, min, max, initVal }: Props) => {
  const [value, setValue] = useState(initVal || 0);

  const handleClick = (operation: "inc" | "dec") => {
    if (
      (min && value === min && operation === "dec") ||
      (max && value === max && operation === "inc")
    )
      return;
    if (operation === "inc") {
      setValue((prev) => prev + 1);
    } else {
      setValue((prev) => prev - 1);
    }
    if (callback) {
      callback(operation);
    }
  };

  return (
    <div className={styles.wrapper}>
      <span>{label}</span>
      <div className={styles.controls}>
        <button onClick={() => handleClick("dec")}>
          <IoIosArrowBack size={30} />
        </button>
        <span>{value}</span>
        <button onClick={() => handleClick("inc")}>
          <IoIosArrowForward size={30} />
        </button>
      </div>
    </div>
  );
};

export default NumberSelect;
