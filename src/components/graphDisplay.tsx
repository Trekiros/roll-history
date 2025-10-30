import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale }  from 'chart.js';
import type { ChartData, ChartDataset, ChartOptions } from 'chart.js';
import MultiSelect from "@/components/multiselect";
import { FC, useMemo, useState } from 'react';
import { Category } from '@/model/model';
import styles from "./graphDisplay.module.scss"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import Select from './select';
import { months } from './tableDisplay';
import 'chartjs-adapter-luxon';
import { DateTime } from "luxon";

const tooltipTypes = ["nearest", "dataset", "x"] as const

// Enables tree-shaking to reduce bundle size
ChartJS.register(CategoryScale, LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend)

export const GraphDisplay: FC<{ category: Category, initialFilter?: string[] }> = ({ category, initialFilter }) => {
	const { initialStartMonth, initialStartYear, initialEndYear, initialEndMonth, initialTop } = initialParams(category, initialFilter)
    const [tooltipTypeIndex, setTooltipTypeIndex] = useState(0)

    const [startMonth, setStartMonth] = useState(initialStartMonth)
    const [startYear, setStartYear] = useState(initialStartYear)
    const [endMonth, setEndMonth] = useState(initialEndMonth)
    const [endYear, setEndYear] = useState(initialEndYear)

    const start = useMemo(() => {
        const date = new Date()
        date.setFullYear(startYear)
        date.setMonth(startMonth)
        date.setDate(1)
        date.setHours(0)
        date.setMinutes(0)
        return date.getTime()
    }, [startMonth, startYear])

    const end = useMemo(() => {
        const date = new Date()
        date.setFullYear(endYear)
        date.setMonth(endMonth + 1)
        date.setDate(1)
        date.setHours(0)
        date.setMinutes(0)
        return date.getTime()
    }, [endMonth, endYear])

    const [top, setTop] = useState(initialTop)
    
	const [filter, setFilter] = useState<string[]>(initialFilter || [])

	const options: ChartOptions<"line"> = useMemo(() => ({
		responsive: true,
		interaction: { mode: "index", intersect: false },
		scales: {
			x: {
                type: 'time',
                time: {
                    units: 'months',
                    displayFormats: {
                        month: 'MMM yyyy',
                    },
                    tooltipFormat: 'MMM yyyy',
                },
				grid: { color: "#fff0" },
				ticks: { color: "#fff" },
			},
			y: {
				type: "linear",
				display: true,
				position: "left",
				max: top + 0.05,
				min: 0.95,
				reverse: true,
				grid: { color: "#fff0" },
				ticks: {
					color: "#fff",
					stepSize: top <= 15 ? 1
						: (top <= 30) ? 2
						: 5,
					callback: (value) => Math.round(Number(value)),
				},
			},
		},
		plugins: {
			legend: { display: false },
            tooltip: {
                mode: tooltipTypes[tooltipTypeIndex],
                callbacks: {
                    footer: () => (tooltipTypeIndex === 0) ? "Click to show each title's history"
                        : (tooltipTypeIndex === 1) ? "Click to show the ranking for this month"
                        : "Click to show only the point you're hovering",
                }
            }
		},
	}), [category, start, end, top, tooltipTypeIndex])

	const data = useMemo(() => {
		const filteredRankings = category.rankings.filter(ranking => (
			(ranking.timestamp >= start) && (ranking.timestamp <= end)
		))

		const datasets: ChartDataset<"line">[] = []
		for (const titleId in category.titles) {
			if (filter.length && !filter.find(id => id === titleId)) continue;

			const { name, url, img } = category.titles[titleId]
			
			const color = idToColor(Number(titleId))

			const dataset: ChartDataset<"line"> = {
				label: name,
				data: [],
				yAxisID: 'y',
				borderColor: color,
				backgroundColor: color,
				borderWidth: 2,
				tension: 0.25,
			}

			let appears = false
			for (const ranking of filteredRankings) {
				const index = ranking.titleIds.indexOf(titleId) + 1
				if ((index > 0) && (index <= top)) {
					appears = true
					dataset.data.push({ x: ranking.timestamp, y: index })
				} else {
                    dataset.data.push({ x: ranking.timestamp, y: null })
                }
			}

			if (appears) {
				datasets.push(dataset)
			}
		}
		
		const result: ChartData<"line"> = {
			datasets,
		}
		return result
	}, [category, start, end, top, filter])

	const filterOptions = useMemo(() => {
		const uniqueIds = new Set<string>()
		for (const ranking of category.rankings) {
			if ((ranking.timestamp >= start) && (ranking.timestamp <= end)) {
				for (let i = 0 ; (i < top) && (i < ranking.titleIds.length)  ; i++) {
					uniqueIds.add(ranking.titleIds[i])
				}
			}
		}

		return Array.from(uniqueIds).map(titleId => ({ label: category.titles[titleId].name, value: titleId }))
	}, [category, start, end, top])
	
	return (
        <div className={styles.graphDisplay}>
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
                            disabled={oneMonthLater(oneMonthLater(start)) >= oneMonthEarlier(end)} 
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
                            disabled={oneMonthEarlier(oneMonthEarlier(end)) <= oneMonthLater(start)} 
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

            <div className={styles.graphContainer} onClick={() => setTooltipTypeIndex((tooltipTypeIndex + 1) % tooltipTypes.length)}>
                <Line 
                    options={options} 
                    data={data}/>
            </div>

            <div className={styles.footer}>
                <div className={styles.filter}>
                    <label>Filter:</label>
                    <MultiSelect value={filter} onChange={setFilter} options={filterOptions} />
                </div>
                <div className={styles.top}>
                    <label>Show Top:</label>
                    <input type="number" value={top} min={1} max={80} onChange={e => setTop(Number(e.target.value))} />
                </div>
            </div>
        </div>
    )
}









