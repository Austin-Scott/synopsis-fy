import InteractiveMessage from "./InteractiveMessage"
import { SearchResult } from "./interfaces"
import { StringResolvable, MessageEmbed, User } from "discord.js"

export default class SynopsisMessage extends InteractiveMessage<SearchResult> {
    renderPage(data: SearchResult, currentPage: number, isPageLocked: boolean, totalPages: number): [StringResolvable, MessageEmbed | undefined] {
        const details = data.getDetails(()=> {
            this.requestRerender()
        })
        if(details != null) {
            const embed = new MessageEmbed()
                .setColor('#e08155')
                .setTitle(details.title)
                .setDescription(details.synopsis)
                .setImage(details.picture)
                .setURL(data.malURL)
            
            if(this.getGlobalState().review != '') {
                embed.addField(`${this.getCreatingUser()?.username}'s review`, this.getGlobalState().review)
                if(isPageLocked) {
                    embed.setFooter(`Use ${this.getStartingReactions()[0]} to join ${this.getCreatingUser()?.username} in recommending this`)
                } else {
                    embed.setFooter(`Use ${this.getStartingReactions()[0]} to recommend this with a review\nUse ${this.getStartingReactions()[1]} to cancel and remove this dialog\nResult ${currentPage + 1} of ${totalPages}`)
                }
            } else {
                embed.setFooter(`Use ${this.getStartingReactions()[0]} to recommend this\nUse ${this.getStartingReactions()[1]} to remove this dialog\nResult ${currentPage + 1} of ${totalPages}`)
            }

            embed.addField('English title', details.englishTitle)
            embed.addField('Genres', details.genres.join(', '))

            return ['', embed]
        } else {
            const embed = new MessageEmbed()
                .setColor('#e08155')
                .setTitle(data.title)
                .setDescription('***Loading details...***')
                .setImage(data.imageURL)
                .setURL(data.malURL)
                .setFooter(`Use ${this.getStartingReactions()[0]} to recommend this\nUse ${this.getStartingReactions()[1]} to remove this dialog\nResult ${currentPage + 1} of ${totalPages}`)
            return ['', embed]
        }
    }
    getStartingReactions(): string[] {
        return ['👍', '❌']
    }
    async onReaction(reaction: string, user: User): Promise<boolean> {
        const options = this.getStartingReactions()
        if(reaction == options[0]) {
            // They recommend this anime
            if(user.id == this.getCreatingUser()?.id) {
                //This is the original creator
                if(this.getGlobalState().review != '') {
                    await user.send(`You recommended ${this.getCurrentSelection().title} with a review`)
                    await this.lockCurrentPage()
                    await this.removeAllReactionsOfType(this.getStartingReactions()[1], true)
                    await this.unreact(this.getStartingReactions()[0])
                } else {
                    await user.send(`You recommended ${this.getCurrentSelection().title}`)
                }
            } else {
                await user.send(`You recommended ${this.getCurrentSelection().title}`)
            }
            return true
        } else if(user.id == this.getCreatingUser()?.id && reaction == options[1]) {
            await this.removeMessage()
            return true
        }
        return true
    }
    async onChangePage(): Promise<void> {
        await this.removeAllReactionsOfType(this.getStartingReactions()[0], false)
    }
    async onLockSelection(): Promise<void> {
        
    }

}