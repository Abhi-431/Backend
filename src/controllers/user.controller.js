import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadONCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
const generateAccessAndRefreshToken=async (userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken =refreshToken   // save refresh token in user 
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}
  
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access and refresh token")
    }
}
const registerUser=asyncHandler(async (req,res)=>{
    //get user detail from frontend 
    //validation not empty 
    //check if user already exist :username,email
    //check for images ,check for avatar
    // check for images ,check for avatar
    // upload them in cloudinary ,avatar
    //craete user object -create entry in db
    // remove password and response token field from response 
    // check for user creation
    //return res  

    const {fullname,email,username,password}=req.body//1

    if([fullname,email,username,password].some((field)=>//read it 
field?.trim()==="")){
    throw new ApiError(400,"All fields are required")
}
const existedUser= await User.findOne({
    $or:[{ username },{ email }]
})
if(existedUser){
    throw new ApiError(409,"User with email and username already exist ");
}
const avatarLocalPath=req.files?.avatar[0]?.path;//read it
//console.log(avatarLocalPath)
const CoverImageLocalPath=req.files?.coverImage[0]?.path;//read it
if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required");
}
const avatar=await uploadONCloudinary(avatarLocalPath)
const coverImage=await uploadONCloudinary(CoverImageLocalPath)
if(!avatar){
    throw new ApiError(400,"Avatar file is required");
}



const user=await User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url||"",
    email,
    password,
    username:username.toLowerCase()

})
console.log(user)

const createduser = await User.findById(user._id).select("-password -refreshtoken")
if(!createduser){
    throw new Error(500,"Somethin went wrong while registering the user ");
    
}
console.log(createduser)
return res.status(201).json(
    new ApiResponse(200,createduser," registerd successFully ")
)

console.log(req.body);
console.log(req.files);
})
const loginUser=asyncHandler(async(req,res)=>{
    //req body -> data
    //username or email
    //find the user
    //(!user)error
    //pasword check 
    //acess and refresh token provided  
    //send in cookie 
    const {email,username,password}=req.body
    if(!username && !email){
        throw new ApiError(400,"username password is required");
    }
    const user=await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"user not exist");  
    }


    const isPasswordValid=await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"invalid user credentials"); 
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,{
                user:loggedInUser,accessToken,refreshToken
            },
            "user LoggedIn SuccessFully"
        ))
     } )
 const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
     const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(
            200,{},
            "user Loggedout SuccessFully"
        ))
 })
//Make refersh access token method 
const refreshAccessToken=asyncHandler(async(req,res)=>{
   const incomingRefreshToken= req.cookies.refreshToken||req.body.refreshToken  //take refrwsh token from cookies or body
   if(!incomingRefreshToken){
    throw new ApiError(401,"Unauthorized request")
   }
   try {
    const decodedtoken=jwt.verify(   // decoding the refresh token in raw form 
     incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
    )
     const user=await User.findById(decodedtoken?._id)
     if(!user){
         throw new ApiError(401,"Invalid refresh Token ")
     }
     if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401,"Refresh Token is Expired or Invalid ");
         
     }
 
     const options={
         httpOnly:true,
         secure:true
     }
    const {accessToken,newrefreshToken}= await generateAccessAndRefreshToken(user._id)
 
     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",newrefreshToken,options)
     .json(
         new ApiResponse(
             200,{
                 accessToken,refreshToken:newrefreshToken
             },
             "Access token Refreshed"
         ))
   } catch (error) {
    throw new ApiError(401,error?.message,"Invalid Refresh token");
    
   }

})
const changeCurrentPass=asyncHandler(async(req,res)=>{
    const {oldpassword,newpassword}=req.body;
    const user=User.findByIdAndUpdate(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldpassword)
    if(!isPasswordCorrect){
        throw new ApiError(401,"Entered password is wrong"); 
    }
    user.password=newpassword
    await user.save({validateBeforeSave:false})
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})
const updateUserDetails=asyncHandler(async (req,res) => {
    const {fullname,email}=req.body
    if(!(fullname||email)){
        throw new ApiError(401,"Eneter required fields");
    }
    const user=User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                fullname:fullname,
                email:email
            }
        },
        {new:true})
        return res
        .status(200)
        .json(new ApiResponse(200, user, "Detail has been changed successfully ")).select("-password")
})
const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"Current User"))
})
const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(401,"Avatar File is missing ");
    }
    const avatar =await uploadONCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new Error(401,"Errro while uploading an avatar");
    }
    const user=await User.findByIdAndUpdate(req.user?._id,
        {
            $set:
            {
                avatar:avatar.url
            }
        },{new:true}).select("-password -refreshToken")
        return res
        .status(200)
        .json(new ApiResponse(200,user,"Avatar updated SuccessFully"))
})
const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(401,"Coverimage File is missing ");
    }
    const coverImage =await uploadONCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(401,"Errro while uploading CoverImage ");
    }
    const user=await User.findByIdAndUpdate(req.user?._id,
        {
            $set:
            {
                coverImage:coverImage.url
            }
        },{new:true}).select("-password -refreshToken")
        return res
        .status(200)
        .json(new ApiResponse(200,user,"CoverImage updated SuccessFully"))
})
const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.param
    if(!username?.trim()){
        throw new ApiError(401,"Username is not present ");
    }
    const channel=User.aggregate([
        {
            $match:{
                username : username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscribers",
                localField:"_id",
                foreignField:"channel",
                as:"subscriber"
            }
        },
        {
            $lookup:{
                from:"subscribers",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:
            {
                subscriberCount:{
                    $size:"subscriber"
                },
                channnelSubscribedToCount:{
                    $size:"subscribedTo"
                },
                isSubscribe:{
                    if:{$in:[req.user?._id,"$subscriber.subscribe"]},
                    then:true,
                    else:false
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscriberCount:1,
                channnelSubscribedToCount:1,
                email:1,
                avatar:1,
                coverImage:1,
                isSubscribe:1
            }
        }
    ])
    if(!channel?.length){
        throw new ApiError(401,"Channel Dose Not Exist ");
        
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User Channel Fetched SuccessFully")
    )
})
const getWatchhistory=asyncHandler(async(req,res)=>{
    const user= User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user)
            }
        },{
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    project:{
                                        username:1,
                                        fullname:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json( new ApiResponse(200,user[0].watchHistory,"Watch History fetched successfully"))
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPass,
    updateUserDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchhistory,getCurrentUser
}