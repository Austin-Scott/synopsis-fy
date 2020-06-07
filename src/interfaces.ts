interface CommandHelp {
    command: string
    description: string
}

export interface CommandHelpSection {
    title: string
    commands: Array<CommandHelp>
}

export interface Synopsis {
    title: string
    malURL: string
    malId: number
    imageURL: string
    synopsis: string
}