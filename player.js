/*
 * TODO
 * App React Native prend une URL (ou IP, ou hostname)
 * Récupère liste contenus
 * Poste l'id dans la playlist
 * */













const Mplayer = require('mplayer');
const fs = require('fs');

const getRandomElement = array => array[Math.floor(Math.random() * array.length)]

const allContents = JSON.parse(fs.readFileSync('./.data/allContents.json'));
const playlist = []

let mplayer = new Mplayer({ verbose: true, debug: true });

mplayer.openFile(getRandomElement(allContents).path);
mplayer.on('stop', () => mplayer.openFile(getRandomElement(allContents).path))

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

let server = app.listen(3000, function () {
  let host = server.address().address;
  let port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
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
