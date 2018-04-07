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
const { getLyricsFromFile } = require('./lib/getLyrics')
const { start: startWSServer, notifyPlaylist } = require('./lib/websockets')
const {
  addToPlaylist,
  addToReportPlaylist,
  randomizeUserPlaylist,
  getPlaylist,
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
    const id = (req.body.id || '').toString()
    const username = req.body.username || ''
    const content = contents.find(c => c.id === id)
    if (!content) return res.status(404).json({ message: 'Not found' })
    const { playlistContents, playingContent } = getPlaylist()
    const existingContentInPlaylist = playlistContents.find(c => c.id === id)
    if (existingContentInPlaylist || (playingContent || {}).id === id) {
      return res.send({ message: `${content.fileName} is already in playlist` })
    }
    addToPlaylist({ content, username })
    const updatedPlaylist = getPlaylist()
    notifyPlaylist(updatedPlaylist)
    if (!updatedPlaylist.playing) playNext()
    res.send({ message: `${content.fileName} has been added` })
  })

  app.get('/playlist', (req, res) => res.json(getPlaylist()))

  app.get('/pause', (req, res) => {
    pause()
    res.send()
  })

  app.post('/randomize', (req, res) => {
    if (!req.body.username) return res.status(404).json({ message: 'Missing username' })
    randomizeUserPlaylist(req.body.username)
    notifyPlaylist(getPlaylist())
    res.send({ message: 'Randomized' })
  })

  app.post('/report', (req, res) => {
    const id = (req.body.id || '').toString()
    const username = req.body.username || ''
    const comment = req.body.comment || ''
    const content = contents.find(c => c.id === id)
    if (!content) return res.status(404).json({ message: 'Not found' })

    addToReportPlaylist({ comment, content, username })
    res.send({ message: 'Reported' })
  })

  app.get('/contents/:id', (req, res) => {
    if (!req.params.id) return res.status(404).json({ message: 'Missing song id' })
    const content = contents.find(c => c.id === req.params.id)
    if (!content) return res.status(404).json({ message: 'Content ' + req.params.id + ' is unavailable' })
    res.json(Object.assign(
      content,
      { lyrics: content.subtitles ? getLyricsFromFile(content.subtitles) : [] }
    ))
  })

  app.get('/ping', (_, res) => res.send('pong'))

  server.on('request', app)
  server.listen(port, () => {
    console.log('Karakuri listening at')
    addresses.forEach(address => console.log(chalk.bold(address)))
    console.log(`on port ${chalk.bold(port)}`)
  })
}
