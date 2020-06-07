import InteractiveMessage from "./InteractiveMessage"
import { Synopsis } from "./interfaces"
import { StringResolvable, MessageEmbed, User } from "discord.js"

export default class SynopsisMessage extends InteractiveMessage<Synopsis> {
    renderPage(data: Synopsis, currentPage: number, isPageLocked: boolean, totalPages: number): [StringResolvable, MessageEmbed | undefined] {
        const embed = new MessageEmbed()
            .setColor('#e08155')
            .setTitle(data.title)
            .setDescription(data.synopsis)
            .setImage(data.imageURL)
            .setURL(data.malURL)
            .setFooter(`Page ${currentPage + 1} of ${totalPages}`)
        return ['', embed]
    }
    getStartingReactions(): String[] {
        return ['👍', '❌']
    }
    async onReaction(reaction: string, user: User): Promise<boolean> {
        return true
    }
    async onChangePage(): Promise<void> {
        
    }
    async onLockSelection(): Promise<void> {
        
    }

}