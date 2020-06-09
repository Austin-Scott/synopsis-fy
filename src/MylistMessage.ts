import InteractiveMessage from "./InteractiveMessage"
import { Recommendation, MalItem, MalAnimeSearchModel, SearchResult } from "./interfaces"
import { StringResolvable, MessageEmbed, User } from "discord.js"

export default class MylistMessage extends InteractiveMessage<Recommendation & MalItem & SearchResult> {
    renderPage(data: Recommendation & MalItem & SearchResult, currentPage: number, isPageLocked: boolean, totalPages: number): [StringResolvable, MessageEmbed | undefined] {
        if(data == null) {
            const embed = new MessageEmbed()
                .setColor('#e08155')
                .setTitle('No Recommendations')
                .setFooter('Result 0 of 0')
                .setDescription('You have not made any recommendations.')

            return ['', embed]
        }
        const details = data.getDetails(()=> {
            this.requestRerender()
        })
        if(details != null) {
            const embed = new MessageEmbed()
                .setColor('#e08155')
                .setTitle(details.title)
                .setDescription(details.synopsis)
                .setImage(details.picture)
                .setURL(details.url)
            
            if(data.review != '') {
                embed.addField(`${this.getCreatingUser()?.username}'s review`, data.review)
            }

            embed.setFooter(`Use ${this.getStartingReactions()[0]} to remove this\nUse ${this.getStartingReactions()[1]} to refresh the list\nRecommendation ${currentPage + 1} of ${totalPages}`)

            if(details.englishTitle) {
                embed.addField('English title', details.englishTitle)
            }
            if(details.genres.length > 0) {
                embed.addField('Genres', details.genres.join(', '))
            }

            return ['', embed]
        } else {
            const embed = new MessageEmbed()
                .setColor('#e08155')
                .setTitle('Title loading...')
                .setDescription('***Loading details...***')
                .setFooter(`Use ${this.getStartingReactions()[0]} to remove this\nUse ${this.getStartingReactions()[1]} to refresh the list\nRecommendation ${currentPage + 1} of ${totalPages}`)
            return ['', embed]
        }
    }
    getStartingReactions(): string[] {
        if(this.getCurrentSelection() != null)
            return ['🗑️', '🔄']
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