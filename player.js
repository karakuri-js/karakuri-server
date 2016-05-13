/*
 * TODO
 * App React Native prend une URL (ou IP, ou hostname)
 * Récupère liste contenus
 * Poste l'id dans la playlist
 * */












const Mplayer = require('mplayer');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));

if (argv.h || argv.help) {
	console.log('usage: node player.js [options]\n')
	console.log('  -p [PORT_ID]     sets the port used by the server')
	console.log('  --novideo        play only audio')
	console.log('  -q, --quiet      enjoy the silence')
	console.log('  -v, --verbose    make mplayer verbose')
	console.log('  -d, --debug      debug mplayer')
	console.log('  -h, --help       display this help')
	return
}

if (argv.q || argv.quiet) {
	console.log = () => {}
}

const getRandomElement = array => array[Math.floor(Math.random() * array.length)]
const getRandomPath = array => {
	const kara = getRandomElement(array)
	console.log(kara.path)
	return kara.path
}

const allContents = JSON.parse(fs.readFileSync('./.data/allContents.json'));
const playlist = []

let mplayerOptions = { verbose: !!(argv.verbose || argv.v), debug: !!(argv.debug || argv.d) }
if (argv.novideo) {
	mplayerOptions.args = '-vo null'
}
let mplayer = new Mplayer(mplayerOptions);

mplayer.openFile(getRandomPath(allContents));
mplayer.on('stop', () => mplayer.openFile(getRandomPath(allContents)))

let express = require('express');
let app = express();

app.get('/contents', (req, res) => res.json(allContents));

app.post('/request', (req, res) => {
  const id = parseInt(req.body.id, 10)
  const content = allContents.find(content => content.id === id)
  if (!content) return // res json error
  const existingContent = playlist.find(content => content.id === id)
  if (existingContent) return // res json error 2
  playlist.push(content)
})

app.get('/playlist', (req, res) => res.json(playlist))

const port = argv.p ? argv.p : 3000
let server = app.listen(port, function () {
  let host = server.address().address;
  let port = server.address().port;

  console.log('Karakuri listening at http://%s:%s', host, port);
});


// let server = require('http').createServer(app);
// let Primus = require('primus');
//
// let primus = new Primus(server, { transformer: 'engine.io' });
//
// // primus.on('connection', function connection(spark) {
// //   let email = spark.request.user.email;
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
