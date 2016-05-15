const { addToPlaylist } = require('./lib/smplayer')
const fs = require('fs')
const prompt = require('prompt')
require('colors')

const allContents = JSON.parse(fs.readFileSync('./.data/allContents.json'))

const isTrue = b => b

const findKaras = (karaokes, regexes) => karaokes.reduce(
  (foundKaras, kara) => {
    const regexRes = regexes.map(r => kara.fileName.match(r))
    return regexRes.every(isTrue) ? foundKaras.concat(kara) : foundKaras
  },
  []
)

prompt.start()

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

const askForSearch = () => {
  prompt.get(['search'], (err, res) => {
    const words = res.search.split(' ')
    const regexes = words.map(w => new RegExp(`(${w})`, 'ig'))

    const karaFound = findKaras(allContents, regexes)
    if (!karaFound.length) {
      console.warn('No results')
      askForSearch()
      return
    }

    console.log('0: do nothing')
    karaFound.forEach(({ path }, index) => {
      const coloredPath = regexes.reduce(
        (previous, regex) => previous.replace(regex, '\$1'.green),
        path
      )
      console.log(`${index + 1}: ${coloredPath}`)
    })
    askForKara(karaFound).then(askForSearch)
  })
}

askForSearch()
