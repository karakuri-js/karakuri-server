const fs = require('fs')
const { networkInterfaces: getNetworkInterfaces } = require('os')
const argv = require('minimist')(process.argv.slice(2))
const chalk = require('chalk')
const express = require('express')
const bodyParser = require('body-parser')
const player = require('./lib/player')
const {
  setPlaylist,
  addToPlaylist,
  savePlaylist,
  loadPlaylist,
  randomizePlaylist,
  getPlaylist,
  playNext,
  pause,
  initPlayer,
} = player

if (argv.h || argv.help) {
  console.log('usage: node player.js [options]\n')
  console.log('  -p [PORT_ID]     sets the port used by the server')
  console.log('  --random         only play karaokes at random without server')
  console.log('  --novideo        play only audio')
  console.log('  -l  --load       load a playlist')
  console.log('  -q, --quiet      enjoy the silence')
  console.log('  -v, --verbose    make mplayer verbose')
  console.log('  -d, --debug      debug mplayer')
  console.log('  -h, --help       display this help')
  process.exit(1)
}

if (argv.q || argv.quiet) {
  console.log = () => {}
}

const allContents = JSON.parse(fs.readFileSync('./.data/allContents.json'))
const playlist = []

const mplayerOptions = {
  verbose: !!(argv.verbose || argv.v),
  debug: !!(argv.debug || argv.d),
  args: '-ass -vo gl_nosw -fixed-vo',
}
if (argv.novideo) {
  mplayerOptions.args += ' -vo null'
}
initPlayer(mplayerOptions)

if (argv.random) {
  setPlaylist(allContents)
  randomizePlaylist()
  playNext()
} else {
  const app = express()
  app.use(bodyParser.json())

  if (argv.l || argv.load) {
    loadPlaylist(argv.l || argv.load, allContents)
    playNext()
  }

  app.get('/contents', (req, res) => res.json(allContents))

  app.post('/request', (req, res) => {
    const id = parseInt(req.body.id, 10)
    const content = allContents.find(c => c.id === id)
    if (!content) return res.status(404).json({ message: 'Not found' })
    const existingContent = getPlaylist().find(c => c.id === id)
    if (existingContent) return res.send({ message: `${content.fileName} is already in playlist` })
    addToPlaylist(content)
    savePlaylist()
    if (!player.isPlaying) playNext()
    res.send({ message: `${content.fileName} has been added` })
  })

  app.get('/playlist', (req, res) => res.json(getPlaylist()))

  app.get('/play', (req, res) => {
    randomizePlaylist()
    res.send(playlist.map(file => file.fileName).join('\n'))
    playNext()
  })

  app.get('/pause', (req, res) => {
    pause()
    res.send()
  })

  // TODO when the app will handle this, change to app.post
  app.all('/randomize', (req, res) => {
    randomizePlaylist()
    res.send({ message: 'randomized' })
  })

  const port = argv.p ? argv.p : 3000
  app.listen(port, () => {
    const networkInterfaces = getNetworkInterfaces()
    const addresses = Object.keys(networkInterfaces).reduce((array, interfaceName) => (
      array.concat(...networkInterfaces[interfaceName])
    ), [])
      .filter(element => !element.internal && element.family === 'IPv4')
      .map(element => element.address)

    console.log('Karakuri listening at')
    addresses.forEach(address => console.log(chalk.bold(address)))
    console.log(`on port ${chalk.bold(port)}`)
  })
}
