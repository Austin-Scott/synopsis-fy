import { Message } from "discord.js"
import Jikants from 'jikants'
import { Synopsis } from "./interfaces"
import SynopsisMessage from "./SynopsisMessage"
import { Search } from "jikants/dist/src/interfaces/search/Search"

export default async function synopsis(msg: Message, type: 'anime' | 'manga' | 'novel', title: string, review: string) {
    const searchResults = await Jikants.Search.search(title, type) as Search
    const results = searchResults.results.map<Synopsis>(result => {
        return {
            title: result.title,
            malId: result.mal_id,
            malURL: result.url,
            imageURL: result.image_url,
            synopsis: result.synopsis
        }
    })
    const synposisMessage = new SynopsisMessage(results)
    await synposisMessage.send(msg)
}