const Mplayer = require('mplayer')
const fs = require('fs')
const argv = require('minimist')(process.argv.slice(2))

if (argv.h || argv.help) {
  console.log('usage: node player.js [options]\n')
  console.log('  -p [PORT_ID]     sets the port used by the server')
  console.log('  --novideo        play only audio')
  console.log('  -q, --quiet      enjoy the silence')
  console.log('  -v, --verbose    make mplayer verbose')
  console.log('  -d, --debug      debug mplayer')
  console.log('  -h, --help       display this help')
  process.exit(1)
}

if (argv.q || argv.quiet) {
  console.log = () => {}
}

const getRandomElement = array => array[Math.floor(Math.random() * array.length)]
const getRandomPath = array => {
  const kara = getRandomElement(array)
  console.log(kara.path)
  return kara.path
}

const allContents = JSON.parse(fs.readFileSync('./.data/allContents.json'))
const playlist = []

const mplayerOptions = { verbose: !!(argv.verbose || argv.v), debug: !!(argv.debug || argv.d) }
if (argv.novideo) {
  mplayerOptions.args = '-vo null'
}
const mplayer = new Mplayer(mplayerOptions)


const express = require('express')
const app = express()
const startPlayer = files => {
  mplayer.openFile(getRandomPath(files))
  mplayer.on('stop', () => mplayer.openFile(getRandomPath(files)))
}

app.get('/contents', (req, res) => res.json(allContents))

app.post('/request', (req) => {
  const id = parseInt(req.body.id, 10)
  const content = allContents.find(c => c.id === id)
  if (!content) return // res json error
  const existingContent = playlist.find(c => c.id === id)
  if (existingContent) return // res json error 2
  playlist.push(content)
})

app.get('/playlist', (req, res) => res.json(playlist))

const port = argv.p ? argv.p : 3000
const server = app.listen(port, () => {
  const host = server.address().address
  console.log('Karakuri listening at http://%s:%s', host, port)
  startPlayer(allContents)
})


// const server = require('http').createServer(app);
// const Primus = require('primus');
//
// const primus = new Primus(server, { transformer: 'engine.io' });
//
// // primus.on('connection', function connection(spark) {
// //   const email = spark.request.user.email;
// //   spark.join(email);
// // });
//
// primus.on('error', function handleError(err) {
//   console.error('An error has occured with primus', err);
// });
//
// server.listen(8080, function () {
//   console.log('realtime server has started. Primus channel : ' + config.primusChannel);
// });
