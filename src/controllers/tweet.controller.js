
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";

const addTweet=asyncHandler(async(req,res)=>{
    const {content}=req.body
    const {videoId}=req.params
    if(!content){
        throw new ApiError(401,"content is not present ");
    }
    // if(!isValidObjectId(videoId)){
    //     throw new ApiError(401,"Invalid video id ");
    // }
    const video=await Video.findById(videoId)
    // if(!video){
    //     throw new ApiError(401,"Invalid video or video is not present ");
    // }
    const tweet=await Tweet.create({
        content:content,
        owner:req.user?._id
    })
    if(!tweet){
        throw new Error(500,"Failde to add a tweet");
    }
    return res
    .status(200)
    .json(ApiResponse(200,tweet,"Tweet added Successfully"))
})

const updateTweet=asyncHandler(async(req,res)=>{
    const {tweetId}=req.params
    const {content}=req.body
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid id");
    }
    const tweet=await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(400,"Tweet is not presesnt ");
    }
    if(tweet?.owner?.toString()!==req.user?._id?.toString()){
        throw new ApiError(401,"You can't change this detail");
    }
    const updatedtweet=await Tweet.updateOne(tweet?._id,
        {
            $set:{content}
            
        },{new:true}
    )
    if(!updateTweet){
        throw new ApiError(500, "Failde to update comment please try again later ")
    }
    return res
    .status(200)
    .json(ApiResponse(200,updateTweet,"Tweet updated successfully"))
})


const deleteTweet=asyncHandler(async(req,res)=>{
    const {tweetId}=req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid id");
        
    }
    const tweet=await Tweet.findById(tweetId)
    if (!tweet) {
        throw new Error(404,"Tweet not found");
    }
    if(tweet?.owner?.toString()!==req.user?._id?.toString()){
        throw new Error(403,"You are not allowed to delete the tweet ");
        
    }
    await Tweet.findByIdAndDelete(tweetId)
    return res
    .status(200)
    .json(ApiResponse(200,null,"Tweet deleted SuccessFully"))
})

const getUserTweet=asyncHandler(async(req,res)=>{
    const {userId}=req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid user id");
    }
    const user=await User.findById(userId);
    if(!user){
        throw new ApiError(404,"User not found");
    }
    const tweets =await Tweet.aggregate([{
            $match:{
                owner: new mongoose.Types.ObjectId(userId),
            },
        },{
             $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"userDetails",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            avatar:1
                        }
                    }
                ]
            },
            
        },{
            $lookup:{
                from :"likes",
                localField:"tweet",
                foreignField:"_id",
                as:"likeDetails",
                pipeline:[
                    {
                        $project:{
                            likedBy:1
                        }
                    }
                ]
            }
        },{
            $addFields:{
                likesCount: {
                    $size: "$likeDetails",
                },
                ownerDetails: {
                    $first: "$ownerDetails",
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$likeDetails.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            },
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                content: 1,
                ownerDetails: 1,
                likesCount: 1,
                createdAt: 1,
                isLiked: 1
            },
        },

        
    ])
    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});

export {
    getUserTweet,deleteTweet,updateTweet,addTweet
}
