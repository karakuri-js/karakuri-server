const fs = require('fs')
const async = require('async')
const { kebabCase, omit } = require('lodash')

const REGEX_WITH_LANGUAGE = /^(.+) - ([A-Z0-9 ]+) - (.+) ? (\(.{3}\))\.(.{2,4})$/
const REGEX_WITHOUT_LANGUAGE = /^(.+) - ([A-Z0-9 ]+) - (.+)\.(.{2,4})$/

const isVideoExtension = extension => [
  '3gp', 'mp4', 'flv', 'avi', 'webm', 'mkv', 'wmv', 'mpg',
].indexOf(extension.toLowerCase()) !== -1

function getFileInfos(fileName, dirPath, stat) {
  let group
  let type
  let songName
  let languageString
  let extension

  const lastIndexOfSlash = dirPath.lastIndexOf('/')
  const dirName = lastIndexOfSlash !== -1 ? dirPath.substr(lastIndexOfSlash + 1) : '.'
  const fileNamePatterns = fileName.match(REGEX_WITH_LANGUAGE) || []

  if (fileNamePatterns.length) {
    [, group, type, songName, languageString, extension] = fileNamePatterns
  } else {
    [, group, type, songName, extension] = fileName.match(REGEX_WITHOUT_LANGUAGE) || []
  }
  const isVideo = extension ? isVideoExtension(extension) : false
  const language = languageString && languageString.slice(1, languageString.length - 1)
  const path = `${dirPath}/${fileName}`

  return {
    id: kebabCase(path),
    path,
    dirName,
    fileName,
    type,
    group,
    songName,
    language,
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
      .map((element) => omit(element, ['isDir', 'isFile', 'isVideo']))
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
