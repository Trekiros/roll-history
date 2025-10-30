import { Category } from "@/model/model";
import { FC, useState } from "react";
import styles from "./topDisplay.module.scss"

export const TopDisplay: FC<{ category: Category }> = () => {
    const [top, setTop] = useState(1)


    return (
        <div className={styles.topDisplay}>

        </div>
    )
}