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
let lastUrl = ""

/**
 * Fetches the file at at the given url, but with a persistent cache and a throttler to ensure that you don't hit the API limits.
 * @param {string} url 
 * @returns {Promise<string>}
 */
async function lazyFetch(url, saveName) {
    // Create a semi-random file name, seeded by the url, because urls aren't valid file names
    const path = `./tmp/${saveName}.html`
    lastPath = path
    
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


const playwright = require("playwright")
const { Browser, Page, Response } = require("playwright")
const chromium = playwright.chromium
/** @type {Browser} */ let _browser;
/** @type {Page} */ let _page;

async function getPage() {
    if (_page) return _page

    _browser = await chromium.launch({ headless: true })
    _page = await _browser.newPage()
    return _page
}

async function cleanup() {
    if (_browser) {
        _browser.close()
    }
}

/**
 * Same as LazyFetch, but using a headless browser to make sure the content can load normally, because there's some weird redirect nonsense happening that I can't reproduce programmatically
 */
async function playwrightFetch(url, saveName) {
    // Create a semi-random file name, seeded by the url, because urls aren't valid file names
    const path = `./tmp/${saveName}.html`
    lastPath = path

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

        const page = await getPage()
        await page.goto(url, { waitUntil: "domcontentloaded" })
        /** @type {Response|null} */ const response = await new Promise(res => {
            let running = true
            setTimeout(() => { if (running) res(null) }, 20_000)
            
            /** @type {(request: playwright.Request) => any} */ const requestListener = async request => {
                const url = request.url()
                if (url.includes("hottest") && url.includes("45469")) {
                    page.off("request", requestListener)
                    console.log(now() + " - Actual URL being polled: " + url)

                    const response = await request.response()
                    if (response.status() === 302) return;

                    if (running) res(response)
                    running = false
                }
            }

            page.on('request', requestListener)
        })
        if (!response) {
            await fs.promises.writeFile(path, "")
            lastFetch = Date.now()
            return null
        }

        try {
            const text = await response.text()
            
            await fs.promises.writeFile(path, text)
            lastFetch = Date.now()
            return text
        } catch (e) {
            await new Promise(res => setTimeout(() => res, 5000))
            return null
        }
    }
}

/**
 * Returns the complete list of all of the ids, timestamps, and status, of the snapshots of the DMsGuild website
 * @returns {{snapshotId: string, timestamp: number, status: string}[]}
 */
async function getSnapshotsList() {
    const snapshotsListData = await lazyFetch("http://web.archive.org/cdx/search/cdx?url=www.dmsguild.com", "snapshotsList")
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

/**
 * Get a ranking for a given snapshot
 * @param {number} snapshotTimestamp: day of the snapshotted ranking
 * @returns {{ titleId: string, titleName: string }[]} the ids, in order, of the top-ranked products on that day
 */
async function getSnapshotRanking(snapshotTimestamp) {
    const year = Number(String(snapshotTimestamp).substring(0, 4))
    
    if (year < 2016) return []

    const html = (year < 2021) ? (
        await playwrightFetch(`https://web.archive.org/web/${snapshotTimestamp}/http://www.dmsguild.com/`, snapshotTimestamp)
    ) : (
        await lazyFetch(`https://web.archive.org/web/${snapshotTimestamp}id_/https://www.dmsguild.com/api/products/list/hottest_filtered/slider_view?filters=45469&include_community_content=1&strip_src=hottest_in_dmg`, snapshotTimestamp)
    )

    if (!html) return []

    const matches = html.matchAll(/<a\s+[^>]*?href="[^"]*\/product\/(\d+)\/[^"]*"[^>]*?>\s*([^<]+)<\/a>/g)
    
    const results = []
    for (let match of matches) {
        results.push({
            titleId: match[1],
            titleName: match[2],
        })
    }

    if (results.length) return results
}

function now() {
    return new Date().toISOString()
}

async function main() {
    try {

        console.log(now() + " - Retrieving snapshots list...")
        const snapshotsList = await getSnapshotsList()
    
        const result = {
            name: "DMsGuild",
            rankings: [],
            titles: {},
        }
    
        let i = 0
        let lastRanking = ""
        for (const snapshot of snapshotsList) {
            if (snapshot.status !== "200") {
                console.log(now() + " - Skipping snapshot " + snapshot.timestamp)
                continue;
            }
    
            try {
                const ranking = await getSnapshotRanking(snapshot.timestamp)
                const rankingStr = JSON.stringify(ranking)
    
                if (!ranking.length) {
                    console.log(now() + ` - Snapshot ${snapshot.timestamp}: found no ranking (file: ${lastPath})`)
                    continue;
                } else if (lastRanking === rankingStr) {
                    console.log(now() + ` - Snapshot ${snapshot.timestamp}: skipping because this ranking is identical to the last one`)
                    continue;
                } else {
                    console.log(now() + ` - Snapshot ${snapshot.timestamp}: found ${ranking.length} titles`)
                    lastRanking = rankingStr
                }
        
                for (let { titleId, titleName } of ranking) {
                    result.titles[titleId] = {
                        name: titleName,
                        url: `https://www.dmsguild.com/product/${titleId}?affiliate_id=2038543`,
                    }
                }
        
                result.rankings.push({
                    timestamp: snapshot.timestamp,
                    titleIds: ranking.map(({ titleId }) => titleId),
                })
            } catch (e) {
                console.log(now() + " - Snapshot " + snapshot.timestamp + ": ERROR!", e)
                continue;
            }
    
            i++
            if (i % CHECKPOINT_FREQUENCY === 0) {
                await fs.promises.writeFile('dmsguild.json', JSON.stringify(result, null, 2))        
            }
        }
    
        await fs.promises.writeFile('dmsguild.json', JSON.stringify(result))
    } finally {
        await cleanup()
    }
}

const CHECKPOINT_FREQUENCY = 1

main()