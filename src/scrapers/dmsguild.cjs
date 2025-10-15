/*

This script scrapes different snapshots of the DMsGuild on the wayback machine.
To run it, move to the scrapers directory and run `node ./dmsguild.cjs`

Every time it would need a fetch, it first checks the `tmp` folder, whose entire contents are ignored by git.
If the requested file is already present, it uses it, to lower the API load on the wayback machine while performing tests.
Otherwise, it performs the fetch, and saves the result in the `tmp` folder.

The script then output its result in a file called `tmp/dmsguild.json`, which follows the Category schema used by the web app.
If the results are okay, move the dmsguild.json file over to `public/data` for it to be commited.

*/

const fs = require('node:fs')
const crypto = require("crypto")

const THROTTLE_INTERVAL_MS = 5000
let lastFetch = 0

/**
 * Fetches the file at at the given url, but with a persistent cache and a throttler to ensure that you don't hit the API limits.
 * @param {string} url 
 * @returns {Promise<string>}
 */
async function lazyFetch(url) {
    // Create a semi-random file name, seeded by the url, because urls aren't valid file names
    const path = './tmp/' + crypto.createHash("md5").update(url).digest("hex") + ".html"
    
    // File already exists: return it
    if (fs.existsSync(path)) {
        const existingFile = await fs.promises.readFile(path)
        return existingFile.toString()
    } 
    
    // First time fetching this file:
    else {
		// Throttle actual fetches
        if (Date.now() - lastFetch < THROTTLE_INTERVAL_MS) {
          	await new Promise(resolve => setTimeout(() => resolve(), Math.min(THROTTLE_INTERVAL_MS, Date.now() - lastFetch)))
        }
        
		// Perform the fetch & save the result
        const response = await fetch(url)
        const text = await response.text()
        await fs.promises.writeFile(path, text)
		lastFetch = Date.now()
        return text
    }
}

/**
 * Returns the complete list of all of the ids, timestamps, and status, of the snapshots of the DMsGuild website
 * @returns {{snapshotId: string, timestamp: number, status: string}[]}
 */
async function getSnapshotsList() {
    const snapshotsListData = await lazyFetch("http://web.archive.org/cdx/search/cdx?url=www.dmsguild.com")
    const snapshotsList = snapshotsListData.split('\n')
        .map(line => {
            const [meta, timestampStr, url, protocol, status, snapshotId, unknown] = line.split(' ')
            return {
                snapshotId,
                timestamp: Number(timestampStr),
                status,
            }
        })

    return snapshotsList
}

// The way rankings were displayed has changed over time. Try the first endpoint until it stops working, then move on to the next
const rankingEndpoints = [
    // Starts around 2014*
    "https://web.archive.org/web/timestampid_/https://www.dmsguild.com/",

    // Starts around 2017
    "https://web.archive.org/web/timestampid_/http://www.dmsguild.com/api/products/list/hottest_filtered?filters=45469&include_community_content=1&strip_src=hottest_in_dmg",
    
    // Starts around 2021
    "https://web.archive.org/web/timestampid_/https://www.dmsguild.com/api/products/list/hottest_filtered/slider_view?filters=45469&include_community_content=1&strip_src=hottest_in_dmg",
]
let currentEndpointId = 0

/**
 * Get a ranking for a given snapshot
 * @param {number} snapshotTimestamp: day of the snapshotted ranking
 * @returns {{ titleId: string, titleName: string }[]} the ids, in order, of the top-ranked products on that day
 */
async function getSnapshotRanking(snapshotTimestamp) {
    // Try each endpoint until we find one where we have a ranking present
    while (currentEndpointId < rankingEndpoints.length) {
        const endpoint = rankingEndpoints[currentEndpointId].replace("timestamp", snapshotTimestamp)
        const html = await lazyFetch(endpoint)
        const matches = html.matchAll(/<a\s+[^>]*?href="[^"]*\/product\/(\d+)\/[^"]*"[^>]*?>\s*([^<]+)<\/a>/g)
        
        const results = []
        for (let match of matches) {
            results.push({
                titleId: match[1],
                titleName: match[2],
            })
        }

        if (results.length) return results

        currentEndpointId++
    }

    return []
}

async function main() {
    console.log("Retrieving snapshots list...")
	const snapshotsList = await getSnapshotsList()

    const result = {
        name: "DMsGuild",
        rankings: [],
        titles: {},
    }

    for (const snapshot of snapshotsList) {
        if (snapshot.status !== "200") {
            console.log("Skipping snapshot " + snapshot.snapshotId)
            continue;
        }

        try {
            const ranking = await getSnapshotRanking(snapshot.timestamp)
    
            if (!ranking.length) {
                console.log(`Snapshot ${snapshot.snapshotId}: found no ranking`)
            } else {
                console.log(`Snapshot ${snapshot.snapshotId}: found ${ranking.length} titles`)
            }
    
            for (let { titleId, titleName } of ranking) {
                result.titles[titleId] = titleName
            }
    
            result.rankings.push({
                timestamp: snapshot.timestamp,
                titleIds: ranking.map(({ titleId }) => titleId),
            })
        } catch (e) {
            console.log("Snapshot " + snapshot.snapshotId + ": ERROR!", e)
            continue;
        }
    }

    await fs.promises.writeFile('dmsguild.json', JSON.stringify(result))
}

main()
