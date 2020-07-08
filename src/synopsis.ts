import { Message } from "discord.js"
import { SearchResult, MalAnimeSearchModel, MalAnimeDataModel } from "./interfaces"
import SynopsisMessage from "./SynopsisMessage"
import { searchMal } from "./myAnimeList"

export default async function synopsis(msg: Message, type: 'anime' | 'manga' | 'novel', title: string, review: string) {
    const searchMessage = await msg.reply(`searching *MyAnimeList.net* for "${title}"...`)
    const searchResults = await searchMal(type, title)

    const discordIdToNickname = (discordId: string) => {
        const guild = msg.guild
        const user = msg.client.users.cache.get(discordId)
        if(user != undefined) {
            const member = msg.guild?.member(user)
            return member?.displayName || user.username
        } else {
            return 'Unknown'
        }
    }

    const synposisMessage = new SynopsisMessage(searchResults, { review: review, type: type, discordIdToNickname: discordIdToNickname })
    await searchMessage.delete()
    await synposisMessage.send(msg)
}