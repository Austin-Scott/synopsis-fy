const { Client, Attachment } = require('discord.js')
const client = new Client()
const fs = require("fs")
const Jikan = require('jikan-node')
const mal = new Jikan()
const lev = require('fast-levenshtein')

let model = loadOrCreateNewModel()

function saveServerPreferences(serverId, preferences) {
    model[serverId] = preferences
    fs.writeFileSync('preferences.json', JSON.stringify(model))
}

function getServerPreferences(serverId) {
    let existingPreferences = model[serverId]
    if(existingPreferences) return existingPreferences
    return createNewServerPreferences()
}

function createNewServerPreferences() {
    return {
        maximumStringMatchDistance: 3,
        minimumSubStringMatchingLength: 5,
        allowedChannels: []
    }
}

function loadOrCreateNewModel() {
    try {
        return JSON.parse(fs.readFileSync('preferences.json'))
    } catch (error) {
        return {}
    }
}

/**
 * Returns an object acting as a HashMap between all anime titles to objects with info about its title
 */
function createAnimeNameMap() {
    // Load local copy of anime database into memory
    const aod = JSON.parse(fs.readFileSync('anime-offline-database/anime-offline-database.json'))

    // HashMap mapping anime titles to their metadata
    let result = {}

    // Sort all titles in descending order based on their total number of relations to other anime
    // This way original works are more likely to take the shorter synonym keys instead of their derivative works
    const sortedData = aod.data.sort((a, b) => {
        return b.relations.length - a.relations.length
    })

    // For each title in the offline anime database
    sortedData.forEach(element => {
        let sources = element.sources.join(',')

        // Use regex to match only link to MyAnimeList's official page
        let regex = new RegExp('https://myanimelist.net/anime/(\\d+)')
        let matches = sources.match(regex)

        // If MyAnimeList is listed as one of the sources of this anime
        if (matches && matches.length == 2) {

            // MyAnimeList's ID of this anime
            let id = matches[1]

            // Value to be mapped to by any of this anime's titles
            let anime = {
                // The official title of this anime
                title: element.title,
                // URL to image about this title
                picture: element.picture,
                // ID of this anime on MyAnimeList.net
                malId: id,
                // URL to this title's official page on MyAnimeList.net
                malUrl: matches[0]
            }

            // Add the official title as a key to the HashMap in lower case
            let title = element.title.toLowerCase()
            result[title] = anime

            // Add all synonym titles if they have not already been added to the HashMap and they are longer than 2 characters
            element.synonyms.forEach(alt => {
                let altTitle = alt.toLowerCase()
                if (result[altTitle] == undefined && alt.length > 2) {
                    result[altTitle] = anime
                }
            })
        }

    })
    return result
}

// Hash map mapping all anime titles to their metadata
const animeNames = createAnimeNameMap()

/**
 * Executed when this bot has been logged in successfully
 */
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
})

/**
 * Tries to match some text to an anime title. If no matches are found it will first try to find a substring match 
 *  otherwise it will try to find near matches with the Levenshtein distance algorithm.
 * @param {String} text Text possibly containing an anime title to be matched
 * @returns {Anime} Metadata for show if matched, null otherwise
 */
function fuzzyMatch(text) {
    if (text == '') return null

    // Try to match title exactly
    let anime = animeNames[text]

    // If the text is not an exact match to a title
    if (anime == undefined) {

        // Stores the best ratio of search text length / title length for valid substring match
        let closestSubstringMatch = 0.0
        let bestSubstringMatch = null

        // Stores the smallest distance between our text and any title
        let smallestDistance = Number.MAX_SAFE_INTEGER
        let bestFuzzyMatch = null

        // For each known anime title
        Object.keys(animeNames).forEach(title => {
            // If our search text is long enough to substring match and there is a match
            if (title.length >= minimumSubStringMatchingLength && title.includes(text)) {
                let currentSubstringMatch = text.length / title.length

                if (currentSubstringMatch > closestSubstringMatch) {
                    bestSubstringMatch = animeNames[title]
                    closestSubstringMatch = currentSubstringMatch
                }
            }

            // If there has not been a substring match yet
            if (bestSubstringMatch == null) {
                let currentDistance = lev.get(text, title)

                // If the text is deemed 'close enough' to the title
                if (currentDistance < smallestDistance) {
                    smallestDistance = currentDistance
                    bestFuzzyMatch = animeNames[title]
                }
            }
        })

        // If none of the fuzzy matches were close enough
        if(smallestDistance > maximumStringMatchDistance) {
            bestFuzzyMatch = null
        }

        // If there was a substring match
        if(bestSubstringMatch != null) {
            anime = bestSubstringMatch
        } else {
            anime = bestFuzzyMatch
        }

    }

    return anime
}

