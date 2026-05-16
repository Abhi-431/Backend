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
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;;
   if (!videoFileLocalpath )  {
    throw new ApiError(400, "Video are required");
  }
  if(!thumbnailLocalPath){
    throw new ApiError(400, "Video are required");
  }
  console.log("hii")
    const videoFile=await uploadONCloudinary(videoFileLocalpath)
    const thumbnail=await uploadONCloudinary(thumbnailLocalPath)
    console.log(thumbnail)
    console.log(videoFile)
    
if (!videoFile)  {
    throw new ApiError(500, "File upload failed");
  }
  if(!thumbnail) {
     throw new ApiError(500, "File upload failed");
  }
    const video=await Video.create({
        description,
        title,
        isPublished:false,
        thumbnail:thumbnail.url,
        videoFile:videoFile.url,
        duration:videoFile.duration,
        owner:req.user.id
    })
    const videoUploaded = await Video.findById(video._id);

     if (!videoUploaded) {
       throw new ApiError(500, "videoUpload failed please try again !!!");
    }

return res.
status(200)
.json(new ApiResponse(200,video,"video uploded successfully"))
})
//
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video id is invalid");
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
                        as:"subscribers"
                    }
                },
                {
                    $addFields:{
                        subscriberCount:
                        { 
                            $size:"$subscribers"
                        },
                        isSubscribed:{
                            $cond:{

                                if:{
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
                        avatar:1,
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
                    if:{$in:[req.user?._id,"$likes.likedBy"]},
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
    const pipeline =[]
    console.log(userId)// check what is user Id
    // for using Full Text based search u need to create a search index in mongoDB atlas
    // you can include field mapppings in search index eg.title, description, as well
    // Field mappings specify which fields within your documents should be indexed for text search.
    // this helps in seraching only in title, desc providing faster search results
    // here the name of search index is 'search-videos'
      //  Full-text search (only if query exists)
      if (query) {
    pipeline.push({
      $search: {
        index: "search-videos",
        text: {
          query: query,
          path: ["title", "description"]
        }
      }
    });
  }
   if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }

        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }


     // fetch videos only that are set isPublished as true
    pipeline.push({ $match: { isPublished: false } });

    //sortBy can be views, createdAt, duration
    //sortType can be ascending(-1) or descending(1)
    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }


    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails"
        }
    )

    const videoAggregate = Video.aggregate(pipeline);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };


    const videos = await Video.aggregatePaginate(videoAggregate, options);

   return res
   .status(200)
   .json(new ApiResponse(200,videos,"all Videos Fetched SuccessFully "))

})

const updateVideo=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    const {title,description}=req.body
    //Check video id is present 
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId ");
        
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
        throw new Error(404,"Video not found");
    }
     //  Ownership check (VERY IMPORTANT)


    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError
            (403,
             "You are not allowed to update this video"
            );
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
    .json(new ApiResponse(200,updatedVideo,"Video updated successfully "))
})

const deleteVideo=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(404,"Invalid videoId");   
    }
    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"No video found");
        
    }
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400,"Unauthorized access");
        
    }
    const deltedVideo=await Video.findByIdAndDelete(video?._id)
    if(!deleteVideo){
        throw new Error(400,"Failed to delete the video");
        
    }
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Video deleted SuccessFully "))
})

const togglePublish=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId");
    }

    const video=await Video.findById(videoId)

    if(!video){
        throw new ApiError(400,"Video not found");
    }
    if(!video.owner.toString!==req.user?._id.toString()){
        throw new ApiError(400,"You can't change the publish status you are not the owner");
        
    }
   const toggledVideoPublish = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video?.isPublished
            }
        },
        { new: true }
    );

    if (!toggledVideoPublish) {
        throw new ApiError(500, "Failed to toogle video publish status");
    }
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