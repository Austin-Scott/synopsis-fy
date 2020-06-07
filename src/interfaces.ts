interface CommandHelp {
    command: string
    description: string
}

export interface CommandHelpSection {
    title: string
    commands: Array<CommandHelp>
}