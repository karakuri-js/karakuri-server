const { Server } = require('ws')

let webSocketServer
let lastPlaylist

const start = ({ server }) => {
  webSocketServer = new Server({ server })
  webSocketServer.on('connection', (ws) => {
    if (lastPlaylist) {
      ws.send(JSON.stringify({
        type: 'playlist',
        payload: lastPlaylist,
      }))
    }
  })
}

const broadcast = data => webSocketServer && webSocketServer.clients.forEach(
  client => client.send(JSON.stringify(data))
)

const notifyPlaylist = playlist => {
  lastPlaylist = playlist

  broadcast({
    type: 'playlist',
    payload: playlist,
  })
}

module.exports = {
  start,
  notifyPlaylist,
}
