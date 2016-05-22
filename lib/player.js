const Mplayer = require('mplayer')

let mplayer
let contents = []
let isPlaying = false
let playingContent
let showPlayingFile = false

const getPlaylist = () => contents
const setPlaylist = elements => (contents = [...elements])
const addToPlaylist = content => contents.push(Object.assign({}, content))
const randomizePlaylist = () => contents.sort(() => 0.5 - Math.random())
const toggleFullScreen = () => mplayer.fullscreen()
const pause = () => mplayer.pause()
const getPlayingContent = () => playingContent
const playNext = () => {
  if (isPlaying) return
  isPlaying = true
  const content = contents.find(({ played }) => !played)
  if (!content) return toggleFullScreen()
  playingContent = content
  mplayer.openFile(content.path)
  if (showPlayingFile) {
    console.log(content.path)
  }
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
  randomizePlaylist,
  pause,
  playNext,
  initPlayer,
  getPlayingContent,
  get isPlaying() {
    return isPlaying
  },
  toggleShowPlayingFile() {
    showPlayingFile = !showPlayingFile
  },
}
