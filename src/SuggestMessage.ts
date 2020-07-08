import InteractiveMessage from "./InteractiveMessage"
import { SuggestionItem } from "./interfaces"
import { StringResolvable, MessageEmbed, User } from "discord.js"
import { addRecommendation } from "./database"

export default class SuggestMessage extends InteractiveMessage<SuggestionItem> {
    renderPage(data: SuggestionItem | null, currentPage: number, isPageLocked: boolean, totalPages: number): [StringResolvable, MessageEmbed | undefined] {
        if(data == null) {
            const embed = new MessageEmbed()
                .setColor('#e08155')
                .setTitle('No suggestions found')
                .setFooter('Result 0 of 0')
                .setDescription('No matching suggestions found on this server')

            return ['', embed]
        }
        const details = data.getDetails(()=> {
            this.requestRerender()
        })
        if(details != null) {
            const embed = new MessageEmbed()
                .setColor('#e08155')
                .setTitle(details.englishTitle || details.title)
                .setURL(data.malItem.malUrl)
                .setDescription(details.synopsis)
                .setImage(details.picture)
            
            embed.setFooter(`Use ${this.getStartingReactions()[0]} to remove this dialog\nSuggestion ${currentPage + 1} of ${totalPages}`)

            const discordIdToNickname = this.getGlobalState().discordIdToNickname
            embed.addField('Recommended by', data.recommendations.map(recommendation => discordIdToNickname(recommendation.link.userId)).join(', '))

            const reviews = data.recommendations.filter(recommendation => recommendation.review != '')
            if(reviews.length > 0) {
                const review = reviews[Math.floor(Math.random() * reviews.length)]
                embed.addField(discordIdToNickname(review.link.userId)+'\'s Review', '>>> '+review.review)
            }

            if(details.englishTitle) {
                embed.addField('Japanese title', details.title)
            }
            if(details.genres.length > 0) {
                embed.addField('Genres', details.genres.join(', '))
            }

            return ['', embed]
        } else {
            const embed = new MessageEmbed()
                .setColor('#e08155')
                .setTitle('Loading...')
                .setDescription('Downloading details from *MyAnimeList.net*...')
                .setURL(data.malItem.malUrl)
                .setFooter(`Use ${this.getStartingReactions()[0]} to remove this dialog\nSuggestion ${currentPage + 1} of ${totalPages}`)
            return ['', embed]
        }
    }
    getStartingReactions(): string[] {
        if(this.getCurrentSelection() == null) {
            return []
        }
        return ['❌']
    }
    async onReaction(reaction: string, user: User): Promise<boolean> {
        const options = this.getStartingReactions()
        const currentSelection = this.getCurrentSelection()
        if(currentSelection == null) {
            return true
        }

        if(reaction == options[0]) {
            await this.removeMessage()
            return true
        }
        return true
    }
    async onChangePage(): Promise<void> {

    }
    async onLockSelection(): Promise<void> {
        
    }

}