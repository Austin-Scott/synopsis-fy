import { Message } from "discord.js"
import { SearchResult, MalAnimeSearchModel, MalAnimeDataModel } from "./interfaces"
import SynopsisMessage from "./SynopsisMessage"
import malScraper from 'mal-scraper'

const malCache: any = {}

function getDetailsIfAvailable(url: string): MalAnimeDataModel | null {
    return malCache[url] || null
}

async function getMalDetails(url: string): Promise<MalAnimeDataModel> {
    const result: MalAnimeDataModel = await malScraper.getInfoFromURL(url)
    malCache[url] = result
    return result
}

async function searchMal(type: 'anime' | 'manga' | 'novel', query: string): Promise<Array<SearchResult>> {
    try {
        let typeQuery = 0
        let mainType = type
        if(type=='novel') {
            typeQuery = 2
            mainType = 'manga'
        }
        let results: Array<MalAnimeSearchModel> = await malScraper.search.search(mainType, {
            term: query,
            type: typeQuery
        })
        if(type == 'manga') {
            results = results.filter(result => {
                return result.type != 'Novel'
            })
        }
        return results.map(result => {
            const getDetails = (callback: ()=>void): MalAnimeDataModel | null => {
                const cache = getDetailsIfAvailable(result.url)
                if(cache) {
                    return cache
                }
                getMalDetails(result.url)
                    .then(value => {
                        callback()
                    })
                return null
            }
            return {
                title: result.title,
                malURL: result.url,
                partialSynopsis: result.shortDescription,
                imageURL: result.thumbnail,
                id: result.id,
                getDetails: getDetails
            }
        })
    } catch (error) {
        console.log(error)
        return []
    }
}

export default async function synopsis(msg: Message, type: 'anime' | 'manga' | 'novel', title: string, review: string) {
    const searchResults = await searchMal(type, title)
    const synposisMessage = new SynopsisMessage(searchResults, { review: review })
    await synposisMessage.send(msg)
}