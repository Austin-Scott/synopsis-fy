import Discord, { PresenceData } from 'discord.js'
import fs from 'fs'
import synopsis from './synopsis'
import suggest from './suggest'
import { enable, disable } from './administration'
import { help, about } from './helpAndAbout'
import mylist from './mylist'
import { isChannelWhitelisted } from './database'
import isReachable from 'is-reachable'

const client = new Discord.Client()

let MALIsOnline: Boolean = false
let showingMALStatus: Boolean = true

async function checkMALStatus() {
    MALIsOnline = await isReachable('https://myanimelist.net/')
}

function toggleBotStatus() {
    if(showingMALStatus) {
        client.user?.setPresence({ activity: { name: '| s!help', type: 'WATCHING' }, status: 'online' })
    } else {
        client.user?.setPresence({ activity: { name: MALIsOnline ? '| MAL 🟢Online' : '| MAL 🔴Offline', type: 'WATCHING' }, status: 'online' })
    }
    showingMALStatus = !showingMALStatus
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`)
    checkMALStatus()
    toggleBotStatus()
    setInterval(checkMALStatus, 10 * 60 * 1000)
    setInterval(toggleBotStatus, 30 * 1000)
})

client.on('message', async msg => {
    try {
        if (!msg.author.bot) {
            // Tested at: https://regex101.com/r/0Z9Wcu/2
            const synopsisCommandMatcher = /^s!(anime|a|manga|m|novel|n) ("(.*?)" ?(.*)|(.*))$/
            // Tested at: https://regex101.com/r/YglfCW/1
            const suggestCommandMatcher = /^s!(suggest|s)( (.+))?$/
            const enableCommandMatcher = /^s!enable( (.+))?$/
            const disableCommandMatcher = /^s!disable( (.+))?$/
            const helpCommandMatcher = /^s!help$/
            const aboutCommandMatcher = /^s!about$/
            const mylistCommandMatcher = /^s!mylist$/

            const commandAllowed = msg.guild == null || await isChannelWhitelisted(msg.channel.id)
            const messageText = msg.content
            let match: RegExpMatchArray | null

            if ((match = messageText.match(synopsisCommandMatcher)) && commandAllowed) {

                let mediumType = match[1]
                if (mediumType == 'a') {
                    mediumType = 'anime'
                } else if (mediumType == 'm') {
                    mediumType = 'manga'
                } else if (mediumType == 'n') {
                    mediumType = 'novel'
                }

                let title = match[3] || match[2]
                let review = match[4] || ''

                await synopsis(msg, mediumType as ('anime' | 'manga' | 'novel'), title, review)

            } else if ((match = messageText.match(suggestCommandMatcher)) && commandAllowed) {

                let query = match[2] || ''

                await suggest(msg, query)

            } else if (match = messageText.match(enableCommandMatcher)) {

                let channel = match[1] || ''

                await enable(msg, channel)

            } else if (match = messageText.match(disableCommandMatcher)) {

                let channel = match[1] || ''

                await disable(msg, channel)

            } else if ((match = messageText.match(helpCommandMatcher)) && commandAllowed) {

                await help(msg)

            } else if ((match = messageText.match(aboutCommandMatcher)) && commandAllowed) {

                await about(msg)

            } else if ((match = messageText.match(mylistCommandMatcher)) && commandAllowed) {

                await mylist(msg)

            }
        }
    } catch (error) {
        console.log(error)
    }
})

client.login(JSON.parse(fs.readFileSync('token.json', { encoding: 'utf-8' })).token)