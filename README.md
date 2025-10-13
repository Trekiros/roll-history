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
