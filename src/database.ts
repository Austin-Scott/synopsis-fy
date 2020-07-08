import Database from 'nedb'
import { ChannelWhitelist, MalItem, Recommendation, Suggestion } from './interfaces'
import { getDetailsIfAvailable, getMalDetails } from './myAnimeList'
import { resolve } from 'path'
import { rejects } from 'assert'

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

function dbGetUsersRecommendations(userIds: Array<string>): Promise<Array<Recommendation>> {
    return new Promise((resolve, reject) => {
        db.Recommendation.find({ 'link.userId': { $in: userIds } }, (error: Error, documents: Array<Recommendation>) => {
            if(error) {
                reject(error)
            } else {
                resolve(documents)
            }
        })
    })
}

function dbGetMalItems(malIds: Array<number>): Promise<Array<MalItem>> {
    return new Promise((resolve, reject) => {
        db.MalItem.find({ 'malId': { $in: malIds } }, (error: Error, documents: Array<MalItem>) => {
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

export function deleteRecommendation(userId: string, malId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
        db.Recommendation.remove({ 'link.userId': userId, 'link.malId': malId }, (error, number) => {
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

export async function getSuggestions(userIds: Array<string>, type: 'anime' | 'manga' | 'novel' | null, strategy: 'default' | 'recent', genres: Array<string>): Promise<Array<Suggestion>> {
    const serverRecommendations = await dbGetUsersRecommendations(userIds)
    const malIds = serverRecommendations.map(recommendation => recommendation.link.malId)
    let malItems = await dbGetMalItems(malIds)

    if(type!=null) {
        malItems = malItems.filter(item => item.type == type)
    }
    if(genres.length>0) {
        malItems = malItems.filter(item => {
            let keepFlag = false
            for(const genre of genres) {
                if(item.genres.map(item => item.toLowerCase()).includes(genre)) {
                    keepFlag = true
                }
            }
            return keepFlag
        })
    }

    let result: Array<Suggestion> = []
    for(const malItem of malItems) {
        result.push(
            {
                malItem: malItem,
                recommendations: serverRecommendations.filter(recommendation => recommendation.link.malId == malItem.malId)
            }
        )
    }

    if(strategy == 'default') {
        result = result.sort((a, b) => {
            const numberOfAGenres = a.malItem.genres.reduce<number>((previous: number, current: string): number => {
                if(genres.map(genre => genre.toLowerCase()).includes(current)) return previous + 1
                return previous
            }, 0)
            const numberOfBGenres = b.malItem.genres.reduce<number>((previous: number, current: string): number => {
                if(genres.map(genre => genre.toLowerCase()).includes(current)) return previous + 1
                return previous
            }, 0)
            if(numberOfAGenres > numberOfBGenres) return -1
            if(numberOfAGenres < numberOfBGenres) return 1

            if(a.recommendations.length > b.recommendations.length) return -1
            if(a.recommendations.length < b.recommendations.length) return 1

            const numberOfAReviews = a.recommendations.filter(recommendation => recommendation.review.length > 0).length
            const numberOfBReviews = b.recommendations.filter(recommendation => recommendation.review.length > 0).length

            if(numberOfAReviews > numberOfBReviews) return -1
            if(numberOfAReviews < numberOfBReviews) return 1
            return 0
        })
    } else {
        result = result.sort((a, b) => {
            const numberOfAGenres = a.malItem.genres.reduce<number>((previous: number, current: string): number => {
                if(genres.map(genre => genre.toLowerCase()).includes(current)) return previous + 1
                return previous
            }, 0)
            const numberOfBGenres = b.malItem.genres.reduce<number>((previous: number, current: string): number => {
                if(genres.map(genre => genre.toLowerCase()).includes(current)) return previous + 1
                return previous
            }, 0)
            if(numberOfAGenres > numberOfBGenres) return -1
            if(numberOfAGenres < numberOfBGenres) return 1

            const timeOfLastAReview = a.recommendations.reduce<Date>((previous: Date, current: Recommendation): Date => {
                if(previous < current.date) return current.date
                return previous
            }, new Date(0))
            const timeOfLastBReview = b.recommendations.reduce<Date>((previous: Date, current: Recommendation): Date => {
                if(previous < current.date) return current.date
                return previous
            }, new Date(0))
            if(timeOfLastAReview > timeOfLastBReview) return -1
            if(timeOfLastAReview < timeOfLastBReview) return 1

            return 0
        })

    }

    return result
}

