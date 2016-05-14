const { addToPlaylist } = require('./lib/smplayer')
const prompt = require('prompt')
const chalk = require('chalk')
const { getAllContents } = require('./localScrapper')
const clear = require('cli-clear')

const identity = thing => thing

const findKaras = (karaokes, regexes) => karaokes.reduce(
  (foundKaras, kara) => {
    const regexRes = regexes.map(regex => kara.fileName.match(regex))
    return regexRes.every(identity) ? foundKaras.concat(kara) : foundKaras
  },
  []
)

const askForKara = (choices) => new Promise(resolve => (
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
    const words = res.search.split(' ')
    const regexes = words.map(word => new RegExp(`(${word})`, 'ig'))

    const karaFound = findKaras(allContents, regexes)
    if (!karaFound.length) {
      console.warn('No results')
      return askForSearch()
    }

    console.log('0: do nothing')
    karaFound.forEach(({ path }, index) => {
      const coloredPath = regexes.reduce(
        (previous, regex) => previous.replace(regex, chalk.green('$1')),
        path
      )
      console.log(`${index + 1}: ${coloredPath}`)
    })
    askForKara(karaFound).then(askForSearch)
  })
}

process.stdout.write('Loading data...')
getAllContents()
  .then(allContents => {
    process.stdout.write('\r')
    prompt.start()
    askForSearch(allContents)
  })
  .catch(errors => console.warn(`\r${errors.message}`))
