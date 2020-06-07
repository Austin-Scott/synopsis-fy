import { StringResolvable, MessageEmbed, Message, User } from "discord.js"
import { start } from "repl"

export default abstract class InteractiveMessage<T> {
    private model: Array<T> = []
    private globalState: any = {}
    private currentPage = 0
    private isPageLocked = false
    private creatingUser: User | null = null
    private message: Message | null = null

    constructor(model: Array<T>, state: any = {}) {
        this.model = model
        this.globalState = state
    }

    getNavigateLeftSymbol() {
        return '◀️'
    }

    getNavigateRightSymbol() {
        return '▶️'
    }

    getGlobalState() {
        return this.globalState
    }

    async send(msg: Message) {
        this.creatingUser = msg.author
        const messageContent = this.renderPage(this.getCurrentSelection(), this.currentPage, this.isPageLocked, this.model.length)
        this.message = await msg.channel.send(messageContent[0], messageContent[1])

        await this.message.react(this.getNavigateLeftSymbol())
        const startingReactions = this.getStartingReactions()
        for(let i = 0; i<startingReactions.length;i++) {
            await this.message.react(startingReactions[i])
        }
        await this.message.react(this.getNavigateRightSymbol())

        const collector = this.message.createReactionCollector((reaction, user) => true)
        collector.on('collect', async (reaction, user) => {
            if(user.bot) return

            const identifier = reaction.emoji.name
            if((identifier == this.getNavigateLeftSymbol() || identifier == this.getNavigateRightSymbol()) && !this.isPageLocked) {
                await this.removeAllReactionsOfType(identifier, false)
                if(user.id == this.creatingUser?.id) {
                    // Handle navigation
                    const startingPage = this.currentPage
                    if(identifier == this.getNavigateLeftSymbol()) {
                        if(this.currentPage > 0) {
                            this.currentPage--
                        } else {
                            this.currentPage = this.model.length - 1
                        }
                    } else {
                        if(this.currentPage < this.model.length - 1) {
                            this.currentPage++
                        } else {
                            this.currentPage = 0
                        }
                    }
                    if(startingPage !== this.currentPage) {
                        // Re-render page
                        await this.onChangePage()
                        this.requestRerender()
                    }

                }
            } else {
                if(!(await this.onReaction(identifier, user))) {
                    await this.removeAllReactionsOfType(identifier, false)
                }
            }
        })

    }

    async lockCurrentPage() {
        if(!this.isPageLocked) {
            this.isPageLocked = true
            await this.onLockSelection()
            await this.removeAllReactionsOfType(this.getNavigateLeftSymbol(), true)
            await this.removeAllReactionsOfType(this.getNavigateRightSymbol(), true)
            this.requestRerender()
        }
    }

    async removeMessage() {
        await this.message?.delete()
        this.message = null
    }

    getCreatingUser(): User | null {
        return this.creatingUser
    }

    requestRerender() {
        const newPage = this.renderPage(this.model[this.currentPage], this.currentPage, this.isPageLocked, this.model.length)
        this.message?.edit(newPage[0], newPage[1])
    }

    async removeAllReactionsOfType(name: string, botInclusive: boolean = false) {
        const reactions = this.message?.reactions.cache.find(reaction => reaction.emoji.name == name)
        if(botInclusive) {
            await reactions?.remove()
        } else {
            const users = await reactions?.users.fetch()
            if(users !== undefined) {
                for(const user of users) {
                    if(!user[1].bot) {
                        const userID = user[1].id
                        await reactions?.users.remove(userID)
                    }
                }
            }
        }
        
    }

    async unreact(name: string) {
        const reactions = this.message?.reactions.cache.find(reaction => reaction.emoji.name == name)
        const users = await reactions?.users.fetch()
        if(users !== undefined) {
            for(const user of users) {
                if(user[1].bot) {
                    const userID = user[1].id
                    await reactions?.users.remove(userID)
                }
            }
        }
    }

    getCurrentSelection(): T {
        return this.model[this.currentPage]
    }

    abstract renderPage(data: T, currentPage: number, isPageLocked: boolean, totalPages: number): [StringResolvable, MessageEmbed | undefined]
    abstract getStartingReactions(): Array<string>
    abstract async onReaction(reaction: string, user: User): Promise<boolean>
    abstract async onChangePage(): Promise<void>
    abstract async onLockSelection(): Promise<void>
    
}