import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadONCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
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

    const {fullname,email,username,password}=req.body

    if([fullname,email,username,password].some((field)=>
    field?.trim()==="")
){
    throw new ApiError(400,"All fields are required")
}
const existedUser=User.findOne({
    $or:[{ username },{ email }]
})
if(existedUser){
    throw new ApiError(409,"User with email and username already exist ");
}
const avatarLocalPath=req.files?.avatar[0]?.path;
console.log(avatarLocalPath)
const CoverImageLocalPath=req.files?.coverImage[0]?.path;
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

const createduser = await User.findById(user._id).select("-password -refreshtoken")
if(!createduser){
    throw new Error(500,"Somethin went wrong while registering the user ");
    
}
return res.status(201).json(
    new ApiResponse(200,createduser," registerd successFully ")
)
})





export {
    registerUser,
}