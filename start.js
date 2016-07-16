const fs = require('fs')
const argv = require('minimist')(process.argv.slice(2))
const [width, height] = require('screenres').get()
const player = require('./lib/player')
const {
  setPlaylist,
  randomizePlaylist,
  loadPlaylist,
  playNext,
  initPlayer,
} = player

if (argv.h || argv.help) {
  console.log('usage: node player.js [options]\n')
  console.log('  -p [PORT_ID]     sets the port used by the server')
  console.log('  --random         only play karaokes at random without server')
  console.log('  --novideo        play only audio')
  console.log('  -l  --load       load a playlist')
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

const mplayerOptions = {
  verbose: !!(argv.verbose || argv.v),
  debug: !!(argv.debug || argv.d),
  args: '-ass -fixed-vo' +
        ` -vf scale=${width}:-3:::0.00:0.75,expand=:${height},scale,ass`,
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
  if (argv.l || argv.load) {
    loadPlaylist(argv.l || argv.load, allContents)
    playNext()
  }
  require('./server')({ // eslint-disable-line global-require
    contents: allContents,
    port: argv.p || 3000,
  })
}
