import { TitleEntry } from "@/model/model"
import { FC } from "react"
import styles from './titleDisplay.module.scss'
import Image from "next/image"
import { Annotation } from "./rankingDisplay"

const AnnotationStylesMap: {[type in Annotation["type"]]: string} = {
    "positive": styles.positive,
    "negative": styles.negative,
    "neutral": styles.neutral,
}

export const TitleDisplay: FC<{ title: TitleEntry, annotation: Annotation }> = ({title, annotation}) => {
    return (
        <a className={styles.titleDisplay} href={title.url} target="_blank">
            <Image src={title.img || "/img/defaultCover.png"} height={50} width={40} alt={`${title.name} cover art`} />
            <label>{title.name}</label>
            <div className={`${styles.annotation} ${AnnotationStylesMap[annotation.type]}`}>
                {annotation.text}
            </div>
        </a>
    )
}