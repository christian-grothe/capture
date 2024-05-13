import { useEffect, useState } from "react";
import styles from "./modIndex.module.css";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { useAppStore } from "../../../store/useAppStore";
import { ModCommands } from "../../../types/types";

interface Props {
  min?: number;
  max?: number;
  cmd: ModCommands;
}

const ModIndex = ({ min, max, cmd }: Props) => {
  const [value, setValue] = useState(1);
  const sendMessage = useAppStore((state) => state.sendMessage);

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
  };

  useEffect(() => {
    sendMessage(cmd, value - 1);
  }, [value]);

  return (
    <div className={styles.wrapper}>
      <IoIosArrowBack size={20} onClick={() => handleClick("dec")} />
      <span>{value}</span>
      <IoIosArrowForward size={20} onClick={() => handleClick("inc")} />
    </div>
  );
};

export default ModIndex;
