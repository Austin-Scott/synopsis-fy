import InteractiveMessage from "./InteractiveMessage"
import { Command } from "./interfaces"
import { StringResolvable, MessageEmbed, User } from "discord.js"

export default class HelpMessage extends InteractiveMessage<Command> {
    renderPage(data: Command, currentPage: number, isPageLocked: boolean, totalPages: number): [StringResolvable, MessageEmbed | undefined] {
        return [`Page ${currentPage + 1} of ${totalPages}. Command: "${data.command}"`, undefined]
    }
    getStartingReactions(): String[] {
        return []
    }
    async onReaction(reaction: string, user: User): Promise<boolean> {
        return true
    }
    async onChangePage(): Promise<void> {
        
    }
    async onLockSelection(): Promise<void> {
        
    }

}