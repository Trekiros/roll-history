This web app aims to provide a complete record of the best D&D homebrew of all time, by showcasing how the "most popular" banners on websites like DTRPG and DMsGuild have evolved over time.

# How it Works
The `src/scrapers` directory contains node scripts that can automatically retrieve the data from the [wayback machine](https://web.archive.org/), and save the results in the form of a json file in the `public/data` directory.

The results are then presented in the form of a website using NextJS and Framer Motion for a pleasant UI.

# Getting Started
* Install nodejs: https://nodejs.org/en
* Download node packages: `npm i`
* Run in dev mode: `npm run dev`
* Open http://localhost:3000 with your browser to see the result.

# Contributing
To contribute, fork this repository and make pull requests.

The project's main goals is to make the UI as easy to use as possible, to empower users with information about the best homebrew available. Contributions that improve the UI or the data itself are most likely to be accepted. Contributions might be refused if they make the UI too complex or clunky to use.

# TO-DO List:
* Write & use the web scrapers
* Set up a cron that automatically runs the web scrapers once a day
* Improve the UI:
    * Add a tab bar at the top to select between different sources: DMsGuild, DTRPG, Reddit, maybe a 4th one?
    * Add better and prettier date controls:
        * Presentation mode, which automatically moves once per second
        * Granularity control, where you can move 1 day, 1 week, 1 month, 1 year, or pick a date?
    * Filters
        * By author 
        * by tags
    * Alt data visualizations:
        * Ranking of which products have stayed in the top X the longest
        * Ranking of which authors have stayed in the top X the longest or have had the most titles in the top X
        * Bar chart of the tags that are most frequent in the top X for a given time period


