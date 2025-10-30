import { Category } from "@/model/model";
import { FC, useEffect, useMemo, useState } from "react";
import styles from './tableDisplay.module.scss'
import { motion, AnimatePresence } from "framer-motion";
import { TitleDisplay } from "./titleDisplay";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import Select from "./select";
import { GraphDisplay } from "./graphDisplay";

export type Annotation = {
    text: string,
    type: "positive"|"negative"|"neutral"
}

export const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export const TableDisplay: FC<{ category: Category }> = ({ category }) => {
    const [month, setMonth] = useState(3)
    const [year, setYear] = useState(2016)
    const [inspect, setInspect] = useState<null|string>(null)
    const [playing, setPlaying] = useState(false)

    useEffect(() => {
        if (!playing) return;

        const intervalId = setInterval(() => {
            if (month === 11) {
                setMonth(0)
                setYear(year + 1)
            } else {
                setMonth(month + 1)
            }
        }, 2000)

        return () => clearInterval(intervalId)
    }, [playing, year, month])

    const index = useMemo(() => {
        const date = new Date()
        date.setFullYear(year)
        date.setMonth(month)
        date.setDate(1)
        date.setHours(0)
        date.setMinutes(0)
        const timestamp = date.getTime()

        const result = category.rankings.findIndex(ranking => ranking.timestamp > timestamp)
        if (result === -1) return category.rankings.length - 1
        
        return result
    }, [month, year])

    const value = category.rankings[index]
    const previousValue = category.rankings[Math.max(0, index - 1)]

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

    if (!category) return <>
        Loading...
    </>

    if (inspect) return <>
        <button className={styles.returnBtn} onClick={() => setInspect(null)}>
            <FontAwesomeIcon icon={faChevronLeft} />
            Return
        </button>
        <GraphDisplay category={category} initialFilter={[inspect]} />
    </>

	return <>
        <div className={styles.header}>
            <button onClick={() => setPlaying(!playing)}>
                {playing ? <>
                    Pause <FontAwesomeIcon icon={faPause} />
                </> : <>
                    Auto-Play <FontAwesomeIcon icon={faPlay} />
                </>}
            </button>

            <div className={styles.timePicker}>
                <div className={styles.month}>
                    <button
                        disabled={playing} 
                        onClick={() => {
                            if (month === 0) {
                                setYear(year - 1)
                                setMonth(11)
                            } else {
                                setMonth(month - 1)
                            }
                        }}>
                            <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    <Select
                        disabled={playing}
                        className={styles.select}
                        classNames={{
                            control: () => styles.selectInput,
                        }}
                        value={month}
                        options={months.map((label, value) => ({ label, value }))}
                        onChange={newValue => setMonth(newValue)} />
                    <button 
                        disabled={playing}
                        onClick={() => {
                            if (month === 11) setYear(year + 1)
                            setMonth((month + 1) % 12)
                        }}>
                            <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                </div>
                <div className={styles.year}>
                    <button 
                        disabled={playing}
                        onClick={() => setYear(year - 1)}>
                            <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    <input
                        disabled={playing}
                        type="number" 
                        value={year} 
                        onChange={e => setYear(Number(e.target.value))} />
                    <button
                        disabled={playing}
                        onClick={() => setYear(year + 1)}>
                            <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                </div>
            </div>
        </div>
        <div className={styles.rankingDisplay}>
            <AnimatePresence>
                {value.titleIds.map(id => (
                    <motion.div 
                        layout="position" 
                        key={id} 

                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}>
                            <TitleDisplay
                                title={category.titles[id]}
                                annotation={annotations[id]} 
                                onInspect={() => setInspect(id)}/>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
	</>
}

