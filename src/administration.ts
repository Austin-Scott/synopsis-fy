import { Message } from "discord.js"

export async function enable(msg: Message, channel: string) {
    msg.reply(`Enable request. Channel: "${channel}"`)
}

export async function disable(msg: Message, channel: string) {
    msg.reply(`Disable request. Channel: "${channel}"`)
}