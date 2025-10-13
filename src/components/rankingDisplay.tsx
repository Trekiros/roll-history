import { Ranking, TitleEntry } from "@/model/model";
import { FC, useEffect, useMemo, useState } from "react";
import styles from './rankingDisplay.module.scss'
import { motion, AnimatePresence } from "framer-motion";
import { TitleDisplay } from "./titleDisplay";

export const ANIMATION_DURATION = 0.5; // in seconds

export type Annotation = {
    text: string,
    type: "positive"|"negative"|"neutral"
}

export const RankingDisplay: FC<{ value: Ranking, previousValue: Ranking, titles: { [titleId: string]: TitleEntry } }> = ({ value, previousValue, titles }) => {
    const annotations = useMemo(() => {
        const result: {[titleId: string]: Annotation} = {}
        const oldIndices: {[titleId: string]: number} = {}

        // 1. Save old indices
        previousValue.titleIds.forEach((id, index) => {
            oldIndices[id] = index
            result[id] = { text: "X", type: "negative" }
        })

        // 2. Compare with new indices
        value.titleIds.forEach((id, index) => {
            const oldIndex = oldIndices[id]
            if (oldIndex === undefined) {
                result[id] = { text: "NEW!", type: "positive" }
            } else {
                if (index > oldIndex) {
                    result[id] = { text: `${oldIndex - index}`, type: "negative" }
                } else if (index < oldIndex) {
                    result[id] = { text: `+${oldIndex - index}`, type: "positive" }
                } else {
                    result[id] = { text: '-', type: 'neutral' }
                }
            }
        })

        return result
    }, [value, previousValue])
    
    return (
        <div className={styles.rankingDisplay}>
            <AnimatePresence>
                {value.titleIds.map(id => (
                    <motion.div 
                        layout="position" 
                        key={id} 

                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}>
                            <TitleDisplay title={titles[id]} annotation={annotations[id]} />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}