/**
 * Posts a synopsis to the channel where the information was requested
 * @param {Anime} anime Local metadata object about this anime
 * @param {Object} info Metadata directly pulled from MyAnimeList
 * @param {Message} msg Discord.js message to be used to send our response
 */
function postDesc(anime, info, msg) {
    // Thumbnail for this title
    const attachment = new Attachment(anime.picture)

    if (info.rating && !info.rating.includes('Hentai')) {
        // This anime is SFW
        msg.channel.send(`**${anime.title}**\n<${anime.malUrl}>\n${info.synopsis || '*No synopsis was found for this title*'}`, attachment)
    } else if(msg.channel.nsfw) {
        // The referenced anime is a hentai: add warning, remove thumbnail, and hide synopsis behind spoiler tag
        msg.channel.send(`**${anime.title}** - ***Warning:*** __**This is a 18+ Hentai**__\n||${info.synopsis || '*No synopsis was found for this title*'}||`)
    }
}

/**
 * Executed whenever a message is posted to any channel on any server
 */
client.on('message', msg => {
    let serverId = msg.guild.id
    let serverPreferences = getServerPreferences(serverId)

    let isAdmin = msg.member.hasPermission('ADMINISTRATOR')

    if(!msg.author.bot && msg.content.startsWith('s!')) {
        let text = msg.content
        let addChannel = text.match(/s\!enable (\S+)/)
        let removeChannel = text.match(/s\!disable (\S+)/)
        if(text == "s!list") {
            msg.reply(`Active channel list:\n${serverPreferences.allowedChannels.join(',\n')}`)
        } else if(addChannel && addChannel.length == 2) {
            if(isAdmin) {
                let channelName = addChannel[1]
                serverPreferences.allowedChannels.push(channelName)
                saveServerPreferences(serverId, serverPreferences)
                msg.reply(`You have successfully added "${channelName}" to my active channel list`)
            } else {
                msg.reply("You must be an admin to perform that action")
            }
        } else if(removeChannel && removeChannel.length == 2) {
            if(isAdmin) {
                let channelName = removeChannel[1]

                serverPreferences.allowedChannels = serverPreferences.allowedChannels.filter(channel => channelName != channel)
                saveServerPreferences(serverId, serverPreferences)
                msg.reply(`You have successfully removed "${channelName}" from my active channel list`)
                
            } else {
                msg.reply("You must be an admin to perform that action")
            }
        } else {
            msg.reply('Command list:\nEnable this bot in a channel: `s!enable CHANNEL-NAME-HERE`\nDisable this bot in a channel: `s!disable CHANNEL-NAME-HERE`\nView active channel list: `s!list`\nPrint this command list: `s!help`')
        }
        return
    }

    // Continue only if the poster is not a bot and the channel is 'anime-suggestions'
    if (!msg.author.bot && serverPreferences.allowedChannels.includes(msg.channel.name)) {

        // Raw message received converted to lower case
        let text = msg.content.toLowerCase()

        // Regex that matches: italics, bold, striked, or quoted text
        let regex = /(\*{1,2}|\~{2}|\"|_|'|`)(.+?)\1/

        // Array of possible titles in the original message
        let titles = []

        // Extract possible titles from the message
        let matches = text.match(regex)
        while (matches != null && matches.length >= 3) {
            titles.push(matches[2])
            text = text.replace(matches[0], '')
            matches = text.match(regex)
        }

        // For each possible title
        titles.forEach(title => {
            // Try to match the title
            let anime = fuzzyMatch(title)

            // If the match was successful
            if (anime != null) {
                // Request information from MyAnimeList
                mal.findAnime(anime.malId)
                    .then(info => {
                        // Post synopsis about this title
                        postDesc(anime, info, msg)
                    })
                    .catch(err => console.log(err))
            }
        })

    }
})

// Authenticate this bot using its private key
client.login(JSON.parse(fs.readFileSync("token.json")).token)
