import { GraphDisplay } from "@/components/graphDisplay";
import { NavBar } from "@/components/navBar";
import { TableDisplay } from "@/components/tableDisplay";
import { TopDisplay } from "@/components/topDisplay";
import { fetchCategory, usePromise } from "@/model/utils";
import { useState } from "react";

export const Sources = {
	dmsguild: "data/dmsguild.json",
}

export default function Home() {
    const dmsguild = usePromise(() => fetchCategory("data/dmsguild.json"))
	const [displayType, setDisplayType] = useState<"table"|"graph"|"top">("table")
	const [source, setSource] = useState("data/dmsguild.json")

	return (
		<div>
			<NavBar 
				source={source} onSourceChange={setSource}
				style={displayType} onStyleChange={setDisplayType} />

			{ !!dmsguild.data && (
				(displayType === "table") ? (
					<TableDisplay category={dmsguild.data} />
				) : (displayType === "graph") ? (
					<GraphDisplay category={dmsguild.data} />
				) : (
					<TopDisplay category={dmsguild.data} />
				)
			)}
		</div>
	)
}
