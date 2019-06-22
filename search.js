const clear = require('cli-clear')
const prompt = require('prompt')
const chalk = require('chalk')
const { addToPlaylist } = require('./lib/smplayer')
const getFormattedContent = require('./localScrapper')
const fuzzySearch = require('./lib/fuzzySearch')

const askForKara = choices => new Promise(resolve => (
  prompt.get(['choice'], (err, res) => {
    const choice = parseInt(res.choice, 10)
    if (choice !== 0 && parseInt(choice, 10) == choice) { // eslint-disable-line eqeqeq
      const kara = choices[choice - 1]
      console.log(`adding to smplayer: ${kara.fileName}`)
      addToPlaylist(kara.path)
    }
    resolve()
  })
))

const askForSearch = (allContents) => {
  clear()
  prompt.get(['search'], (err, res) => {
    const { result: karaFound, regexes } = fuzzySearch(allContents, res.search, 'fileName')
    if (!karaFound.length) {
      console.warn('No results')
      return askForSearch(allContents)
    }

    console.log('0: do nothing')
    karaFound.forEach(({ path }, index) => {
      const coloredPath = regexes.reduce(
        (previous, regex) => previous.replace(regex, chalk.green('$1')),
        path,
      )
      console.log(`${index + 1}: ${coloredPath}`)
    })
    askForKara(karaFound).then(() => askForSearch(allContents))
  })
}

process.stdout.write('Loading data...')
getFormattedContent()
  .then((allContents) => {
    process.stdout.write('\r')
    prompt.start()
    askForSearch(allContents)
  })
  .catch(errors => console.warn(`\r${errors.message}`))
