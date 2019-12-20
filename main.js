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

const sortedNames = Object.keys(animeNames).sort((a, b)=>{
    return b.length - a.length
})

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

function fuzzyMatch(text) {
    let anime = animeNames[text]

    if(anime == undefined) {
        for(let i=0;i<sortedNames.length;i++) {
            if(lev.get(text, sortedNames[i])<=2) {
                console.log(`Match: ${sortedNames[i]}`)
                anime = animeNames[sortedNames[i]]
                break
            }
        }
    }
    return anime
}

function substrMatch(text) {
    let result = []
    sortedNames.forEach(name => {
        if(name.length > 4 && text.includes(name)) {
            result.push(animeNames[name])
        }
    })
    return [...new Set(result)]
}

function postDesc(anime, info, msg) {
    console.log(info)
    const attachment = new Attachment(anime.picture)
    msg.channel.send(`**${anime.title}**\n${info.synopsis}`, attachment)
}

client.on('message', msg => {
  if (!msg.author.bot && msg.channel.name == 'anime-suggestions') {
    let matches = {}
    let text = msg.content.toLowerCase()

    let anime = fuzzyMatch(text)

    if(anime == undefined) {
        anime = substrMatch(text)
        anime.forEach(match => {
            mal.findAnime(match.malId)
                .then(info => {
                    if(info.popularity <= 300) {
                        postDesc(match, info, msg)
                    }
                })
        })
    } else {
        mal.findAnime(anime.malId)
            .then(info => {
                postDesc(anime, info, msg)
            })
            .catch(err => console.log(err))
    }

  }
})

client.login(JSON.parse(fs.readFileSync("token.json")).token)