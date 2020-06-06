import Discord, { PresenceData } from 'discord.js'
import fs from 'fs'
import synopsis from './synopsis'
import suggest from './suggest'
import { enable, disable } from './administration'
import { help, about } from './helpAndAbout'
import mylist from './mylist'

const client = new Discord.Client()

client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`)
    client.user?.setPresence({ activity: { name: '| s!help', type: 'WATCHING' }, status: 'online' })
})

client.on('message', msg => {
    if(!msg.author.bot) {
        // Tested at: https://regex101.com/r/0Z9Wcu/2
        const synopsisCommandMatcher = /^s!(anime|a|manga|m|novel|n) ("(.*)" ?(.*)|(.*))$/
        // Tested at: https://regex101.com/r/YglfCW/1
        const suggestCommandMatcher = /^s!(suggest|s)( (.+))?$/
        const enableCommandMatcher = /^s!enable( (.+))?$/
        const disableCommandMatcher = /^s!disable( (.+))?$/
        const helpCommandMatcher = /^s!help$/
        const aboutCommandMatcher = /^s!about$/
        const mylistCommandMatcher = /^s!mylist$/

        const messageText = msg.content
        let match: RegExpMatchArray | null

        if(match = messageText.match(synopsisCommandMatcher)) {

            let mediumType = match[1]
            if(mediumType == 'a') {
                mediumType = 'anime'
            } else if(mediumType == 'm') {
                mediumType = 'manga'
            } else if(mediumType == 'n') {
                mediumType = 'novel'
            }

            let title = match[3] || match[2]
            let review = match[4] || ''

            synopsis(msg, mediumType as ('anime' | 'manga' | 'novel'), title, review)

        } else if(match = messageText.match(suggestCommandMatcher)) {

            let query = match[2] || ''

            suggest(msg, query)

        } else if(match = messageText.match(enableCommandMatcher)) {

            let channel = match[1] || ''

            enable(msg, channel)

        } else if(match = messageText.match(disableCommandMatcher)) {

            let channel = match[1] || ''

            disable(msg, channel)

        } else if(match = messageText.match(helpCommandMatcher)) {

            help(msg)

        } else if(match = messageText.match(aboutCommandMatcher)) {

            about(msg)

        } else if(match = messageText.match(mylistCommandMatcher)) {

            mylist(msg)

        }
    }
})

client.login(JSON.parse(fs.readFileSync('token.json', { encoding: 'utf-8' })).token)