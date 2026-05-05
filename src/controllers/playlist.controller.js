import { connections, isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Video } from "../models/video.model";




const createPlaylist=asyncHandler(async (req,res) => {
    const {name,description}=req.body;
    if(!name || !description){
        throw new ApiError(400,"Both name and description are required.");
    }
    const playList=await Playlist.create({
        name,
        Description,
        owner:req.user?._id
    })
    if(!playList){
        throw new ApiError(500,"Failed to create a playlist...")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,playList,"Playlist created SuccessFully."))
})

const addVideoToPlaylist=asyncHandler(async (req,res) => {
    const {playlistId,videoId}=req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video por playlist ids");
    }
    const playlist=await Playlist.findById(playlistId)
    const video=await Video.findById(videoId)
   if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if (!video) {
        throw new ApiError(404, "video not found");
    }
    if(playlist.owner.toString() && video.owner.toString()!== req.user?._id.toString()){
        throw new ApiError(400, "only user can chane these details ");
    }
     const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $addToSet: {
                videos: videoId,
            },
        },
        { new: true }
    );

    if (!updatedPlaylist) {
        throw new ApiError(
            400,
            "failed to add video to playlist please try again"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Added video to playlist successfully"
            )
        );
})

const updatePlaylist =asyncHandler(async (req,res) => {
    const {name,description}=req.body
    const {playlistId}=req.params
    if(!name || !description){
        throw new ApiError(400,"Boht name and description are required");
    }
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid Playlist Id");
    }
    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"Playlist not found");
    }
    if(playlist.owner.toString() !== req.user?._id?.toString){
        throw new ApiError(400,"Only owner can edit playlist");
    }
    const updatedPlaylist=await Playlist.findByIdAndUpdate(playlistId,
        {
            $set:{
                name,
                description,
                owner:req.user?._id
            }
        },{new :true}
    )
   return res
   .status(200)
   .json(new ApiResponse(200,updatePlaylist,"Playlist updated successfully"))
})
const deletePlaylist =asyncHandler(async (req,res) => {
    const {playlistId}=req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid plalist Id");
    }
    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"Playlist not found");
    }
    if(playlist?.owner.toString !== req.user?._id?.toString()){
        throw new ApiError(400,"only user can delete playlist");
    }
    await Playlist.findByIdAndDelete(playlistId)
    return res
    .status(200)
    .json(new ApiResponse(200,null,"Playlist deletd successfully"))
})

const removeVideoFromPlaylist =asyncHandler(async (req,res) => {
    const {playlistId,videoId}=req.params
     if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid PlaylistId or videoId");
    }

    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (!video) {
        throw new ApiError(404, "video not found");
    }

    if(playlist.owner?.toString() && video.owner.toString() !==
        req.user?._id.toString())
    {
        throw new ApiError( 404, "only owner can remove video from thier playlist");
    }
    const updatedPlaylist=await Playlist.findByIdAndUpdate(playlistId,
        {
            $pull:{
                videos:videoId
            }
        },{new:true}
    )
    if(!updatePlaylist){
        throw new ApiError(500,"Failed to update playlist");
    }
    return res
    .status(200)
    .json(new ApiResponse(200,updatePlaylist,"video removed successfully."))
})

const getPlaylistById =asyncHandler(async (req,res) => {
    const {playlistid}=req.params
    if(!isValidObjectId){
        throw new ApiError(200,"Invalid playlist Id"); 
    }
    const playlist=await Playlist.findById(playlistid)
    if(!playlist){
        throw new ApiError(200,"Playlist not found ");
    }
    const updatedPlaylist=await Playlist.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjecId(playlistid)
            }
        },
        {
            $lookup:
            {
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos"
            }
        },{
            $match:{
                "videos.ispublished":"true"
            }
        },{
            $lookup:
            {
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"
            }
        },{
            $addFields:{
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                },
                owner: {
                    $first: "$owner"
                }
            }
        },{
             $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                totalVideos: 1,
                totalViews: 1,
                videos: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                },
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                }
            }
        }

    ])
    return res 
    .status(200)
    .json(new ApiResponse(200,updatedPlaylist,"plalist fetched successfully"))
})

const getUserPlaylist=asyncHandler(async (req,res) => {
     const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }
    const playlist=await Playlist.aggregate([
         {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1
            }
        }
    ]);

    return res
    .status(200)
    .json(new ApiResponse(200, playlists, "User playlists fetched successfully"));

})

export {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getPlaylistById,
    getUserPlaylist,
};