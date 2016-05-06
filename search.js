'use strict'

const exec = require('child_process').exec
const fs = require('fs')
const prompt = require('prompt')
const colors = require('colors')

const allContents = JSON.parse(fs.readFileSync('./.data/allContents.json'))

const isTrue = b => b

const onExec = (param) => {
	exec('smplayer -add-to-playlist "' + param + '"')
}

const findKaras = (karaokes, regexes) => {
	let karaFound = []
	karaokes.forEach(kara => {
		const regexRes = regexes.map(r => {
			return kara.fileName.match(r)
		})
		if (regexRes.every(isTrue)) {
			karaFound.push(kara)
		}
	})
	return karaFound
}

prompt.start()

const askForSearch = () => {
	prompt.get(['search'], (err, res) => {
		let regexes = []
		const words = res.search.split(' ')
		words.forEach(w => {
			regexes.push(new RegExp('(' + w + ')', 'ig'))
		})

		const karaFound = findKaras(allContents, regexes)
		if (karaFound.length) {
			console.log('0: do nothing')
			karaFound.forEach((kara, index) => {
				let path = kara.path
				regexes.forEach(r => {
					path = path.replace(r, '\$1'.green)
				})
				console.log((index + 1) + ": " + path)
			})
		}
		askForKara(karaFound).then(askForSearch)
	})
}

const askForKara = (choices) => {
	return new Promise((resolve, reject) => {
		prompt.get(['choice'], (err, res) => {
			const choice = parseInt(res.choice, 10)
			if (choice !== 0 && parseInt(choice, 10) == choice) {
				const kara = choices[choice - 1]
				console.log('adding to smplayer: ' + kara.fileName)
				onExec(kara.path)
			}
			resolve()
		})
	})
}

askForSearch()
