const Mplayer = require('mplayer')
const m3u = require('m3u')
const fs = require('fs')

let mplayer
let contents = []
let isPlaying = false
let playingContent

const getPlaylist = () => contents
const setPlaylist = elements => (contents = [...elements])
const addToPlaylist = content => contents.push(Object.assign({}, content))
const savePlaylist = () => {
  const m3uWriter = m3u.writer()
  contents.forEach(content => m3uWriter.file(content.path))
  fs.writeFileSync('playlist.m3u', m3uWriter.toString(), { encoding: 'utf8' })
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
  randomizePlaylist,
  pause,
  playNext,
  initPlayer,
  getPlayingContent,
  get isPlaying() {
    return isPlaying
  },
}
