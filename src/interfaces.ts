interface CommandHelp {
    command: string
    description: string
}

export interface CommandHelpSection {
    title: string
    commands: Array<CommandHelp>
}

export interface SearchResult {
    id: number
    title: string
    malURL: string
    imageURL: string
    partialSynopsis: string
    getDetails: (arg0: ()=>void) => MalAnimeDataModel | null
}

export interface MalAnimeSearchModel {
    thumbnail: string
    url: string
    shortDescription: string
    title: string
    id: number
    type: string
}

export interface MalAnimeDataModel {
    title: string
    synopsis: string
    picture: string
    englishTitle: string
    genres: Array<string>
    id: number
    url: string
    rating: string
}

export interface ChannelWhitelist {
    channelId: string
}

export interface MalItem {
    malId: number
    type: 'anime' | 'manga' | 'novel'
    malUrl: string
    rating: string
    genres: Array<string>
}

export interface Recommendation {
    link: {
        userId: string
        malId: number
    }
    date: Date
    review: string
}

export interface Suggestion {
    malItem: MalItem
    recommendations: Array<Recommendation>
}

export interface SuggestionItem extends Suggestion {
    getDetails: (arg0: ()=>void) => MalAnimeDataModel | null
}