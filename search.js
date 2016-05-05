'use strict'

const exec = require('child_process').exec
const fs = require('fs')
const prompt = require('prompt')
const colors = require('colors')

const allContents = JSON.parse(fs.readFileSync('./.data/allContents.json'))

const isTrue = b => b

prompt.start()

const askForSearch = () => {
	prompt.get(['search'], (err, res) => {
		let regexes = []
		const words = res.search.split(' ')
		words.forEach(w => {
			regexes.push(new RegExp('(' + w + ')', 'i'))
		})

		let count = 1
		let karaFound = []
		allContents.map(kara => {
			const regexRes = regexes.map(r => {
				return kara.fileName.match(r)
			})
			if (regexRes.every(isTrue)) {
				if (karaFound.length === 0) {
					console.log('0: do nothing')
				}
				karaFound.push(kara)
				let path = kara.path
				regexes.forEach(r => {
					path = path.replace(r, '\$1'.green)
				})
				console.log(count + ": " + path)
				count++
			}
		})
		askForKara(karaFound).then(askForSearch)
	})
}

const askForKara = (choices) => {
	return new Promise((resolve, reject) => {
		prompt.get(['choice'], (err, res) => {
			const choice = parseInt(res.choice, 10)
			if (choice === 0) {
				resolve()
				return
			} else {
				const kara = choices[choice - 1]
				console.log('adding to smplayer: ' + kara.fileName)
				exec('smplayer -add-to-playlist "' + kara.path + '"')
				resolve()
			}
		})
	})
}

askForSearch()
