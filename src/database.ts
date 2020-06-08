import Database from 'nedb'
import { ChannelWhitelist } from './interfaces'

const db = {
    ChannelWhitelist: new Database({
        filename: './db/ChannelWhitelist.db',
        autoload: true
    }), 
    MalItem: new Database({
        filename: './db/MalItem.db',
        autoload: true
    }),
    Recommendation: new Database({
        filename: './db/Recommendation.db',
        autoload: true
    })
}

db.ChannelWhitelist.ensureIndex({
    fieldName: 'channelId',
    unique: true
})

export function addChannelWhitelist(channelId: string): Promise<ChannelWhitelist> {
    return new Promise((resolve, reject) => {
        const channelWhitelist: ChannelWhitelist = {
            channelId: channelId
        }
        db.ChannelWhitelist.insert(channelWhitelist, (error, newDoc) => {
            if(error) {
                reject(error)
            } else {
                resolve(newDoc)
            }
        })
    })
}

export function removeChannelWhitelist(channelId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        db.ChannelWhitelist.remove({ channelId: channelId }, (error, number) => {
            if(error) {
                reject(error)
            } else {
                resolve(number == 1)
            }
        })
    })
}

export function isChannelWhitelisted(channelId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        db.ChannelWhitelist.findOne({ channelId: channelId }, (error, doc) => {
            if(error) {
                reject(error)
            } else {
                if(doc) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            }
        })
    })
}