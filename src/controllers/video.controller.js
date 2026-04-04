import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadONCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Video } from "../models/video.model.js";



const publishAVideo=asyncHandler(async(req,res)=>{

    const {title,description,isPublished}=req.body
    if([title,description].some((field)=>//read it 
field?.trim()===""))
    {
        throw new ApiError(401,"All fields are Required");
    }
    if(typeof isPublished!=="boolean"){
        throw new ApiError(401,"Is publish is a boolean");  
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

  if (!videoId?.trim()) {
    throw new ApiError(400, "Video id is required");
  }

  const video = await Video.findById(videoId)
    .populate("owner", "username avatar");

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // 🔐 Publish / ownership check
  if (!video.isPublished && video.owner._id.toString() !== req.user?.id) {
    throw new ApiError(403, "This video is not published");
  }

  // 👁️ Increment views AFTER access check
  video.views += 1;
  await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});


const getAllVideos=asyncHandler(async(req,res)=>{
    const {page=1,limit=10,query,sortBy,sortType,userId}=req.query
    const filter={
        isPublished:true
    }
     if(userId){
        filter.owner=userId
    }
     if(query){
        filter.$or=[
            {title:{$regex :query,$options:"i"}},
            {description:{$regex :query,$options:"i"}}
        ]
    }
    const sortOptions={
        [sortBy]:sortType==="asc"?1:-1
    }

   const skip= (page-1)*limit;

    const videos=await Video.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(Number(limit))
    .populate("owner","username avatar")

    if(videos.length===0){
        throw new ApiError(400,"No Video is present");
    }
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
    publishVideo,
    getVideoById,
    getAllVideos,
    updateVideo,
    deleteVideo,
    togglePublish
}