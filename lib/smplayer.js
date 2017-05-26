const { exec } = require("child_process");

const addToPlaylist = filePath =>
  exec(`smplayer -add-to-playlist "${filePath}"`);

module.exports = { addToPlaylist };
