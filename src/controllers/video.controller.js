import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadONCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";



const publishAVideo=asyncHandler(async(req,res)=>{

    const {title,description,isPublished}=req.body
    if([title,description].some((field)=>//read it 
field?.trim()===""))
    {
        throw new ApiError(400,"All fields are Required");
    }

    const videoFileLocalpath=req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
   if (!videoFileLocalpath || !thumbnailLocalPath) {
    throw new ApiError(400, "Video and thumbnail are required");
  }
    const videoFile=await uploadONCloudinary(videoFileLocalpath)
    const thumbnail=await uploadONCloudinary(thumbnailLocalPath)
    
if (!videoFile?.url || !thumbnail?.url) {
    throw new ApiError(500, "File upload failed");
  }
    const video=await Video.create({
        description,
        title,
        isPublished,
        thumbnail:thumbnail.url,
        videoFile:videoFile.url,
        duration:videoFile.duration,
        owner:req.user.id
    })

return res.
status(200)
.json(new ApiResponse(200,video,"video uploded successfully"))
})


const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video id is valid");
  }
  if (!isValidObjectId(req?.user?._id)) {
    throw new ApiError(400, "User is not valid");
  }

  const video=await Video.aggregate([
    {
        $match:{
            _id:new mongoose.Types.ObjectId(videoId)
        }
    },
    {
        $lookup:{
            from:"likes",
            localField:"_id",
            foreignField:"video",
            as:"likes"
        }
    },{
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[
                {
                    $lookup:{
                        from:"subscriptions",
                        localField:"_id",
                        foreignField:"channel",
                        as:"subscriber"
                    }
                },
                {
                    $addFields:{
                        subscriberCount:
                        { 
                            $size:"$subscriber"
                        },
                        isSubscribed:{
                            $cond:{

                                $if:{
                                    $in:[
                                        req.user?._id,
                                        "$subscribers.subscriber"
                                    ]
                                },
                                then:true,
                                else:false
                            }
                        }
                    }
                },
                {
                    $project:{
                        username:1,
                        "avatar.url":1,
                        subscriberCount:1,
                        isSubscribed:1
                    }
                }
            ]
        }
        
    },
    {
        $addFields:{
            likesCount:{
                $size:"$likes"
            },
            owner:{
                $first:"$owner"
            },
            isLiked:{
                $cond:{
                    $if:{$in:[req.user?._id,"$likes.likedBy"]},
                    then: true,
                    else: false
                }
            }
        }
    },
    {
        $project:
        {
             "videoFile.url": 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                comments: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1

        }
    }
  ])
  if (!video) {
        throw new ApiError(500, "failed to fetch video");
    }

    // increment views if video fetched successfully
    await Video.findByIdAndUpdate(videoId, {
        $inc: {
            views: 1
        }
    });

    // add this video to user watch history
    await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: {
            watchHistory: videoId
        }
})
















//   const video = await Video.findById(videoId)
//     .populate("owner", "username avatar");

//   if (!video) {
//     throw new ApiError(404, "Video not found");
//   }

//   //  Publish / ownership check
//   if (!video.isPublished && video.owner._id.toString() !== req.user?.id) {
//     throw new ApiError(403, "Video is Removed by user ");
//   }

//   // Increment views AFTER access check
//   video.views += 1;
//   await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully"));
});


const getAllVideos=asyncHandler(async(req,res)=>{
    const {page=1,limit=10,query,sortBy,sortType,userId}=req.query
    







//     const filter={
//         isPublished:true
//     }
//      if(userId){
//         filter.owner=userId
//     }
//      if(query){
//         filter.$or=[
//             {title:{$regex :query,$options:"i"}},
//             {description:{$regex :query,$options:"i"}}
//         ]
//     }
//     const sortOptions={
//         [sortBy]:sortType==="asc"?1:-1
//     }

//    const skip= (page-1)*limit;

//     const videos=await Video.find(filter)
//     .sort(sortOptions)
//     .skip(skip)
//     .limit(Number(limit))
//     .populate("owner","username avatar")

   return res
   .status(200)
   .json(new ApiResponse(200,videos,"all Videos Fetched SuccessFully "))

})

const updateVideo=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    const {title,description}=req.body
    //Check video id is present 
    if(!videoId || videoId.trim()===""){
        throw new ApiError(400,"Video Id required ");
        
    }
//Alternate method 

// if ([title, description].some(field => !field || field.trim() === "")) {
//   throw new ApiError(400, "Title and description cannot be empty");
// }
    //Check the title and description is provided
    if([title,description].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"Title and Descriptin cant be empty .");
    }
    const video=await Video.findById(videoId)
    //  Video is fetched by id 
    if(!video){
        throw new Error(400,"Video not found");
    }
     //  Ownership check (VERY IMPORTANT)
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this video");
    }

   //If thumbnail provided upload else use the prev one 
   let thumbnailUrl=video.thumbnail
   const thumbnailLocalPath= req.files?.thumbnail?.[0]?.path
   if(thumbnailLocalPath){
    const thumbnail=await uploadONCloudinary(thumbnailLocalPath)
    if(!thumbnail){
        throw new ApiError(400,"Thumbnail upload Failed");
    }
    thumbnailUrl=thumbnail.url
   }
   //Update video details 
    const updatedVideo=await Video.findByIdAndUpdate(id,
        {
            $set: 
            {
                title:title,
                description:description,
                thumbnail:thumbnailUrl
            }
        },{new:true}
    )
    
    return res
    .status(200)
    .json(new ApiResponse(200,updatedVideo,"Video updfated successfully "))
})

const deleteVideo=asyncHandler(async(req,res)=>{
    const {id}=req.params
    const video=await Video.findById(id)
    if(!video){
        throw new ApiError(404,"Video Id is required");   
    }
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(404,"Unauthorized access");
        
    }
    await Video.findByIdAndDelete(id)
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Video deleted SuccessFully "))
})
const togglePublish=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    if(!videoId){
        throw new ApiError(400,"VideoId is required");
    }
    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"Video not found");
    }
    video.isPublished = !video.isPublished
    await video.save({ validateBeforeSave: false });
    return res
    .status(200)
    .json(new ApiResponse(200,video,"Video toggle successFully"))
})
export{
    publishAVideo,
    getVideoById,
    getAllVideos,
    updateVideo,
    deleteVideo,
    togglePublish
}