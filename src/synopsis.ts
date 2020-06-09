import { Message } from "discord.js"
import { SearchResult, MalAnimeSearchModel, MalAnimeDataModel } from "./interfaces"
import SynopsisMessage from "./SynopsisMessage"
import { searchMal } from "./myAnimeList"

export default async function synopsis(msg: Message, type: 'anime' | 'manga' | 'novel', title: string, review: string) {
    const searchResults = await searchMal(type, title)
    const synposisMessage = new SynopsisMessage(searchResults, { review: review, type: type })
    await synposisMessage.send(msg)
}