'use strict';

let fs = require('fs');
let async = require('async');

let allContents = [];
let types = [];
let dirs = [];

function isVideoExtension(extension) {
  extension = extension.toLowerCase();
  return ['mp4', 'flv', 'avi', 'webm', 'mkv', 'wmv'].indexOf(extension) !== -1
}

function getFileInfos(fileName, dirPath, stat) {
  let lastIndexOfSlash = dirPath.lastIndexOf('/');
  let dirName = lastIndexOfSlash !== -1 ? dirPath.substr(lastIndexOfSlash + 1) : '.';
  let fileNamePatterns = fileName.match(/^(.+) - ([A-Za-z0-9]+) - (.+)\.(.{2,4})$/i);
  let type, group, songName, extension;
  let isVideo = false;

  if (fileNamePatterns) {
    type = fileNamePatterns[2];
    group = fileNamePatterns[1];
    songName = fileNamePatterns[3];
    extension = fileNamePatterns[4];
    isVideo = isVideoExtension(extension);
  }

  return {
    path: dirPath + '/' + fileName,
    dirName: dirName,
    fileName: fileName,
    type: type,
    group: group,
    songName: songName,
    isDir: stat.isDirectory(),
    isFile: stat.isFile(),
    isVideo: isVideo
  };
}

// Gets the directory contents as a big array
function getDirectoryContents(dirPath, callback) {
  fs.readdir(dirPath, function(err, filesList) {
    if (err) return callback(err);
    async.map(filesList, function(fileName, cbMap) {
      fs.stat(dirPath + '/' + fileName, function(err, stat) {
        if (err) return cbMap(err);
        cbMap(null, getFileInfos(fileName, dirPath, stat));
      });
    }, function(err, results) {
      if (err) return callback(err);
      async.reduce(results, [], function(previous, result, cbReduce) {
        if (!result.isDir) return cbReduce(null, previous.concat(result));
        getDirectoryContents(result.path, function(err, results) {
          if (err) return cbReduce(err);
          return cbReduce(null, previous.concat(results));
        });
      }, callback);
    });
  });
}

function keepVideoContents(contents) {
  return contents.filter(function(content) {
    return content.isVideo;
  });
}

function getFiltered(filterKey, filterValue) {
  return allContents.filter(function(content) {
    return content[filterKey] === filterValue;
  });
}

function createDataDir() {
  try {
    fs.mkdirSync('./.data');
  } catch (e) {
    if (e.code !== 'EEXIST') throw new Error('Unhandled error ' + e.message);
  }
}

createDataDir();

getDirectoryContents('./karaoke', function(err, results) {
  if (err) return console.error(err);
  allContents = keepVideoContents(results).map((element, id) => Object.assign({}, element, { id }));
  fs.writeFileSync('./.data/allContents.json', JSON.stringify(allContents));
});
