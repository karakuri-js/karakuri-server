const MPV = require('node-mpv')
const fs = require('fs')
const os = require('os')
const m3u = require('m3u')
const moment = require('moment')
const { shuffle } = require('lodash')
const { notifyPlaylist } = require('./websockets')
const { chunk } = require('lodash')

const PLAYLISTS_DIRECTORY = 'playlists'

let mpv
let contents = []
let playingContent
const users = []

const createNewPlaylistFile = (previousTriesNb = 0) => {
  // create the directory if it doesn't exist
  try {
    fs.mkdirSync(`./${PLAYLISTS_DIRECTORY}`)
  } catch (e) {
    if (e.code !== 'EEXIST') throw new Error(`Unhandled error ${e.message}`)
  }

  let playlistName = moment().format('YYYY-MM-DD')
  if (previousTriesNb) playlistName += `-${previousTriesNb}`
  // Try accessing a file with the planned playlist filename.
  // If it exists, then find another name.
  try {
    fs.accessSync(`${PLAYLISTS_DIRECTORY}/${playlistName}.m3u`, fs.F_OK)
    return createNewPlaylistFile(previousTriesNb + 1)
  } catch (e) {
    return `${PLAYLISTS_DIRECTORY}/${playlistName}.m3u`
  }
}
const playlistName = createNewPlaylistFile()

const getPlaylist = () => ({ playingContent, playlistContents: contents })
const addToPlaylist = ({ content, username }) => {
  contents.push(Object.assign({}, content, { username }))
  if (users.find(({ name }) => username === name)) return
  users.unshift({ name: username })
}
const saveToM3uPlaylist = (content) => {
  const m3uWriter = m3u.writer()
  m3uWriter.comment(content.username)
  m3uWriter.file(content.path)
  fs.appendFileSync(playlistName, m3uWriter.toString(), { encoding: 'utf8' })
}

const loadPlaylist = (filepath, allContents) => {
  chunk(
    fs.readFileSync(filepath, { encoding: 'utf8' }).split('\n'),
    2
  ).forEach(([usernameComment, filePath]) => {
    const content = allContents.find(c => c.path === filePath)
    if (!content) return
    addToPlaylist({ content, username: usernameComment.replace('#', '') })
  })
}

const randomizeUserPlaylist = username => (
  contents = contents.filter(content => content.username !== username).concat(
    shuffle(contents.filter(content => content.username === username))
  )
)
const pause = () => mpv.togglePause()
const getPlayingContent = () => playingContent

const playNext = () => {
  if (playingContent) return
  let content
  for (const { name } of [...users]) { // loop on clone as we'll change the original
    content = contents.find(({ username }) => username === name)
    users.push(users.shift()) // update users order for next time
    if (content) break
  }
  playingContent = content
  if (content) {
    contents = contents.filter(({ id }) => id !== playingContent.id)
  }
  notifyPlaylist(getPlaylist())

  if (!content) return
  saveToM3uPlaylist(content)
  mpv.load(content.path)
  mpv.resume()
}
const initPlayer = options => {
  const defaultOptions = [
    '--keep-open=yes',
    '--fps=60',
    '--no-border',
    '--osd-level=0',
    '--sub-codepage=UTF-8-BROKEN',
  ]
  mpv = new MPV(
    {
      auto_restart: true,
      audio_only: false,
      verbose: false,
      debug: false,
    }
    , os.platform() === 'darwin'
      ? [...defaultOptions, ...options, '--no-native-fs']
      : [...defaultOptions, ...options]
  )
  mpv.observeProperty('eof-reached', 13)
  mpv.on('statuschange', status => {
    if (status['eof-reached']) {
      playingContent = null
      playNext()
    }
  })
}

module.exports = {
  getPlaylist,
  addToPlaylist,
  saveToM3uPlaylist,
  loadPlaylist,
  randomizeUserPlaylist,
  pause,
  playNext,
  initPlayer,
  getPlayingContent,
}
