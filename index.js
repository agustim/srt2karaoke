const srtparsejs = require('srtparsejs')
const fs = require('fs')
const path = require('path')
const COLOR = 'E3391B'
const initCode = "<font color=#" + COLOR + ">"
const endCode = "</font>"
const MAX_LENGHT = 15
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
const saveAss = (srtPath, ass) => {
    let scrtInfo = `[Script Info]
Title: untitled
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0
PlayResX: 
PlayResY: 
WrapStyle: 2
ScaledBorderAndShadow: No`

    let styles = `[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style:Default,Roboto,25,&H00${COLOR},&H03FFFFFF,&H00000000,&H02000000,1,0,0,0,100,100,0,0,1,2,1,2,10,10,10,1`

    let eventsHeader = `[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`

    let assFile = scrtInfo+"\n\n"+styles+"\n\n"+eventsHeader+"\n"

    //De cada item de ass el convertim a un string de ass
    for(let i=0; i < ass.length; i++){
        let item = ass[i]
        assFile += "Dialogue: 0," + item.startTime + "," + item.endTime + ",Default,,0,0,0,," + item.text +"\n"
    }
    
    fs.writeFileSync(srtPath, assFile)
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

const arreglarSentenceSRT = (sentence) => {
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
const convertToMiliseconds = (time) => {
    const timeArray = time.split(':')
    const hours = parseInt(timeArray[0])
    const minutes = parseInt(timeArray[1])
    const seconds = parseInt(timeArray[2].split(',')[0])
    const miliseconds = parseInt(timeArray[2].split(',')[1])
    return Math.trunc(((hours * 3600 + minutes * 60 + seconds) * 1000 + miliseconds)/10)
}
const calculeTime = (timeEnd, timeStart) => {
    const timeEndMiliseconds = convertToMiliseconds(timeEnd)
    const timeStartMiliseconds = convertToMiliseconds(timeStart)
    return timeEndMiliseconds - timeStartMiliseconds
}
const fixedTime = (time) => {
    return time.split(',').join('.').slice(0, -1)
}
const arreglarSentenceASS = (sentence) => {
    const chartNotSpace = ["'", '-', "`"]
    let preString = ''
    let newItem = {}
    newItem.startTime = fixedTime(sentence[0].startTime)
    newItem.endTime = fixedTime(sentence[sentence.length - 1].endTime)
    for(let i = 0; i < sentence.length; i++) {
        let endTime = 0
        // Primer posem el temps que està en el primer item.
        if (i < sentence.length - 1) {
            endTime = sentence[i+1].startTime
        } else {
            endTime = sentence[i].endTime
        }

        let item = sentence[i]
        preString += '{'+String.fromCharCode(92)+'k' + calculeTime(endTime, item.startTime) + "}" + item.text
        if (sentence.length - 1  > i && !chartNotSpace.includes(sentence[i+1].text[0])) {
            preString += ' '
        }
        newItem.id = item.id
    }
    newItem.text = preString
    newSrt.push(newItem)
}


const srt2karaoke = (infile, outfile, type) => {
    const srt = loadSrt(path.join(__dirname, infile))

    srt.forEach((item) => {
        actualSentence.push(item)
        if (isEndSentence(item.text, actualSentence)) {
            // Ja hem arribat al final de la sentencia, ara hem de crear el nou srt...
            const arreglarSentence = type === 'srt' ? arreglarSentenceSRT : arreglarSentenceASS
            const newSentence = arreglarSentence(actualSentence)
            // Netegem la sentencia actual
            actualSentence = []
        }
    })

    if (type === 'srt') {
        saveSrt(path.join(__dirname, outfile), newSrt)
    } else {
        saveAss(path.join(__dirname, outfile), newSrt)
    }
}

const start = () => {
    if (process.argv.length < 4) {
        console.log('Usage: node index.js <infile> <outfile> [srt|ass]')
        return
    }
    const infile = process.argv[2]
    const outfile = process.argv[3]
    const type = process.argv[4] || 'ass'
    srt2karaoke(infile, outfile,type)
}


start()