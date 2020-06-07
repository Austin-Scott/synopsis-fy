import InteractiveMessage from "./InteractiveMessage"
import { CommandHelpSection } from "./interfaces"
import { StringResolvable, MessageEmbed, User } from "discord.js"

export default class HelpMessage extends InteractiveMessage<CommandHelpSection> {
    renderPage(data: CommandHelpSection, currentPage: number, isPageLocked: boolean, totalPages: number): [StringResolvable, MessageEmbed | undefined] {
        const embed = new MessageEmbed()
            .setColor('#e08155')
            .setTitle(data.title)
            .addFields(data.commands.map(command => { return { name: command.command, value: command.description }}))
            .setFooter(`Page ${currentPage + 1} of ${totalPages}`)
        return ['', embed]
    }
    getStartingReactions(): string[] {
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