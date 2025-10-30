const fs = require("node:fs")

async function main() {
    const file = fs.readFileSync('../../public/data/dmsguild.json')

    /**
     * @type {{ name: string, rankings: { timestamp: number, titleIds: string[] }[], titles: Record<string, { name: string, url: string, img?: string }>}}
     */
    const data = JSON.parse(file.toString())

    const monthsPerTitleId = {}
    const scorePerTitleId = {}
    data.rankings.forEach(ranking => {
        ranking.titleIds.forEach((titleId, index) => {
            monthsPerTitleId[titleId] = (monthsPerTitleId[titleId] || 0) + 1
            scorePerTitleId[titleId] = (scorePerTitleId[titleId] || 0) + 80 - index
        })
    })
    Object.entries(scorePerTitleId).forEach(([titleId, score]) => {
        if (score > 4000) console.log(titleId)
    })

    // const titlesPerMonths = {}
    // Object.entries(monthsPerTitleId).forEach(([_, months]) => {
    //     titlesPerMonths[months] = (titlesPerMonths[months] || 0) + 1
    // })
    // console.log(JSON.stringify(titlesPerMonths, null, 2))

    // const titlesPerScore = {}
    // Object.entries(scorePerTitleId).forEach(([_, score]) => {
    //     const scoreBracket = Math.floor(score / 10) * 10
    //     titlesPerScore[scoreBracket] = (titlesPerScore[scoreBracket] || 0) + 1
    // })
    // console.log(JSON.stringify(titlesPerScore, null, 2))
}

main()