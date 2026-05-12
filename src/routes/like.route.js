import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { getLikedVideos, toggleCommentLike, toggletweetLike, toggleVideoLike } from "../controllers/like.controller.js";



const router=Router()
router.use(verifyJWT)


router.route("/toggle/v/:videoId/").post(toggleVideoLike)
router.route("/toggle/c/:commentId/").post(toggleCommentLike)
router.route("/toggle/t/:tweetId/").post(toggletweetLike)
router.route("/videos").get(getLikedVideos)

export default router;