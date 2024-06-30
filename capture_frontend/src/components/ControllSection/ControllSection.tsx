import { Controller } from "../../types/types";
import Poti from "../Controllers/Poti/Poti";
import styles from "./controllSection.module.css";

interface Props {
  label?: string;
  controllers: Controller[];
}

const ControllSection = ({controllers }: Props) => {
  return (
    <div className={styles.wrapper}>
        {controllers.map((controller) => (
          <Poti
            key={controller.cmd}
            cmd={controller.cmd}
            modCmd={controller.modCmd}
            modIdCmd={controller.modIdCmd}
            label={controller.label}
            min={controller.min}
            max={controller.max}
          />
        ))}
    </div>
  );
};

export default ControllSection;
