import malScraper from 'mal-scraper'
import { MalAnimeDataModel, SearchResult, MalAnimeSearchModel } from './interfaces'

const malDetailsCache: any = {}

export function getDetailsIfAvailable(url: string): MalAnimeDataModel | null {
    return malDetailsCache[url] || null
}

export async function getMalDetails(url: string): Promise<MalAnimeDataModel> {
    const result: MalAnimeDataModel = await malScraper.getInfoFromURL(url)
    malDetailsCache[url] = result
    return result
}

export async function searchMal(type: 'anime' | 'manga' | 'novel', query: string): Promise<Array<SearchResult>> {
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