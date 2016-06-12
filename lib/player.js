const Mplayer = require('mplayer')

let mplayer
let contents = []
let isPlaying = false
let playingContent

const getPlaylist = () => contents
const setPlaylist = elements => (contents = [...elements])
const addToPlaylist = content => contents.push(Object.assign({}, content))
const randomizePlaylist = () => contents.sort(() => 0.5 - Math.random())
const pause = () => mplayer.pause()
const getPlayingContent = () => playingContent
const playNext = () => {
  if (isPlaying) return
  const content = contents.find(({ played }) => !played)
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
}
