import { Message } from "discord.js"

export default async function suggest(msg: Message, query: string) {
    msg.reply(`Suggest request. Query string: "${query}"`)
}