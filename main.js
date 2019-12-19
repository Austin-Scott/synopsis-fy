const Discord = require('discord.js')
const client = new Discord.Client()
const fs = require("fs")

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', msg => {
  if (msg.content === 'ping' && msg.channel.name == "anime-suggestions") {
    msg.reply('Pong!')
  }
})

client.login(JSON.parse(fs.readFileSync("token.json")).token)