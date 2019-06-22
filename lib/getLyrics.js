const assParser = require('ass-parser')
const fs = require('fs')
const { first } = require('lodash')

const getLyrics = (subtitlesString) => {
  const parsedAss = assParser(subtitlesString)
  const parsedEventsSectionBody = first(
    parsedAss.filter(({ section }) => section === 'Events'),
  ).body
  return parsedEventsSectionBody
    .filter(({ key }) => key === 'Dialogue')
    // flatten & remove ass formatting (eg. {\\k100})
    .map(({ value: { Text } }) => Text.replace(/\{\\.+?\}/g, ''))
}

const getLyricsFromFile = filePath => getLyrics(
  fs.readFileSync(filePath, { encoding: 'utf8' }),
)

module.exports = {
  getLyrics,
  getLyricsFromFile,
}
