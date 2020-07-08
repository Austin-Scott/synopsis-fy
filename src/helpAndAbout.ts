import { Message } from "discord.js"
import { CommandHelpSection } from "./interfaces"
import HelpMessage from "./HelpMessage"

const commandList: Array<CommandHelpSection> = [
    {
        title: 'Get a synopsis for an anime, manga, or light novel!',
        commands: [
            {
                command: '`s!anime Attack on Titan`',
                description: 'Get a synopsis for the anime Attack on Titan'
            },
            {
                command: '`s!manga One Piece`',
                description: 'Get a synopsis for the manga One Piece'
            },
            {
                command: '`s!novel Spice and Wolf`',
                description: 'Get a synopsis for the light novel Spice and Wolf'
            }
        ]
    },
    {
        title: 'Write a review for an anime, manga, or light novel!',
        commands: [
            {
                command: '`s!anime "Attack on Titan" Review goes here.`',
                description: 'Write a review for the anime Attack on Titan'
            },
            {
                command: '`s!manga "One Piece" Review goes here.`',
                description: 'Write a review for the manga One Piece'
            },
            {
                command: '`s!novel "Spice and Wolf" Review goes here.`',
                description: 'Write a review for the light novel Spice and Wolf'
            }
        ]
    },
    {
        title: 'View recommendations',
        commands: [
            {
                command: '`s!suggest`',
                description: 'View recommendations from others on your current server.'
            },
            {
                command: '`s!suggest action and adventure anime`',
                description: 'View action and adventure anime recommendations.'
            },
            {
                command: '`s!mylist`',
                description: 'View and manage a list of all of your recommendations.'
            }
        ]
    },
    {
        title: 'Misc. and administration',
        commands: [
            {
                command: '`s!help`',
                description: 'View this help dialog.'
            },
            {
                command: '`s!about`',
                description: 'View information about this bot.'
            },
            {
                command: '`s!enable`',
                description: 'Enable this bot in the current channel. You must be an admin for this to work.'
            },
            {
                command: '`s!disable`',
                description: 'Disable this bot in the current channel. You must be an admin for this to work.'
            }
        ]
    },
]

export async function help(msg: Message) {
    const helpMessage = new HelpMessage(commandList)
    await helpMessage.send(msg)
}

export async function about(msg: Message) {
    msg.reply(`***About Synopsis-fy:***

Powered by *MyAnimeList.net*: <https://MyAnimeList.net>
Add this bot to your own server: <https://discordapp.com/oauth2/authorize?&client_id=657318125989003323&scope=bot&permissions=8>
View the source code: <https://github.com/Austin-Scott/synopsis-fy>

Version: 2.0
Created with ❤️ for the *UW-Stout An-Bu Club* by Austin Scott
`)
}