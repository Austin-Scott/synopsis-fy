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
                .setTitle('Your Recommendations')
                .setImage(details.picture)
            
            if(data.review != '') {
                embed.setDescription(data.review)
            }

            embed.setFooter(`Use ${this.getStartingReactions()[0]} to delete recommendation\nUse ${this.getStartingReactions()[1]} to remove this dialog\nRecommendation ${currentPage + 1} of ${totalPages}`)

            if(details.englishTitle) {
                embed.addField('English title', details.englishTitle)
            }

            embed.addField('Japanese Title', details.title)

            embed.addField('Recommendation Date', `${data.date.getUTCFullYear()}-${data.date.getUTCMonth()+1}-${data.date.getUTCDate()}`)

            if(data.type == 'anime') {
                embed.addField('Type', 'Anime')
            } else if(data.type == 'manga') {
                embed.addField('Type', 'Manga')
            } else {
                embed.addField('Type', 'Light Novel')
            }

            return ['', embed]
        } else {
            const embed = new MessageEmbed()
                .setColor('#e08155')
                .setTitle('Your Recommendations')
                .setDescription('***Loading details...***')
                .setFooter(`Use ${this.getStartingReactions()[0]} to delete recommendation\nUse ${this.getStartingReactions()[1]} to remove this dialog\nRecommendation ${currentPage + 1} of ${totalPages}`)

            return ['', embed]
        }
    }
    getStartingReactions(): string[] {
        if(this.getCurrentSelection() != null)
            return ['🗑️', '❌']
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