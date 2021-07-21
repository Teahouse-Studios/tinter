const fs = require('fs')
fs.writeFileSync('./data.json', JSON.stringify(fs.readFileSync('./minecraft_word_bank.csv').toString().split("\n").slice(1).map(v => {
  let a = v.split(',')
  return {
    word: a[0],
    difficulty: ~~a[1]
  }
})))
