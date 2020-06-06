import { Message } from "discord.js"

export default function synopsis(msg: Message, type: 'anime' | 'manga' | 'novel', title: string, review: string) {
    msg.reply(`Synopsis Request. Type: "${type}", Title: "${title}", Review: "${review}"`)
}