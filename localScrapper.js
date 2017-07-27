const fs = require('fs')
const { chain, flatten, kebabCase, last, omit } = require('lodash')
const argv = require('minimist')(process.argv.slice(2))

if (argv.h || argv.help) {
  console.log('usage: node localScrapper.js [options]\n')
  console.log('  --directory      Base directory to scrap (default : ./karaoke)')
  console.log('  --useSubDirs     Use sub directories instead of grouping by topmost directories')
  process.exit(1)
}

const karaokeDirectory = argv.directory || 'karaoke'
const groupBySubdirectories = !!argv.useSubDirs

const REGEX_WITH_LANGUAGE = /^(.+) - ([A-Z0-9 ]+) - (.+) ? (\(.{3}\))\.(.{2,4})$/
const REGEX_WITHOUT_LANGUAGE = /^(.+) - ([A-Z0-9 ]+) - (.+)\.(.{2,4})$/

const isVideoExtension = extension => [
  '3gp', 'mp4', 'flv', 'avi', 'webm', 'mkv', 'wmv', 'mpg',
].includes(extension.toLowerCase())
const isSubtitlesExtension = extension => ['ass', 'ssa'].includes(extension.toLowerCase())

function getFileInfos(fileName, dirPath, stat) {
  let group
  let type
  let songName
  let languageString
  let extension

  const directories = dirPath.split('/')
  // Group by subdirectories : Take the name of the last directory (/karaoke/TEMP/Anime >> Anime)
  // Group by top directory : Take the name of the topmost directory, excluding the base one :
  //   /karaoke/TEMP/Anime >> TEMP
  //   if anything is in the top directory, it will be indexed as such.
  const dirName = groupBySubdirectories ?
      last(directories) :
      (directories[1] || directories[0])

  const fileNamePatterns = fileName.match(REGEX_WITH_LANGUAGE) || []

  if (fileNamePatterns.length) {
    [, group, type, songName, languageString, extension] = fileNamePatterns
  } else {
    [, group, type, songName, extension] = fileName.match(REGEX_WITHOUT_LANGUAGE) || []
  }
  const isVideo = extension ? isVideoExtension(extension) : false
  const isSubtitles = extension ? isSubtitlesExtension(extension) : false
  const language = languageString && languageString.slice(1, languageString.length - 1)
  const path = `${dirPath}/${fileName}`
  // Used to match together videos and their subtitles
  const pathWithoutExtension = path.substr(path, path.lastIndexOf('.'))

  return {
    id: kebabCase(path),
    path,
    pathWithoutExtension,
    dirName,
    fileName,
    type,
    group,
    songName,
    language,
    isDir: stat.isDirectory(),
    isVideo,
    isSubtitles,
  }
}

const getFileListInfos = (filesList, dirPath) => Promise.all(
  filesList.map(
    fileName => new Promise((resolve, reject) => (
      fs.stat(`${dirPath}/${fileName}`, (err, stat) => {
        if (err) return reject(err)

        return resolve(getFileInfos(fileName, dirPath, stat))
      })
    ))
  )
)

const getDirectoryContents = dirPath => new Promise((resolve, reject) => (
  fs.readdir(dirPath, (err, filesList) => {
    if (err) return reject(err)

    return getFileListInfos(filesList, dirPath)
    .then(results => Promise.all(
      results.map(
        result => (result.isDir ? getDirectoryContents(result.path) : Promise.resolve(result))
      )
    ))
    .then(results => resolve(flatten(results)))
  })
))

function createDataDir() {
  try {
    fs.mkdirSync('./.data')
  } catch (e) {
    if (e.code !== 'EEXIST') throw new Error(`Unhandled error ${e.message}`)
  }
}

const getFormattedContent = () => (
  getDirectoryContents(karaokeDirectory).then(contents => {
    const videoContents = chain(contents)
      .groupBy('pathWithoutExtension')
      .mapValues(([content1 = {}, content2 = {}]) => {
        const videoContent = [content1, content2].find(({ isVideo }) => isVideo) || {}
        const subtitlesContent = [content1, content2].find(({ isSubtitles }) => isSubtitles) || {}
        return omit(
          Object.assign(videoContent, { subtitles: subtitlesContent.path }),
          ['isDir', 'isVideo', 'isSubtitles', 'pathWithoutExtension']
        )
      })
      .filter(content => content.id)

    return videoContents
  })
)

if (require.main === module) {
  createDataDir()
  getFormattedContent()
    .then(allContents =>
      fs.writeFileSync('./.data/allContents.json', JSON.stringify(allContents, null, 2)))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
} else {
  module.exports = getFormattedContent
}
