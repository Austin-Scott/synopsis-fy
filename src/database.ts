import Database from 'nedb'
import { ChannelWhitelist, MalItem, Recommendation } from './interfaces'
import { getDetailsIfAvailable, getMalDetails } from './myAnimeList'

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

db.MalItem.ensureIndex({
    fieldName: 'malId',
    unique: true
})

db.Recommendation.ensureIndex({
    fieldName: 'link',
    unique: true
})

db.Recommendation.ensureIndex({
    fieldName: 'link.userId'
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

function getMalItem(malId: number): Promise<MalItem | null> {
    return new Promise((resolve, reject) => {
        db.MalItem.findOne({ malId: malId }, (error, document) => {
            if(error) {
                reject(error)
            } else {
                resolve(document)
            }
        })
    })
}

function addMalItem(malItem: MalItem): Promise<MalItem> {
    return new Promise((resolve, reject) => {
        db.MalItem.insert(malItem, (error, newDoc) => {
            if(error) {
                reject(error)
            } else {
                resolve(newDoc)
            }
        })
    })
}

function dbAddRecommendation(recommendation: Recommendation): Promise<Recommendation> {
    return new Promise((resolve, reject) => {
        db.Recommendation.insert(recommendation, (error, newDoc) => {
            if(error) {
                reject(error)
            } else {
                resolve(error)
            }
        })
    })
}

function dbGetAllRecommendations(userId: string): Promise<Array<Recommendation>> {
    return new Promise((resolve, reject) => {
        db.Recommendation.find({ 'link.userId': userId }, (error: Error, documents: Array<Recommendation>) => {
            if(error) {
                reject(error)
            } else {
                resolve(documents)
            }
        })
    })
}

function getRecommendation(userId: string, malId: number): Promise<Recommendation | null> {
    return new Promise((resolve, reject) => {
        db.Recommendation.findOne({ 'link.userId': userId, 'link.malId': malId }, (error, document) => {
            if(error) {
                reject(error)
            } else {
                resolve(document)
            }
        })
    })
}

function modifyRecommendation(userId: string, malId: number, newRecommendation: Recommendation): Promise<boolean> {
    return new Promise((resolve, reject) => {
        db.Recommendation.update({ 'link.userId': userId, 'link.malId': malId }, { date: newRecommendation.date, review: newRecommendation.review }, {}, (error, number) => {
            if(error) {
                reject(error)
            } else {
                resolve(number == 1)
            }
        })
    })
}

export async function addRecommendation(recommendation: Recommendation, malURL: string, type: 'anime' | 'manga' | 'novel'): Promise<Recommendation> {
    const malItem = await getMalItem(recommendation.link.malId)
    if(malItem == null) {
        let malDetails = getDetailsIfAvailable(malURL)
        if(malDetails == null) {
            malDetails = await getMalDetails(malURL)
        }
        await addMalItem({
            malId: malDetails.id,
            type: type,
            malUrl: malURL,
            rating: malDetails.rating,
            genres: malDetails.genres
        })
    }
    try {
        return await dbAddRecommendation(recommendation)
    } catch (error) {
        // If this user has already recommended this item
        if(error.errorType && error.errorType == 'uniqueViolated') {
            const oldRecommendation = await getRecommendation(recommendation.link.userId, recommendation.link.malId) as Recommendation
            let replace = false
            if(oldRecommendation.review == '' && recommendation.review != '') {
                replace = true
            }
            if(oldRecommendation.review != '' && recommendation.review != '') {
                replace = true
            }
            if(replace) {
                await modifyRecommendation(recommendation.link.userId, recommendation.link.malId, recommendation)
                return recommendation
            } else {
                return oldRecommendation
            }
        }
        throw error
    }
}

export async function getAllRecommendations(userId: string): Promise<Array<Recommendation & MalItem>> {
    let recommendations = await dbGetAllRecommendations(userId)
    for(let i=0; i<recommendations.length;i++) {
        recommendations[i] = {...recommendations[i], ...await getMalItem(recommendations[i].link.malId)}
    }
    return recommendations as Array<Recommendation & MalItem>
}



