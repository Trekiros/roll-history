import { Category } from "@/model/model";
import { FC, useMemo, useState } from "react";
import styles from "./topDisplay.module.scss"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { GraphDisplay, oneMonthEarlier, oneMonthLater, oneYearEarlier, oneYearLater } from "./graphDisplay";
import Select from "./select";
import { months } from "./tableDisplay";
import { TitleDisplay } from "./titleDisplay";

function toTimestamp(year: number, month: number) {
    const date = new Date()
    date.setFullYear(year)
    date.setMonth(month)
    date.setDate(1)
    date.setHours(0)
    date.setMinutes(0)
    return date.getTime()
}

const now = new Date()

export const TopDisplay: FC<{ category: Category }> = ({ category }) => {
    const [startMonth, setStartMonth] = useState(now.getMonth())
    const [startYear, setStartYear] = useState(now.getFullYear() - 1)
    const [endMonth, setEndMonth] = useState(now.getMonth())
    const [endYear, setEndYear] = useState(now.getFullYear())
    const [top, setTop] = useState(10)
    const [mode, setMode] = useState<"months present"|"average rank">("months present")
    const [inspect, setInspect] = useState<string|null>(null)

    const start = toTimestamp(startYear, startMonth)
    const end = toTimestamp(endYear, endMonth  + 1)

    const ranking = useMemo(() => {
        const startTimestamp = toTimestamp(startYear, startMonth)
        const endTimestamp = toTimestamp (endYear, endMonth + 1)

        const scoreMap: {[titleId: string]: number} = {}
        for (const ranking of category.rankings) {
            if ((ranking.timestamp >= startTimestamp) && (ranking.timestamp <= endTimestamp)) {
                const max = (mode === "months present") ? Math.min(top, ranking.titleIds.length) : ranking.titleIds.length
                for (let i = 0 ; i < max ; i++) {
                    const titleId = ranking.titleIds[i]

                    const score = (mode === "months present") ? 1 : i
                    
                    scoreMap[titleId] ||= 0
                    scoreMap[titleId] += 80 - score
                }
            }
        }
        
        return Array.from(Object.keys(scoreMap)).sort((id1, id2) => scoreMap[id2] - scoreMap[id1])
    }, [startMonth, startYear, endMonth, endYear, top, mode])

    if (inspect) return <>
        <button className={styles.returnBtn} onClick={() => setInspect(null)}>
            <FontAwesomeIcon icon={faChevronLeft} />
            Return
        </button>
        <GraphDisplay category={category} initialFilter={[inspect]} />
    </>

    return (
        <div className={styles.topDisplay}>
            <div className={styles.mode}>
                <button onClick={() => setMode("months present")} disabled={mode === "months present"}>
                    Sort by months spent in the top X
                </button>
                <button onClick={() => setMode("average rank")} disabled={mode === "average rank"}>
                    Sort by average rank over the period
                </button>
            </div>

            { (mode === "months present") && (
                <div className={styles.top}>
                    <label>Months spent in the top:</label>
                    <input 
                        type="number"
                        value={top}
                        onChange={e => setTop(Number(e.target.value))} />
                </div>
            )}

            <div className={styles.header}>
                { /* START DATE */ }
                <div className={styles.start}>
                    <label>From:</label>
                    <div className={styles.month}>
                        <button onClick={() => {
                            if (startMonth === 0) {
                                setStartYear(startYear - 1)
                                setStartMonth(11)
                            } else {
                                setStartMonth(startMonth - 1)
                            }
                        }}>
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <Select
                            className={styles.select}
                            classNames={{
                                control: () => styles.selectInput,
                            }}
                            value={startMonth}
                            options={months.map((label, value) => ({ label, value }))}
                            onChange={newValue => setStartMonth(newValue)} />
                        <button 
                            disabled={oneMonthLater(start) >= oneMonthEarlier(end)} 
                            onClick={() => {
                                if (startMonth === 11) setStartYear(startYear + 1)
                                setStartMonth((startMonth + 1) % 12)
                            }}>
                                <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>
                    <div className={styles.year}>
                        <button onClick={() => setStartYear(startYear - 1)}>
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <input type="number" value={startYear} onChange={e => setStartYear(Number(e.target.value))} />
                        <button 
                            disabled={oneYearLater(start) >= end}
                            onClick={() => setStartYear(startYear + 1)}>
                                <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>
                </div>

                { /* END DATE */ }
                <div className={styles.start}>
                    <label>To:</label>
                    <div className={styles.month}>
                        <button
                            disabled={oneMonthEarlier(end) <= oneMonthLater(start)} 
                            onClick={() => {
                                if (endMonth === 0) {
                                    setEndYear(endYear - 1)
                                    setEndMonth(11)
                                } else {
                                    setEndMonth(endMonth - 1)
                                }
                            }}>
                                <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <Select
                            className={styles.select}
                            classNames={{
                                control: () => styles.selectInput,
                            }}
                            value={endMonth}
                            options={months.map((label, value) => ({ label, value }))}
                            onChange={newValue => setEndMonth(newValue)} />
                        <button onClick={() => {
                            if (endMonth === 11) setEndYear(endYear + 1)
                            setEndMonth((endMonth + 1) % 12)
                        }}>
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>
                    <div className={styles.year}>
                        <button 
                            disabled={oneYearEarlier(end) <= start}
                            onClick={() => setEndYear(endYear - 1)}>
                                <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <input type="number" value={endYear} onChange={e => setEndYear(Number(e.target.value))} />
                        <button onClick={() => setEndYear(endYear + 1)}>
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>
                </div>
            </div>


            <div className={styles.ranking}>
                {ranking.map((titleId, i) => (
                    <div key={titleId} className={styles.row}>
                        <label className={styles.rank}>{i+1}:</label>
                        <TitleDisplay 
                            annotation={{ text: "", type: "neutral" }} 
                            title={category.titles[titleId]}
                            onInspect={() => setInspect(titleId)} />
                    </div>
                ))}
            </div>
        </div>
    )
}