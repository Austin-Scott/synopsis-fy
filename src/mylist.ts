import { Message } from "discord.js"
import { getAllRecommendations } from "./database"
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
    const message = new MylistMessage(recommendations)
    await message.send(msg)
}