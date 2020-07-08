import { Message } from "discord.js"
import { getSuggestions } from "./database"
import { SuggestionItem, MalAnimeDataModel } from "./interfaces"
import { getDetailsIfAvailable, getMalDetails } from "./myAnimeList"
import SuggestMessage from "./SuggestMessage"

const validGenres = [
    'action',
    'adventure',
    'cars',
    'comedy',
    'dementia',
    'demons',
    'mystery',
    'drama',
    'ecchi',
    'fantasy',
    'game',
    'hentai',
    'historical',
    'horror',
    'kids',
    'magic',
    'martial arts',
    'mecha',
    'music',
    'parody',
    'samurai',
    'romance',
    'school',
    'sci fi',
    'shoujo',
    'shoujo ai',
    'shounen',
    'shounen ai',
    'space',
    'sports',
    'super power',
    'vampire',
    'yaoi',
    'yuri',
    'harem',
    'slice of life',
    'supernatural',
    'military',
    'police',
    'psychological',
    'thriller',
    'seinen',
    'josei',
    'doujinshi',
    'gender bender'
]

export default async function suggest(msg: Message, query: string) {
    if(msg.guild == null) {
        msg.reply('That commannd only works on servers, not in DMs.')
        return
    }

    const lowerCaseQuery = query.toLowerCase()
    const genres = validGenres.filter(genre => lowerCaseQuery.search(genre) != -1)
    const type = (['anime', 'manga', 'novel'].find(value => lowerCaseQuery.search(value) != -1) || null) as 'anime' | 'manga' | 'novel' | null
    const strategy = lowerCaseQuery.search('recent') != -1 ? 'recent' : 'default'
    await msg.guild?.members.fetch()
    // TODO remove the asker's id from this array
    const serverMemberIDs = msg.guild?.members.cache.array().map(member => member.id) as Array<string>

    const suggestions = await getSuggestions(serverMemberIDs, type, strategy, genres)

    const suggestionItems = suggestions.map<SuggestionItem>(suggestion => {
        const getDetails = (callback: ()=>void): MalAnimeDataModel | null => {
            const cache = getDetailsIfAvailable(suggestion.malItem.malUrl)
            if(cache) {
                return cache
            }
            getMalDetails(suggestion.malItem.malUrl)
                .then(value => {
                    callback()
                })
            return null
        }
        return {
            ...suggestion,
            getDetails: getDetails
        }
    })

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

    const suggestMessage = new SuggestMessage(suggestionItems, {discordIdToNickname: discordIdToNickname})
    suggestMessage.send(msg)
}