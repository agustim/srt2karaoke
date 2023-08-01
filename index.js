const srtparsejs = require('srtparsejs')
const fs = require('fs')
const path = require('path')
const initCode = "<font color=#ffff00>"
const endCode = "</font>"
const MAX_LENGHT = 30
let newSrt = []
let actualSentence = []

const StringActualSentence = (actualSentence) => {
    let string = ''
    actualSentence.forEach((item) => {
        string += item.text + ' '
    })
    return string.slice(0, -1)
}

const loadSrt = (srtPath) => {
    const srt = fs.readFileSync(srtPath, 'utf8')
    return srtparsejs.parse(srt)
}

const saveSrt = (srtPath, srt) => {
    const srtStr = srtparsejs.toSrt(srt)
    fs.writeFileSync(srtPath, srtStr)
}

const isEndSentence = (text, actualSentence) => {
    const endSentence = ['.', '!', '?', ',']
    const lastChar = text[text.length - 1]
    // Ho hem trobat el final, o ja hem fet més de MAX_LENGHT caràcters.
    if (endSentence.includes(lastChar) 
        || StringActualSentence(actualSentence).length > MAX_LENGHT) {
        return true
    }
    return false
}

const arreglarSentence = (sentence) => {
    const chartNotSpace = ["'", '-', "`"]
    let preString = ''
    for(let i = 0; i < sentence.length; i++) {
        let newItem = {}
        let item = sentence[i]
        preString += item.text
        if (sentence.length - 1  > i && !chartNotSpace.includes(sentence[i+1].text[0])) {
            preString += ' '
        }  
        newItem.id = item.id
        newItem.text = initCode + preString + endCode
        newItem.startTime = item.startTime
        newItem.endTime = item.endTime
        // Afegim la resta de la frase
        for(let j = i+1 ; j < sentence.length ; j++) {
            newItem.text += sentence[j].text
            if (sentence.length - 1  > j && !chartNotSpace.includes(sentence[j+1].text[0])) {
                newItem.text += ' '
            }  
        }
        newSrt.push(newItem)
    }
}

const srt2karaoke = (infile, outfile) => {
    const srt = loadSrt(path.join(__dirname, infile))

    srt.forEach((item, index) => {
        actualSentence.push(item)
        if (isEndSentence(item.text, actualSentence)) {
            // Ja hem arribat al final de la sentencia, ara hem de crear el nou srt...
            const newSentence = arreglarSentence(actualSentence)
            // Netegem la sentencia actual
            actualSentence = []
        }
    })

    saveSrt(path.join(__dirname, outfile), newSrt)
}

const start = () => {
    if (process.argv.length < 4) {
        console.log('Usage: node index.js <infile> <outfile>')
        return
    }
    const infile = process.argv[2]
    const outfile = process.argv[3]
    srt2karaoke(infile, outfile)
}


start()