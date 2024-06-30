import styles from "./modIndex.module.css";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

interface Props {
  min?: number;
  max?: number;
  callback:
    | React.Dispatch<React.SetStateAction<number>>
    | ((val: number) => void);
  value: number;
}

const ModIndex = ({ min, max, callback, value }: Props) => {
  const handleClick = (operation: "inc" | "dec") => {
    if (
      (min && value === min && operation === "dec") ||
      (max && value === max && operation === "inc")
    )
      return;
    if (operation === "inc") {
      callback(value + 1);
    } else {
      callback(value - 1);
    }
  };


  return (
    <div className={styles.wrapper}>
      <IoIosArrowBack size={20} onClick={() => handleClick("dec")} />
      <span>{value}</span>
      <IoIosArrowForward size={20} onClick={() => handleClick("inc")} />
    </div>
  );
};

export default ModIndex;
