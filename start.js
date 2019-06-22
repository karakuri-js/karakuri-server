const fs = require('fs')
const argv = require('minimist')(process.argv.slice(2))
const player = require('./lib/player')

const {
  addToPlaylist,
  loadPlaylist,
  randomizeUserPlaylist,
  playNext,
  initPlayer,
} = player
const CONSOLE_USERNAME = 'console'

if (argv.h || argv.help) {
  console.log('usage: node player.js [options]\n')
  console.log('  -p [PORT_ID]     sets the port used by the server')
  console.log('  --random         only play karaokes at random without server')
  console.log('  --novideo        play only audio')
  console.log('  -l  --load       load a playlist')
  console.log('  -h, --help       display this help')
  process.exit(1)
}

if (argv.q || argv.quiet) {
  console.log = () => {}
}

const allContents = JSON.parse(fs.readFileSync('./.data/allContents.json'))

const mpvOptions = [
  '--fullscreen',
]

if (argv.novideo) {
  mpvOptions.push('--no-video')
}
initPlayer(mpvOptions)

if (argv.random) {
  allContents.forEach(
    content => addToPlaylist({ content, username: CONSOLE_USERNAME }),
  )
  randomizeUserPlaylist(CONSOLE_USERNAME)
  playNext()
} else {
  if (argv.l || argv.load) {
    loadPlaylist(argv.l || argv.load, allContents)
    playNext()
  }
  require('./server')({ // eslint-disable-line global-require
    contents: allContents,
    port: argv.p || 3000,
  })
}
