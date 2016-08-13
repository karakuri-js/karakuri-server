const Mplayer = require('mplayer')
const fs = require('fs')
const m3u = require('m3u')
const moment = require('moment')
const { notifyNewPlayingContent, notifyPlaylist } = require('./websockets')

let mplayer
let contents = []
let isPlaying = false
let playingContent
const users = []

const createNewPlaylistFile = (previousTriesNb = 0) => {
  let playlistName = moment().format('YYYY-MM-DD')
  if (previousTriesNb) playlistName += `-${previousTriesNb}`
  // Try accessing a file with the planned playlist filename.
  // If it exists, then find another name.
  try {
    fs.accessSync(`${playlistName}.m3u`, fs.F_OK)
    return createNewPlaylistFile(previousTriesNb + 1)
  } catch (e) {
    return `${playlistName}.m3u`
  }
}
const playlistName = createNewPlaylistFile()

const getPlaylist = () => contents
const getFuturePlaylist = () => contents.filter(({ played }) => !played)
const setPlaylist = elements => (contents = [...elements])
const addToPlaylist = ({ content, username }) => {
  contents.push(Object.assign({}, content, { username }))
  if (users.find(({ name }) => username === name)) return
  users.unshift({ name: username })
}
const savePlaylist = () => {
  const m3uWriter = m3u.writer()
  contents.forEach(content => m3uWriter.file(content.path))
  fs.writeFileSync(playlistName, m3uWriter.toString(), { encoding: 'utf8' })
}
const loadPlaylist = (filepath, allContents) => {
  const filePaths = fs.readFileSync(filepath, { encoding: 'utf8' })
    .split('\n')
    .filter(filePath => !filePath.startsWith('#')) // Comments in m3u files start with #

  setPlaylist(allContents.filter(content => filePaths.includes(content.path)))
}
const randomizePlaylist = () => contents.sort(() => 0.5 - Math.random())
const pause = () => mplayer.pause()
const getPlayingContent = () => playingContent

const playNext = () => {
  if (isPlaying) return
  let content
  for (const { name } of [...users]) { // loop on clone as we'll change the original
    content = contents.find(({ played, username }) => !played && username === name)
    users.push(users.shift()) // update users order for next time
    if (content) break
  }
  notifyNewPlayingContent(content)
  if (!content) return
  playingContent = content
  mplayer.openFile(content.path)
  isPlaying = true
}
const initPlayer = options => {
  mplayer = new Mplayer(options)
  mplayer.on('stop', () => {
    isPlaying = false
    playingContent.played = true
    playingContent = null
    notifyPlaylist(getFuturePlaylist())
    playNext()
  })
}

module.exports = {
  getPlaylist,
  getFuturePlaylist,
  setPlaylist,
  addToPlaylist,
  savePlaylist,
  loadPlaylist,
  randomizePlaylist,
  pause,
  playNext,
  initPlayer,
  getPlayingContent,
  get isPlaying() {
    return isPlaying
  },
}
