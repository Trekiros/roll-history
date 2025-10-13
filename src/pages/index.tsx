import { RankingDisplay } from "@/components/rankingDisplay";
import { fetchCategory, usePromise } from "@/model/utils";
import { useState } from "react";

export default function Home() {
    const dmsguild = usePromise(() => fetchCategory("data/dmsguild.json"))
	const [index, setIndex] = useState(0)

	return (
		<div className="">
			<h1>Roll History</h1>
			{ !!dmsguild.data && <>
				<RankingDisplay
					value={dmsguild.data.rankings[index]}
					previousValue={dmsguild.data.rankings[Math.max(0, index - 1)]}
					titles={dmsguild.data.titles} />
				
				<button disabled={index === 0} onClick={() => setIndex(index - 1)}>-</button>
				<button disabled={index === dmsguild.data?.rankings.length - 1} onClick={() => setIndex(index + 1)}>+</button>
			</>}
		</div>
	);
}
