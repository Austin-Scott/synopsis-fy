import { Message } from "discord.js"
import { getAllRecommendations, deleteRecommendation as dbDeleteRecommendation } from "./database"
import { Recommendation, MalItem, SearchResult } from "./interfaces"
import { getDetailsIfAvailable, getMalDetails } from "./myAnimeList"
import MylistMessage from "./MylistMessage"

export default async function mylist(msg: Message) {
    let recommendations: Array<Recommendation & MalItem & SearchResult> = (await getAllRecommendations(msg.author.id)).map(recommendation => {
        const getDetails = (callback: ()=>void) => {
            const details = getDetailsIfAvailable(recommendation.malUrl)
            if(details == null) {
                getMalDetails(recommendation.malUrl)
                    .then(()=>{
                        callback()
                    })
            }
            return details
        }
        const searchResult: SearchResult = {
            id: recommendation.malId,
            title: '',
            malURL: recommendation.malUrl,
            imageURL: '',
            partialSynopsis: '',
            getDetails: getDetails
        }
        return {...recommendation, ...searchResult}
    })
    const deleteRecommendation = (title: string, userID: string, malID: number) => {
        dbDeleteRecommendation(userID, malID)
            .then(value => {
                if(value) {
                    msg.author.send(`Your recommendation for ${title} has successfully been deleted.`)
                } else {
                    msg.author.send(`I was unable to delete your recommendation for ${title}. It is likely that is has already been deleted.`)
                }
            })
            .catch(error => {
                msg.author.send(`Something went wrong with deleting ${title}. Please try again later.`)
            })
    }
    const message = new MylistMessage(recommendations, {deleteRecommendation: deleteRecommendation})
    await message.send(msg)
}