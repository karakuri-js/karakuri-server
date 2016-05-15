const Mplayer = require('mplayer')
const fs = require('fs')
const argv = require('minimist')(process.argv.slice(2))
const express = require('express')
const bodyParser = require('body-parser')

if (argv.h || argv.help) {
  console.log('usage: node player.js [options]\n')
  console.log('  -p [PORT_ID]     sets the port used by the server')
  console.log('  --random         only play karaokes at random without server')
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

const mplayerOptions = {
  verbose: !!(argv.verbose || argv.v),
  debug: !!(argv.debug || argv.d),
  args: '-ass -vo gl_nosw -fixed-vo',
}
if (argv.novideo) {
  mplayerOptions.args += ' -vo null'
}
const mplayer = new Mplayer(mplayerOptions)

const startRandomPlayer = (player, files) => {
  player.openFile(getRandomPath(files))
  player.on('stop', () => player.openFile(getRandomPath(files)))
}

if (argv.random) {
  startRandomPlayer(mplayer, allContents)
} else {
  const app = express()
  app.use(bodyParser.json())

  const startPlayer = (player, files) => {
    const firstKara = files.shift()
    console.log(firstKara.path)
    player.openFile(firstKara.path)
    player.on('stop', () => {
      if (files.length) {
        const kara = files.shift()
        console.log(kara.path)
        player.openFile(kara.path)
      } else {
        player.stop()
        player.fullscreen()
      }
    })
  }

  app.get('/contents', (req, res) => res.json(allContents))

  app.post('/request', (req, res) => {
    const id = parseInt(req.body.id, 10)
    const content = allContents.find(c => c.id === id)
    if (!content) return // res json error
    const existingContent = playlist.find(c => c.id === id)
    if (existingContent) return res.send({ error: 'already exists' }) // json error 2
    playlist.push(content)
    res.send(`${content.fileName} has been added`)
  })

  app.get('/playlist', (req, res) => res.json(playlist))

  app.get('/play', (req, res) => {
    playlist.sort(() => 0.5 - Math.random())
    res.send(playlist.map(file => file.fileName).join('\n'))
    startPlayer(mplayer, playlist)
  })

  const port = argv.p ? argv.p : 3000
  const server = app.listen(port, () => {
    const host = server.address().address
    console.log('Karakuri listening at http://%s:%s', host, port)
  })
}


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
