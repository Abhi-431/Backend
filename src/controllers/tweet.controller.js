import { isValidElement } from "react";
import { Tweet } from "../models/tweet.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model";

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

})


const deleteTweet=asyncHandler(async(req,res)=>{

})

const getUserTweet=asyncHandler(async(req,res)=>{

})
