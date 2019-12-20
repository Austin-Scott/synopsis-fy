const { Client, Attachment } = require('discord.js')
const client = new Client()
const fs = require("fs")
const Jikan = require('jikan-node')
const mal = new Jikan()
const lev = require('fast-levenshtein')


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
        let title = element.title.toLowerCase()
        if(result[title] == undefined) {
            result[title] = anime
        }
        element.synonyms.forEach(alt => {
            let altTitle = alt.toLowerCase()
            if(result[altTitle] == undefined && alt.length > 2) {
                result[altTitle] = anime
            }
        })
    }
     
  })
  return result
}
const animeNames = createAnimeNameMap()

const sortedNames = Object.keys(animeNames).sort((a, b)=>{
    return b.length - a.length
})

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

function fuzzyMatch(text) {
    if(text == '') return null
    let anime = animeNames[text]

    if(anime == undefined) {
        for(let i=0;i<sortedNames.length;i++) {
            if(lev.get(text, sortedNames[i])<=3) {
                console.log(`Match: ${sortedNames[i]}`)
                anime = animeNames[sortedNames[i]]
                break
            }
        }
        if(anime==undefined) {
            anime = null
        }
    }
    return anime
}

function postDesc(anime, info, msg) {
    console.log(info)
    const attachment = new Attachment(anime.picture)
    msg.channel.send(`**${anime.title}**\n${info.synopsis || '*No synopsis was found for this title*'}`, attachment)
}

client.on('message', msg => {
  if (!msg.author.bot && msg.channel.name == 'anime-suggestions') {
    let text = msg.content.toLowerCase()

    let regex = /(\*{1,2}|\~{2}|\"|_|'|`)(.+?)\1/

    let titles = []
    let matches = text.match(regex)
    while(matches != null && matches.length >= 3) {
        titles.push(matches[2])
        text = text.replace(matches[0], '')
        matches = text.match(regex)
    }

    titles.forEach(title => {
        let anime = fuzzyMatch(title)
        if(anime != null) {
            mal.findAnime(anime.malId)
                .then(info => {
                    postDesc(anime, info, msg)
                })
                .catch(err => console.log(err))
        }
    })

  }
})

client.login(JSON.parse(fs.readFileSync("token.json")).token)