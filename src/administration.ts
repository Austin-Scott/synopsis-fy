import { Message } from "discord.js"

export function enable(msg: Message, channel: string) {
    msg.reply(`Enable request. Channel: "${channel}"`)
}

export function disable(msg: Message, channel: string) {
    msg.reply(`Disable request. Channel: "${channel}"`)
}