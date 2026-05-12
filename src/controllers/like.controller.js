import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";



const toggleVideoLike=asyncHandler(async(req,res)=>{
   const {videoid}=req.params
   if(!isValidObjectId){
    throw new ApiError(401,"Invalid video Id");
   }
   const isLikedAlready=await Like.findOne({
       video:videoid,
       likedBy:req.user?._id
   })
   if(isLikedAlready){
    await Like.findByIdAndDelete(isLikedAlready?._id);
    return res
    .status(200)
    .json(ApiResponse(200,{isLiked:false}))
   }
   await Like.create({
       video:videoid,
       likedby:req.user?._id
   })
   return res
    .status(200)
    .json(ApiResponse(200,{isLiked:true}))
   
})

const toggleCommentLike=asyncHandler(async(req,res)=>{
    const {commentId}=req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(401,"Invalid comment id");
    }
    const isLikedAlready=await Like.findOne({
        comment:commentId,
        likedBy:req.user?._id
    })
    if(isLikedAlready){
        await Like.findOneAndDelete(isLikedAlready?._id)
        return res.
        status(200)
        .json(ApiResponse(200,{isLiked:false}))
    }
    await Like.create({
        comment:commentId,
        likedBy:req.user?._id
    })
    return res
        .status(200)
        .json(ApiResponse(200,{isLiked:true}))
})

const toggletweetLike=asyncHandler(async(req,res)=>{
    const {tweetId}=req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(401,"nvalid tweet ID");
    }
    const isLikedAlready=await Like.findOne({
        tweet:tweetId,
        likedBy:req.user?._id
    })
    if(isLikedAlready){
        await Like.findByIdAndDelete(isLikedAlready?._id)
        return res
        .status(200)
        .json(ApiResponse(200,{isLiked:false}))
    }
    await Like.create({
        tweet:tweetId,
        likedBy:req.user?._id
    })
    return res
        .status(200)
        .json(ApiResponse(200,{isLiked:true}))
})

const getLikedVideos=asyncHandler(async(req,res)=>{
    const likedVideosAggregate= await Like.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"likedVideos",
                pipeline:
                [
                    {
                        $lookup:
                        {
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"ownerDetails"
                        }
                    },
                    {
                        $unwind: "$ownerDetails",
                    },
                ],
            },
        },
        {
            $unwind:"$likedVideos"
        },
        {   $sort: {
                createdAt: -1,
                },
        },
        {
            $project:{
                _id:0,
                likedVideos:{
                    _id:1,
                    thumbnail:1,
                    avatar:1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                     ownerDetails: {
                        username: 1,
                        fullName: 1,
                        "avatar.url": 1,
                    },
                }
            }
        }
        
    ])
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideosAggegate,
                "liked videos fetched successfully"
            )
        );
})
export {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    toggletweetLike
}