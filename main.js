const { Client, Attachment } = require('discord.js')
const client = new Client()
const fs = require("fs")


function createAnimeNameMap() {
  const aod = JSON.parse(fs.readFileSync('anime-offline-database/anime-offline-database.json'))
  let result = {}
  const sortedData = aod.data.sort((a, b) => {
      return b.relations.length - a.relations.length
  })
  sortedData.forEach(element => {
    let sources = element.sources.join(',')
    let regex = new RegExp('https://myanimelist.net/anime/(\\d+)')
    let matches = sources.match(regex)
    if(matches && matches.length == 2) {
        let id = matches[1]
        let anime = {
            title: element.title,
            picture: element.picture,
            malId: id
        }   
        if(result[element.title.toLowerCase()] == undefined) {
            result[element.title.toLowerCase()] = anime
        }
        element.synonyms.forEach(alt => {
            if(result[alt.toLowerCase()] == undefined && alt.length > 2) {
                result[alt.toLowerCase()] = anime
            }
        })
    }
     
  })
  return result
}
const animeNames = createAnimeNameMap()

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', msg => {
  if (!msg.author.bot && msg.channel.name == 'anime-suggestions') {
    let matches = {}
    let text = msg.content

    let anime = animeNames[text.toLowerCase()]

    if(anime != undefined) {
        const attachment = new Attachment(anime.picture)
        msg.channel.send(anime.title, attachment)
    }

  }
})

client.login(JSON.parse(fs.readFileSync("token.json")).token)