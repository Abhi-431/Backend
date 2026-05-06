import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller";




const router=Router()
router.use(verifyJWT)


router.route("/").post(createPlaylist)
router.route("/:playlistId")
      .get(getPlaylistById)
      .patch(updatePlaylist)
      .delete(deletePlaylist)
router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist)
export default router;