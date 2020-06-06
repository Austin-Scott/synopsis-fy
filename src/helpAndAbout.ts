import { Message } from "discord.js"

export function help(msg: Message) {
    msg.reply('Help request.')
}

export function about(msg: Message) {
    msg.reply('About request.')
}