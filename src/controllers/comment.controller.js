import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Like } from "../models/like.model.js"


const getVideoComments=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    const {page=1,limit=10}=req.query
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id ");
    }

    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"Video not found");
        
    }
    const commentAggregate= Comment.aggregate([
        {
            $match:mongoose.Types.ObjectId(videoId)
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"
            }
        },
        {
            $lookup:
            {
                from:"likes",
                localField:"_id",
                foreignField:"comment",
                as:"likes"
            }
        },{
            $addFields:{
                likesCount:{
                    $size:"$likes"
                },
                owner:{
                    $first:"$owner"
                },
                isLiked:{
                    $cond:{
                        if:{
                            $in:[req.user?._id,"$likes.likedBy"]
                        },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        },{
            project:{
                content: 1,
                createdAt: 1,
                likesCount: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                },
                isLiked: 1
            }
        }
    ]);
    const options={
        page:parseInt(page,10),
        limit:parseInt(limit,10)
    }
    const comments =await Comment.aggregatePaginate(
        commentAggregate,
        options
    )
    return res
    .status(200)
    .json(new ApiResponse(200,comments,"Comment fetched Successfully "))
})

const addComment=asyncHandler(async (req,res) => {
    const {videoId}=req.params
    const {content}=req.body
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId");
    }
    const video=await Video.findById(videoId)
    if(!video){
        throw new Error(404,"Video not found");  
    }
    if(!content){
        throw new ApiError(400,"Content is required");  
    }
    const comment=await Comment.create({
        content,
        video:videoId,
        owner:req.user?._id
    })
    if(!comment){
        throw new ApiError(500,"Failed to add a Comment ");
    }
    return res
    .status(200)
    .json(new ApiResponse(200,comment,"Comment added SuccessFully"))
})

const updateComment=asyncHandler(async(req,res)=>{
    const {commentId}=req.params
    const {content}=req.body

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid VideoId");
    }

    const comment=await CommentfindById(commentId)
    if(!comment){
        throw new ApiError(400,"Comment not found");
    }

    if(comment?.owner?.toString()!==req.user?._id.toString){
        throw new ApiError(400,"You are not the owner so you are unabled to change the password ");
    }

    const updatedComment=await Comment.findByIdAndUpdate(comment?._id,{
        $set:{
            content
        }
    },{new:true})

     if (!updatedComment) {
        throw new ApiError(500, "Failed to edit comment please try again");
    }


    return res
   .status(200)
    .json(new ApiResponse(200,updatedComment,"comment updated successFully" ))
})

const deleteComment=asyncHandler(async(req,res)=>{
    const {commentId}=req.params
    const comment=await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404,"Comment not Found");
    }

    if(comment?.owner.toString()!==req.user?._id.toString()){
        throw new ApiError(400,"Only owner able to delete the comment ");
    }
    await Comment.findByIdAndDelete(commentId);
    await Like.deleteMany({
        comment:commentId,
        likedBy:req.user
    })
    return res
    .status(200)
    .json(new ApiResponse(200,{commentId},"Comment deleted succesfully "))
})
export {
    getVideoComments,
    addComment,
    updateComment
}

