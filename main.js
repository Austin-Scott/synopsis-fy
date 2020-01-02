const { Client, Attachment } = require('discord.js')
const client = new Client()
const fs = require("fs")
const Jikan = require('jikan-node')
const mal = new Jikan()
const lev = require('fast-levenshtein')
const util = require('util')

let model = loadOrCreateNewModel()

function saveServerPreferences(serverId, preferences) {
    model[serverId] = preferences
    fs.writeFileSync('preferences.json', JSON.stringify(model))
}

function getServerPreferences(serverId) {
    let existingPreferences = model[serverId]
    if (existingPreferences) return existingPreferences
    return createNewServerPreferences()
}

function createNewServerPreferences() {
    return {
        maximumStringMatchDistance: 3,
        minimumSubStringMatchingLength: 5,
        allowedChannels: ['anime-suggestions']
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

// HashMap mapping all anime titles to their metadata
const animeNames = createAnimeNameMap()

/**
 * Executed when this bot has been logged in successfully
 */
client.on('ready', () => {
    client.user.setPresence({ game: { name: '| s!help', type: 'WATCHING' }, status: 'online' })
    console.log(`Logged in as ${client.user.tag}!`)
})

/**
 * Tries to match some text to an anime title. If no matches are found it will first try to find a substring match 
 *  otherwise it will try to find near matches with the Levenshtein distance algorithm.
 * @param {String} text Text possibly containing an anime title to be matched
 * @param {Object} serverPreferences
 * @returns {Anime} Metadata for show if matched, null otherwise
 */
function fuzzyMatch(text, serverPreferences) {
    if (text == '') return null

    // Title converted to lower case
    text = text.toLowerCase()

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
            if (text.length >= serverPreferences.minimumSubStringMatchingLength && title.includes(text)) {
                let currentSubstringMatch = text.length / title.length

                if (currentSubstringMatch > closestSubstringMatch) {
                    bestSubstringMatch = animeNames[title]
                    closestSubstringMatch = currentSubstringMatch
                }
            }

            // If there has not been a substring match yet
            if (text.length > 3 && bestSubstringMatch == null) {
                let currentDistance = lev.get(text, title)

                // If the text is deemed 'close enough' to the title
                if (currentDistance < smallestDistance) {
                    smallestDistance = currentDistance
                    bestFuzzyMatch = animeNames[title]
                }
            }
        })

        // If none of the fuzzy matches were close enough
        if (smallestDistance > serverPreferences.maximumStringMatchDistance) {
            bestFuzzyMatch = null
        }

        // If there was a substring match
        if (bestSubstringMatch != null) {
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
 */
function postDesc(anime, info, onReply) {
    // Thumbnail for this title
    const attachment = new Attachment(anime.picture)

    if (info.rating && !info.rating.includes('Hentai')) {
        // This anime is SFW
        onReply(`**${anime.title}**\n<${anime.malUrl}>\n${info.synopsis || '*No synopsis was found for this title*'}`, attachment)
    } else if (msg.channel.nsfw) {
        // The referenced anime is a hentai: add warning, remove thumbnail, and hide synopsis behind spoiler tag
        onReply(`**${anime.title}** - ***Warning:*** __**This is a 18+ Hentai**__\n||${info.synopsis || '*No synopsis was found for this title*'}||`)
    }
}

/**
 * 
 * @param {Message} msg 
 * @returns {Array} List of all channels on the current server
 */
function getListOfTextChannels(msg) {
    let allChannels = msg.guild.channels
    let channelValues = Array.from(allChannels.keys()).map(channelId => { return allChannels.get(channelId) })
    let textChannels = channelValues.filter(channel => { return channel.type == "text" })
    return textChannels.map(channel => { return channel.name })
}

/**
 * 
 * @param {Message} msg 
 * @param {string} id Id of channel
 * @returns {string} Name of channel if exists
 */
function getNameOfChannelById(msg, id) {
    let allChannels = msg.guild.channels
    let channel = allChannels.get(id)
    if (channel && channel.type == 'text') {
        return channel.name
    }
    return null
}

/**
 * 
 */
function listChannels(listOfTextChannels, serverPreferences, onReply) {
    let channelList = 'Synopsis response channel list:\n'
    let activeChannelList = serverPreferences.allowedChannels
    listOfTextChannels.forEach(channel => {
        let isEnabled = activeChannelList.includes(channel)
        channelList += `*${channel}* → ${isEnabled ? '**Enabled**' : 'Disabled'}\n`
    })
    onReply(channelList)
    return true
}

/**
 * 
 */
function addChannel(isAdmin, listOfTextChannels, addChannelMatcher, serverPreferences, serverId, onSavePreferences, onReply) {
    if (isAdmin) {
        let channelName = addChannelMatcher[1]

        if (listOfTextChannels.includes(channelName)) {
            if (!serverPreferences.allowedChannels.includes(channelName)) {
                serverPreferences.allowedChannels.push(channelName)
                onSavePreferences(serverId, serverPreferences)
                onReply(`I will now respond to anime titles in "${channelName}" with their synopses`)
                return true
            } else {
                onReply("That channel already had synopsis responses enabled")
                return true
            }
        } else {
            onReply(`I could not find "${channelName}" in the list of your text channels. Please try again.`)
            return false
        }
    } else {
        onReply("You must be an admin to perform that action")
        return false
    }
}

/**
 * 
 */
function removeChannel(isAdmin, listOfTextChannels, removeChannelMatcher, serverPreferences, serverId, onSavePreferences, onReply) {
    if (isAdmin) {
        let channelName = removeChannelMatcher[1]

        if (listOfTextChannels.includes(channelName)) {
            if (serverPreferences.allowedChannels.includes(channelName)) {

                serverPreferences.allowedChannels = serverPreferences.allowedChannels.filter(channel => channelName != channel)
                onSavePreferences(serverId, serverPreferences)
                onReply(`You have successfully removed "${channelName}" from my active channel list`)
                return true
            } else {
                onReply('Synopsis responses for that channel were already disabled')
                return true
            }
        } else {
            onReply(`I could not find "${channelName}" in the list of your text channels. Please try again.`)
            return false
        }


    } else {
        onReply("You must be an admin to perform that action")
        return false
    }
}

/**
 * 
 */
function printHelp(onReply) {
    onReply(
        `***Command list:***
**Usable by anyone:**
Find closest match title for my previous message: \`s!match\`
View synopsis response channel list: \`s!list\`
View information about this bot: \`s!about\`
Print this help dialog: \`s!help\`

**Server admins only:**
Enable synopsis responses in this channel: \`s!enable\`
Disable synopsis responses in this channel: \`s!disable\`
Enable synopsis responses in a specific channel: \`s!enable CHANNEL-NAME-HERE\`
Disable synopsis responses in a specific channel: \`s!disable CHANNEL-NAME-HERE\``
    )
}

/**
 * 
 */
function printAbout(onReply) {
    onReply(
        `***About Synopsis-fy:***
For all channels with synopsis reponses enabled this bot will respond to any anime title that is: *Italicized*, **Bolden**, __Underlined__, ~~Struckthrough~~, \`Code blocked\`, or "Quoted" with a synopsis of that anime from MyAnimeList.net

*Please note that hentai titles will only be matched in NSFW channels. Also, to reduce spam, this bot will only match a particular title once per channel per 48 hours.*

Created with ❤️ for the *UW-Stout An-Bu Club* by Austin Scott
Add this bot to your own server: <https://discordapp.com/oauth2/authorize?&client_id=657318125989003323&scope=bot&permissions=8>
Source code: <https://github.com/Austin-Scott/synopsis-fy>
`
    )
    return true
}

/**
 * 
 */
function parseConfigurationCommands(isAdmin, messageContent, previousMessageContent, currentChannelName, listOfTextChannels, serverPreferences, serverId, onSavePreferences, onReply) {

    if (messageContent.startsWith('s!')) {

        if(messageContent.match(/s!(enable|disable)/)) {
            messageContent += ' ' + currentChannelName
        }

        let listChannelMatcher = messageContent.match(/s!list/)
        let addChannelMatcher = messageContent.match(/s!enable (\S+)/)
        let removeChannelMatcher = messageContent.match(/s!disable (\S+)/)
        let aboutMatcher = messageContent.match(/s!about/)
        let helpMatcher = messageContent.match(/s!help/)

        if (listChannelMatcher) {
            return listChannels(listOfTextChannels, serverPreferences, onReply)
        } else if (aboutMatcher) {
            return printAbout(onReply)
        } else if (addChannelMatcher) {
            return addChannel(isAdmin, listOfTextChannels, addChannelMatcher, serverPreferences, serverId, onSavePreferences, onReply)
        } else if (removeChannelMatcher) {
            return removeChannel(isAdmin, listOfTextChannels, removeChannelMatcher, serverPreferences, serverId, onSavePreferences, onReply)
        } else {
            printHelp(onReply)
            if(helpMatcher) {
                return true
            }
            return false
        }
    }
}

/**
 * 
 */
function parseAnimeTitles(messageContent, channelName, serverPreferences, onReply) {
    if (serverPreferences.allowedChannels.includes(channelName)) {


        // Regex that matches: italics, bold, striked, or quoted text
        let regex = /(\*{1,2}|\~{2}|\"|_|'|`)(.+?)\1/

        // Array of possible titles in the original message
        let titles = []

        // Extract possible titles from the message
        let matches = messageContent.match(regex)
        while (matches != null && matches.length >= 3) {
            titles.push(matches[2].trim())
            messageContent = messageContent.replace(matches[0], '')
            matches = text.match(regex)
        }

        // For each possible title
        titles.forEach(title => {
            // Try to match the title
            let anime = fuzzyMatch(title, serverPreferences)

            // If the match was successful
            if (anime != null) {
                // Request information from MyAnimeList
                mal.findAnime(anime.malId)
                    .then(info => {
                        // Post synopsis about this title
                        postDesc(anime, info, onReply)
                    })
                    .catch(err => console.log(err))
            }
        })

    }
}

/**
 * Executed whenever a message is posted to any channel on any server
 */
client.on('message', msg => {
    const serverId = msg.guild.id
    const serverPreferences = getServerPreferences(serverId)

    if (!msg.author.bot) {
        const messageContent = msg.content
        const previousMessageContent = ''
        const channelName = msg.channel.name
        const isAdmin = msg.member.hasPermission('ADMINISTRATOR')
        const listOfTextChannels = getListOfTextChannels(msg)

        // Replace channel IDs by their names in commands
        let channelIdMatcher = messageContent.match(/s!\w+ <#(\d+)>/)
        if (channelIdMatcher) {
            let otherChannelName = getNameOfChannelById(msg, channelIdMatcher[1])
            if (otherChannelName) {
                messageContent = messageContent.replace(`<#${channelIdMatcher[1]}>`, otherChannelName)
            }
        }

        parseConfigurationCommands(isAdmin, messageContent, previousMessageContent, channelName, listOfTextChannels, serverPreferences, serverId, saveServerPreferences, (reply) => { msg.reply(reply) })
        parseAnimeTitles(messageContent, channelName, serverPreferences, (reply, attachment) => { msg.channel.send(reply, attachment) })
    }
})

// Authenticate this bot using its private key
client.login(JSON.parse(fs.readFileSync("token.json")).token)

// Export functions for testing
module.exports = {
    fuzzyMatch: fuzzyMatch,
    createNewServerPreferences: createNewServerPreferences,
    parseConfigurationCommands: parseConfigurationCommands,
    parseAnimeTitles: parseAnimeTitles
}