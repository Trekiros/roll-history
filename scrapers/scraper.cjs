const fs = require('node:fs')

/**
 * Get a ranking for a given snapshot
 * @param {string} fileName: name of the file
 * @returns {Promise<{ titleId: string, titleName: string }[]>} the ids, in order, of the top-ranked products on that day
 */
async function getSnapshotRanking(fileName) {
    const fileContent = (await fs.promises.readFile(fileName)).toString()
    
    // Parsing API responses
    if (fileName.endsWith(".json")) {
        const obj = JSON.parse(fileContent)
        const results = []
        for (let result of obj.results) {
            results.push({
                titleId: result.products_id,
                titleName: result.products_name
            })
        }
        return results
    }

    // Parsing HTML snapshots
    const matches = fileContent.matchAll(/<a\s+[^>]*?href="[^"]*\/product\/(\d+)\/[^"]*"[^>]*?oldtitle="([^"]+)"[^>]*?>.*?<\/a>/g)
    
    const results = []
    for (let match of matches) {
        results.push({
            titleId: match[1],
            titleName: match[2],
        })
    }
    return results
}

function now() {
    return new Date().toISOString()
}

async function main() {
    console.log(now() + " - Retrieving snapshots list...")
    const snapshotsList = await fs.promises.readdir("./dmsguild")

    const result = {
        name: "DMsGuild",
        rankings: [],
        titles: {},
    }

    let i = 0
    let lastRanking = ""
    for (const fileName of snapshotsList) {
        const ranking = await getSnapshotRanking("./dmsguild/" + fileName)
        const rankingStr = JSON.stringify(ranking)

        if (!ranking.length) {
            console.log(now() + ` - Snapshot ${fileName}: found no ranking`)
            continue;
        } else if (lastRanking === rankingStr) {
            console.log(now() + ` - Snapshot ${fileName}: skipping because this ranking is identical to the last one`)
            continue;
        } else {
            console.log(now() + ` - Snapshot ${fileName}: found ${ranking.length} titles`)
            lastRanking = rankingStr
        }

        for (let { titleId, titleName } of ranking) {
            result.titles[titleId] = {
                name: titleName,
                url: `https://www.dmsguild.com/product/${titleId}?affiliate_id=2038543`,
            }
        }

        const cleanFileName = fileName.endsWith(".json") ? fileName.substring(0, fileName.length - 5) : fileName
        const [year, month] = cleanFileName.split("-")
        const snapshotDate = new Date()
        snapshotDate.setFullYear(year, month, 15)

        result.rankings.push({
            timestamp: snapshotDate.getTime(),
            titleIds: ranking.map(({ titleId }) => titleId),
        })

        i++
        if (i % CHECKPOINT_FREQUENCY === 0) {
            await fs.promises.writeFile('dmsguild.json', JSON.stringify(result, null, 2))        
        }
    }

    await fs.promises.writeFile('dmsguild.json', JSON.stringify(result))
}

const CHECKPOINT_FREQUENCY = 1

main()