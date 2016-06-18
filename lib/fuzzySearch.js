const identity = thing => thing

const fuzzySearch = (array, string, lookedUpProperty = false) => {
  const words = string.split(' ')
  const regexes = words.map(word => new RegExp(`(${word})`, 'ig'))
  const result = array.reduce(
    (acc, item) => {
      const itemValue = lookedUpProperty ? item[lookedUpProperty] : item
      const regexRes = regexes.map(regex => itemValue.match(regex))
      return regexRes.every(identity) ? acc.concat(item) : acc
    },
    []
  )
  return { result, regexes }
}

module.exports = fuzzySearch
