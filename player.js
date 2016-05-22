const fs = require('fs')
const sr = require('screenres')
const argv = require('minimist')(process.argv.slice(2))
const express = require('express')
const bodyParser = require('body-parser')
const {
  setPlaylist,
  addToPlaylist,
  randomizePlaylist,
  getPlaylist,
  playNext,
  pause,
  initPlayer,
  isPlaying,

} = require('./lib/player')

if (argv.h || argv.help) {
  console.log('usage: node player.js [options]\n')
  console.log('  -p [PORT_ID]     sets the port used by the server')
  console.log('  --random         only play karaokes at random without server')
  console.log('  --novideo        play only audio')
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

const screenResolution = sr.get()
const mplayerOptions = {
  verbose: !!(argv.verbose || argv.v),
  debug: !!(argv.debug || argv.d),
  args: '-ass -fixed-vo' +
        ` -vf scale=${screenResolution[0]}:-3:::0.00:0.75,expand=:${screenResolution[1]},scale,ass`,
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

  app.get('/contents', (req, res) => res.json(allContents))

  app.post('/request', (req, res) => {
    const id = parseInt(req.body.id, 10)
    const content = allContents.find(c => c.id === id)
    if (!content) return res.status(404).json({ error: 'Not found' })
    const existingContent = getPlaylist().find(c => c.id === id)
    if (existingContent) return res.send({ message: `${content.fileName} is already in playlist` })
    addToPlaylist(content)
    if (!isPlaying) playNext()
    res.send(`${content.fileName} has been added`)
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

  const port = argv.p ? argv.p : 3000
  const server = app.listen(port, () => {
    const host = server.address().address
    console.log('Karakuri listening at http://%s:%s', host, port)
  })
}
