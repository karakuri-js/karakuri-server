const Mplayer = require('mplayer')
const fs = require('fs')
const m3u = require('m3u')
const moment = require('moment')

let mplayer
let contents = []
let isPlaying = false
let playingContent

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
const setPlaylist = elements => (contents = [...elements])
const addToPlaylist = content => contents.push(Object.assign({}, content))
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
const toggleFullScreen = () => mplayer.fullscreen()
const pause = () => mplayer.pause()
const getPlayingContent = () => playingContent
const playNext = () => {
  if (isPlaying) return
  const content = contents.find(({ played }) => !played)
  if (!content) return toggleFullScreen()
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
    playNext()
  })
}

module.exports = {
  getPlaylist,
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
