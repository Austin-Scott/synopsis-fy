import { Message } from "discord.js"
import { Command } from "./interfaces"
import HelpMessage from "./HelpMessage"

const commandList: Array<Command> = [
    {
        command: 's!anime',
        description: 'Search for an anime',
        examples: []
    },
    {
        command: 's!manga',
        description: 'Search for an manga',
        examples: []
    },
    {
        command: 's!novel',
        description: 'Search for an novel',
        examples: []
    }
]

export async function help(msg: Message) {
    const helpMessage = new HelpMessage(commandList)
    await helpMessage.send(msg)
}

export async function about(msg: Message) {
    msg.reply('About request.')
}