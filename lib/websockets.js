const { Server } = require("ws");

let webSocketServer;

const start = ({ server }) => (webSocketServer = new Server({ server }));
const broadcast = data =>
  webSocketServer.clients.forEach(client => client.send(JSON.stringify(data)));

const notifyNewPlayingContent = content =>
  broadcast({
    type: "playingContent",
    payload: content
  });

const notifyPlaylist = playlist =>
  broadcast({
    type: "playlist",
    payload: playlist
  });

module.exports = {
  start,
  notifyNewPlayingContent,
  notifyPlaylist
};
