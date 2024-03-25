import { Key } from "./Key"
import styles from "./keyboard.module.css"
export const Keyboard = () => {
    return (
        <div className={styles.keyboard}>
            <Key midiNote={60} />
            <Key midiNote={62} />
            <Key midiNote={63} />
            <Key midiNote={65} />
            <Key midiNote={67} />
            <Key midiNote={68} />
            <Key midiNote={70} />
            <Key midiNote={72} />
        </div>
    )
}
