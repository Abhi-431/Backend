import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadONCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Video } from "../models/video.model.js";



const publishVideo=asyncHandler(async(req,res)=>{

    const {title,discription,isPublish}=req.body
    if(![title,discription].some((field)=>//read it 
field?.trim()===""))
    {
        throw new ApiError(401,"All fields are Required");
    }
    if(typeof isPublish!=="Boolean"){
        throw new ApiError(401,"Is publish is a boolean");
        
    }

    const videoFileLocalpath=req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
   if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Video and thumbnail are required");
  }
    const videoLocal=await uploadONCloudinary(videoFilelocalpath)
    const thumbnail=await uploadONCloudinary(thumbnailPath)
    

    const video=Video.create({
        discription,
        title,
        isPublish,
        thumbnail:thumbnail.url,
        videoFile:videoFile.url,
        duration:videoFile.duration,
        owner:req.user.id
    })
return res.
status(200)
.json(new ApiResponse(200,video,"video uploded successfully"))
})