function idToColor(id: number): string {
	// This angle ensures the colors will be evenly spread across the color wheel
	const goldenAngle = 137.508;

	const hue = (id * goldenAngle) % 360;
	const saturation = 60; // %
	const lightness = 60;  // %

	// Return as CSS HSL string
	return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function oneMonthEarlier(timestamp: number) {
    const date = new Date(timestamp)
	date.setMonth(date.getMonth() - 1)
	return date.getTime()
}

export function oneMonthLater(timestamp: number) {
    const date = new Date(timestamp)
	date.setMonth(date.getMonth() + 1)
	return date.getTime()
}

export function oneYearEarlier(timestamp: number) {
    const date = new Date(timestamp)
	date.setFullYear(date.getFullYear() - 1)
	return date.getTime()
}

export function oneYearLater(timestamp: number) {
    const date = new Date(timestamp)
	date.setFullYear(date.getFullYear() + 1)
	return date.getTime()
}

function initialParams(category: Category, initialFilter?: string[]) {
    if (!initialFilter) {
        const fiveYearsAgo = new Date()
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
 
        return {
            initialStartYear: fiveYearsAgo.getFullYear(),
            initialStartMonth: fiveYearsAgo.getMonth(),
            initialEndYear: new Date().getFullYear(),
            initialEndMonth: new Date().getMonth(),
            initialTop: 10,
        }
    }

    let firstAppearance = undefined
    let lastAppearance = undefined
    let worstRanking = undefined
    for (const ranking of category.rankings) {
        const position = ranking.titleIds.findLastIndex(titleId => initialFilter.includes(titleId))
        if (position !== -1) {
            if ((firstAppearance === undefined) || (firstAppearance > ranking.timestamp)) firstAppearance = ranking.timestamp
            if ((lastAppearance === undefined) || (lastAppearance < ranking.timestamp)) lastAppearance = ranking.timestamp
            if ((worstRanking === undefined) || (worstRanking < position + 1)) worstRanking = position + 1
        }
    }
    if (
        (firstAppearance === undefined)
     || (lastAppearance === undefined)
     || (worstRanking === undefined)
    ) {
        return initialParams(category, undefined)
    }

    const initialStart = new Date(Math.min(firstAppearance, oneMonthEarlier(lastAppearance)))
    const initialEnd = new Date(Math.max(lastAppearance, oneMonthLater(firstAppearance)))

    return {
        initialStartYear: initialStart.getFullYear(),
        initialStartMonth: initialStart.getMonth(),
        initialEndYear: initialEnd.getFullYear(),
        initialEndMonth: initialEnd.getMonth(),
        initialTop: Math.max(worstRanking, 10),
    }
}