const fs = require('fs')
const async = require('async')
const { omit } = require('lodash')

const isVideoExtension = extension => [
  '3gp', 'mp4', 'flv', 'avi', 'webm', 'mkv', 'wmv',
].indexOf(extension.toLowerCase()) !== -1

function getFileInfos(fileName, dirPath, stat) {
  const lastIndexOfSlash = dirPath.lastIndexOf('/')
  const dirName = lastIndexOfSlash !== -1 ? dirPath.substr(lastIndexOfSlash + 1) : '.'
  const fileNamePatterns = fileName.match(/^(.+) - ([A-Z0-9 ]+) - (.+)\.(.{2,4})$/) || []
  const [, group, type, songName, extension] = fileNamePatterns
  const isVideo = extension ? isVideoExtension(extension) : false

  return {
    path: `${dirPath}/${fileName}`,
    dirName,
    fileName,
    type,
    group,
    songName,
    isDir: stat.isDirectory(),
    isFile: stat.isFile(),
    isVideo,
  }
}

// Gets the directory contents as a big array
function getDirectoryContents(dirPath, callback) {
  fs.readdir(dirPath, (err, filesList) => {
    if (err) return callback(err)
    async.map(filesList, (fileName, cbMap) => {
      fs.stat(`${dirPath}/${fileName}`, (err, stat) => {
        if (err) return cbMap(err)
        cbMap(null, getFileInfos(fileName, dirPath, stat))
      })
    }, (err, results) => {
      if (err) return callback(err)
      async.reduce(results, [], (previous, result, cbReduce) => {
        if (!result.isDir) return cbReduce(null, previous.concat(result))
        getDirectoryContents(result.path, (err, results) => {
          if (err) return cbReduce(err)
          return cbReduce(null, previous.concat(results))
        })
      }, callback)
    })
  })
}

function createDataDir() {
  try {
    fs.mkdirSync('./.data')
  } catch (e) {
    if (e.code !== 'EEXIST') throw new Error(`Unhandled error ${e.message}`)
  }
}

const getFormattedContent = () => new Promise((resolve, reject) => {
  getDirectoryContents('./karaoke', (err, contents) => {
    if (err) return reject(err)
    const allContents = contents
      .filter(content => content.isVideo)
      .map((element, id) => Object.assign(
        omit(element, ['isDir', 'isFile', 'isVideo']),
        { id }
      ))
    resolve(allContents)
  })
})

if (require.main === module) {
  createDataDir()
  getFormattedContent()
    .then(allContents =>
      fs.writeFileSync('./.data/allContents.json', JSON.stringify(allContents, null, 2)))
    .catch(err => console.error(err))
} else {
  module.exports = getFormattedContent
}
