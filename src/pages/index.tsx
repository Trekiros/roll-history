import { RankingDisplay } from "@/components/rankingDisplay";
import { Category } from "@/model/model";
import { fetchCategory, usePromise } from "@/model/utils";
import { FC, useMemo, useState } from "react";
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend }  from 'chart.js';
import type { ChartData, ChartDataset, ChartOptions } from 'chart.js';
import Select from "react-select/base";
import MultiSelect from "@/components/multiselect";

// Enables tree-shaking to reduce bundle size
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function Home() {
    const dmsguild = usePromise(() => fetchCategory("data/dmsguild.json"))
	const [displayType, setDisplayType] = useState<"table"|"graph">("table")

	return (
		<div className="">
			<h1>Roll History</h1>
			<button onClick={() => setDisplayType(displayType === "table" ? "graph" : "table")}>
				Change display type
			</button>

			{ !!dmsguild.data && (
				(displayType === "table") ? <TableDisplay category={dmsguild.data} />
				: <GraphDisplay category={dmsguild.data} />
			)}
		</div>
	)
}

const TableDisplay: FC<{category: Category}> = ({ category }) => {
		const [index, setIndex] = useState(0)

	function findNextChange() {
		if (!category) return;

		const currentRanking = JSON.stringify(category.rankings[index])
		for (let i = index + 1 ; i < category.rankings.length ; i++) {
			const nextRanking = JSON.stringify(category.rankings[index])
			if (nextRanking !== currentRanking) {
				setIndex(i)
				return;
			}
		}

		setIndex(Math.min(index + 1, category.rankings.length - 1))
	}

	function findPreviousChange() {
		if (!category) return;

		const currentRanking = JSON.stringify(category.rankings[index])
		for (let i = index - 1 ; i >= 0 ; i--) {
			const previousRanking = JSON.stringify(category.rankings[index])
			if (previousRanking !== currentRanking) {
				setIndex(i)
				return;
			}
		}

		setIndex(Math.max(0, index - 1))
	}

	return !!category && <>
		<p>{new Date(category.rankings[index].timestamp).toISOString()}</p>
		<button disabled={index === 0} onClick={findPreviousChange}>-</button>
		<button disabled={index === category.rankings.length - 1} onClick={findNextChange}>+</button>

		<RankingDisplay
			value={category.rankings[index]}
			previousValue={category.rankings[Math.max(0, index - 1)]}
			titles={category.titles} />
	</>
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

const fiveYearAgo = new Date()
fiveYearAgo.setFullYear(fiveYearAgo.getFullYear() - 5)

const defaultStart = fiveYearAgo.getTime()
const defaultEnd = new Date().getTime()
const defaultTop = 10

function oneMonthEarlier(timestamp: number) {
	const date = new Date(timestamp)
	date.setMonth(date.getMonth() - 1)
	return date.getTime()
}

function oneMonthLater(timestamp: number) {
	const date = new Date(timestamp)
	date.setMonth(date.getMonth() + 1)
	return date.getTime()
}

const GraphDisplay: FC<{ category: Category }> = ({ category }) => {
	const [start, setStart] = useState(defaultStart)
	const [end, setEnd] = useState(defaultEnd)
	const [top, setTop] = useState(defaultTop)
	const [filter, setFilter] = useState<string[]>([])

	const options: ChartOptions<"line"> = useMemo(() => ({
		responsive: true,
		interaction: { mode: "index", intersect: false },
		scales: {
			x: {
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
		},
	}), [category, start, end, top])

	const data = useMemo(() => {
		const filteredRankings = category.rankings.filter(ranking => (
			(ranking.timestamp >= start) && (ranking.timestamp <= end)
		))

		const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.']
		const labels: string[] = []
		for (let ranking of filteredRankings) {
			const { timestamp } = ranking
			const date = new Date(timestamp)
			const label = `${months[date.getMonth()]} ${date.getFullYear()}`
			labels.push(label)
		}

		const datasets: ChartDataset<"line">[] = []
		for (let titleId in category.titles) {
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
			for (let ranking of filteredRankings) {
				const index = ranking.titleIds.indexOf(titleId) + 1
				if ((index > 0) && (index <= top)) {
					appears = true
					dataset.data.push(index)
				} else {
					dataset.data.push(null)
				}
			}

			if (appears) {
				datasets.push(dataset)
			}
		}
		
		const result: ChartData<"line"> = {
			labels,
			datasets,
		}
		return result
	}, [category, start, end, top, filter])

	const filterOptions = useMemo(() => {
		const uniqueIds = new Set<string>()
		for (let ranking of category.rankings) {
			if ((ranking.timestamp >= start) && (ranking.timestamp <= end)) {
				for (let i = 0 ; i < top ; i++) {
					uniqueIds.add(ranking.titleIds[i])
				}
			}
		}

		return Array.from(uniqueIds).map(titleId => ({ label: category.titles[titleId].name, value: titleId }))
	}, [category, start, end, top])
	
	return <>
		<div style={{ display: "flex" }}>
			<label>Start: {new Date(start).toDateString()}</label>
			<button onClick={() => setStart(oneMonthEarlier(start))}>-</button>
			<button onClick={() => setStart(oneMonthLater(start))}>+</button>
		</div>
		<div style={{ display: "flex" }}>
			<label>End: {new Date(end).toDateString()}</label>
			<button onClick={() => setEnd(oneMonthEarlier(end))}>-</button>
			<button onClick={() => setEnd(oneMonthLater(end))}>+</button>
		</div>
		<div style={{ display: "flex" }}>
			<label>Show Top:</label>
			<input type="number" value={top} min={1} max={80} onChange={e => setTop(Number(e.target.value))} />
		</div>
		<div style={{ display: "flex" }}>
			<label>Filter:</label>
			<MultiSelect value={filter} onChange={setFilter} options={filterOptions} />
		</div>
		<Line options={options} data={data} redraw={true}/>
	</>
}