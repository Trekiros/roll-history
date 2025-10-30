import { TitleEntry } from "@/model/model"
import { FC } from "react"
import styles from './titleDisplay.module.scss'
import Image from "next/image"
import { Annotation } from "./tableDisplay"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChartLine } from "@fortawesome/free-solid-svg-icons"

const AnnotationStylesMap: {[type in Annotation["type"]]: string} = {
    "positive": styles.positive,
    "negative": styles.negative,
    "neutral": styles.neutral,
}

export const TitleDisplay: FC<{ title: TitleEntry, annotation: Annotation, onInspect: () => void }> = ({ title, annotation, onInspect }) => {
    return (
        <div className={styles.titleDisplay}>
            <a className={styles.titleLink} href={title.url} target="_blank">
                <Image src={title.img || "/img/defaultCover.png"} height={50} width={40} alt={`${title.name} cover art`} />
                <label>{title.name}</label>
                <div className={`${styles.annotation} ${AnnotationStylesMap[annotation.type]}`}>
                    {annotation.text}
                </div>
            </a>
            <button onClick={onInspect}>
                <FontAwesomeIcon icon={faChartLine} />
            </button>
        </div>
    )
}