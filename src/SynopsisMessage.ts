import InteractiveMessage from "./InteractiveMessage"
import { SearchResult } from "./interfaces"
import { StringResolvable, MessageEmbed, User } from "discord.js"
import { addRecommendation } from "./database"

export default class SynopsisMessage extends InteractiveMessage<SearchResult> {
    isLocked = false
    renderPage(data: SearchResult | null, currentPage: number, isPageLocked: boolean, totalPages: number): [StringResolvable, MessageEmbed | undefined] {
        if(data == null) {
            const embed = new MessageEmbed()
                .setColor('#e08155')
                .setTitle('No results found')
                .setFooter('Result 0 of 0')
                .setDescription('Either no results on MyAnimeList were found, or MyAnimeList failed to respond to your search request.\nPlease try again later.')

            return ['', embed]
        }
        const details = data.getDetails(()=> {
            this.requestRerender()
        })
        if(details != null) {
            const embed = new MessageEmbed()
                .setColor('#e08155')
                .setTitle(details.englishTitle || details.title)
                .setDescription(details.synopsis)
                .setImage(details.picture)
                .setURL(data.malURL)
            
            if(this.getGlobalState().review != '') {
                embed.addField(this.getGlobalState().discordIdToNickname(this.getCreatingUser()?.id)+'\'s Review', '>>> '+this.getGlobalState().review)
                if(isPageLocked) {
                    embed.setFooter(`Use ${this.getStartingReactions()[0]} to join ${this.getCreatingUser()?.username} in recommending this`)
                } else {
                    embed.setFooter(`Use ${this.getStartingReactions()[0]} to recommend this with a review\nUse ${this.getStartingReactions()[1]} to cancel and remove this dialog\nResult ${currentPage + 1} of ${totalPages}`)
                }
            } else {
                embed.setFooter(`Use ${this.getStartingReactions()[0]} to recommend this\nUse ${this.getStartingReactions()[1]} to remove this dialog\nResult ${currentPage + 1} of ${totalPages}`)
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
                .setTitle(data.title)
                .setDescription('Downloading details from *MyAnimeList.net*...')
                .setImage(data.imageURL)
                .setURL(data.malURL)
                .setFooter(`Use ${this.getStartingReactions()[0]} to recommend this\nUse ${this.getStartingReactions()[1]} to remove this dialog\nResult ${currentPage + 1} of ${totalPages}`)
            return ['', embed]
        }
    }
    getStartingReactions(): string[] {
        if(this.getCurrentSelection() == null) {
            return []
        } else if(!this.isLocked) {
            return ['👍', '❌']
        } else {
            return ['👍']
        }
    }
    async onReaction(reaction: string, user: User): Promise<boolean> {
        const options = this.getStartingReactions()
        const currentSelection = this.getCurrentSelection()
        if(currentSelection == null) {
            return true
        }

        if(reaction == options[0]) {

            const details = currentSelection.getDetails(()=>{})
            if(details == null) return false

            // They recommend this anime
            if(user.id == this.getCreatingUser()?.id) {
            //This is the original creator

                await addRecommendation({
                    link: {
                        userId: user.id,
                        malId: details.id
                    },
                    date: new Date(),
                    review: this.getGlobalState().review
                }, details.url || currentSelection.malURL, this.getGlobalState().type)

                if(this.getGlobalState().review != '') {
                    await user.send(`You recommended **${details.englishTitle || currentSelection.title}** with a review. View all of your recommendations with \`s!mylist\`.`)
                    await this.removeAllReactionsOfType(this.getStartingReactions()[1], true)
                    await this.unreact(this.getStartingReactions()[0])
                    await this.lockCurrentPage()
                } else {

                    await user.send(`You recommended **${details.englishTitle || currentSelection.title}**. View all of your recommendations with \`s!mylist\`.`)
                }
            } else {
                await user.send(`You recommended **${details.englishTitle || currentSelection.title}**. View all of your recommendations with \`s!mylist\`.`)
            }
            return true
        } else if(!this.isLocked && reaction == options[1]) {
            if(user.id == this.getCreatingUser()?.id) {
                await this.removeMessage()
                return true
            } else {
                return false
            }
        }

        return true
    }
    async onChangePage(): Promise<void> {
        await this.removeAllReactionsOfType(this.getStartingReactions()[0], false)
    }
    async onLockSelection(): Promise<void> {
        this.isLocked = true
    }

}