import { fetchCategory, usePromise } from "@/model/utils";

export default function Home() {
    const dmsguild = usePromise(() => fetchCategory("data/dmsguild.json"))

	return (
		<div className="">
			<h1>Roll History</h1>
			<div>
				{JSON.stringify(dmsguild)}
			</div>
		</div>
	);
}
