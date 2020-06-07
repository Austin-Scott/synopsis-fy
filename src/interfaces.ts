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
}