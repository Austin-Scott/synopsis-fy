import Discord from 'discord.js'
import fs from 'fs'

const client = new Discord.Client()

client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`)
})

client.on('message', msg => {
    if(msg.content == 'ping') {
        msg.reply('Pong!')
    }
})

client.login(JSON.parse(fs.readFileSync('token.json', { encoding: 'utf-8' })).token)