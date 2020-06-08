import { Message } from "discord.js"
import { addChannelWhitelist, removeChannelWhitelist } from "./database"

const channelIdMatcher = / <#(\d+)>/

export async function enable(msg: Message, channel: string) {
    if(!msg.member || !msg.member.hasPermission('ADMINISTRATOR')) {
        // This user does not have permission to use that command.
        msg.reply('You must be a server administrator to use that command.')
        return
    }

    if(channel == '') {
        try {
            await addChannelWhitelist(msg.channel.id)
            msg.reply('I will now respond to commands in this channel.')
        } catch (error) {
            console.log(error)
            if(error.message && error.message.includes('violates the unique constraint')) {
                msg.reply('I was already responding to commands in this channel.')
            }
        }
    } else {
        const matches = channel.match(channelIdMatcher)
        if(matches) {
            // If this message is from a guild and the channel referenced is within the same guild
            if(msg.guild && msg.guild.channels.cache.find(searchChannel => searchChannel.id == matches[1])) {
                try {
                    await addChannelWhitelist(matches[1])
                    msg.reply('I will now respond to commands in that channel.')
                } catch (error) {
                    console.log(error)
                    if(error.message && error.message.includes('violates the unique constraint')) {
                        msg.reply('I was already responding to commands in that channel.')
                    }
                }
                
            } else {
                msg.reply('I was not able to find that channel in the current server.')
            }
        } else {
            msg.reply('Invalid command syntax.')
        }
    }
}

export async function disable(msg: Message, channel: string) {
    if(!msg.member || !msg.member.hasPermission('ADMINISTRATOR')) {
        // This user does not have permission to use that command.
        msg.reply('You must be a server administrator to use that command.')
        return
    }

    if(channel == '') {
        try {
            const removed = await removeChannelWhitelist(msg.channel.id)
            if(removed) {
                msg.reply('I will now ignore all commands in this channel.')
            } else {
                msg.reply('I was already ignoring all commands in this channel.')
            }
        } catch (error) {
            console.log(error)
        }
    } else {
        const matches = channel.match(channelIdMatcher)
        if(matches) {
            // If this message is from a guild and the channel referenced is within the same guild
            if(msg.guild && msg.guild.channels.cache.find(searchChannel => searchChannel.id == matches[1])) {
                try {
                    const removed = await removeChannelWhitelist(matches[1])
                    if(removed) {
                        msg.reply('I will now ignore all commands in that channel.')
                    } else {
                        msg.reply('I was already ignoring all commands in that channel.')
                    }
                } catch (error) {
                    console.log(error)
                }
                
            } else {
                msg.reply('I was not able to find that channel in the current server.')
            }
        } else {
            msg.reply('Invalid command syntax.')
        }
    }
}