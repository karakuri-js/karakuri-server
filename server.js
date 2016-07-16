const chalk = require('chalk')
const express = require('express')
const bodyParser = require('body-parser')
const { createServer } = require('http')
const { networkInterfaces: getNetworkInterfaces } = require('os')
const networkInterfaces = getNetworkInterfaces()
const addresses = Object.keys(networkInterfaces)
  .reduce((array, interfaceName) => (
    array.concat(...networkInterfaces[interfaceName])
  ), [])
  .filter(element => !element.internal && element.family === 'IPv4')
  .map(element => element.address)

const player = require('./lib/player')
const { start: startWSServer, notifyPlaylist } = require('./lib/websockets')
const {
  addToPlaylist,
  savePlaylist,
  randomizePlaylist,
  getFuturePlaylist,
  playNext,
  pause,
} = player

module.exports = ({ contents, port }) => {
  const server = createServer()
  const app = express()

  startWSServer({ server })

  app.use(bodyParser.json())
  app.get('/contents', (req, res) => res.json(contents))

  app.post('/request', (req, res) => {
    const id = parseInt(req.body.id, 10)
    const content = contents.find(c => c.id === id)
    if (!content) return res.status(404).json({ message: 'Not found' })
    const existingContent = getFuturePlaylist().find(c => c.id === id)
    if (existingContent) {
      return res.send({ message: `${content.fileName} is already in playlist` })
    }
    addToPlaylist(content)
    savePlaylist()
    notifyPlaylist(getFuturePlaylist())
    if (!player.isPlaying) playNext()
    res.send({ message: `${content.fileName} has been added` })
  })

  app.get('/playlist', (req, res) => res.json(getFuturePlaylist()))

  app.get('/pause', (req, res) => {
    pause()
    res.send()
  })

  // TODO when the app will handle this, change to app.post
  app.all('/randomize', (req, res) => {
    randomizePlaylist()
    res.send({ message: 'randomized' })
  })

  server.on('request', app)
  server.listen(port, () => {
    console.log('Karakuri listening at')
    addresses.forEach(address => console.log(chalk.bold(address)))
    console.log(`on port ${chalk.bold(port)}`)
  })
}
