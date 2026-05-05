import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware";
import { getLikedVideos, toggleCommentLike, toggletweetLike, toggleVideoLike } from "../controllers/like.controller";



const router=Router()
router.use(verifyJWT)


router.route("/toggle/v/videoId:/").post(toggleVideoLike)
router.route("/toggle/c/commentId:/").post(toggleCommentLike)
router.route("/toggle/t/tweetId:/").post(toggletweetLike)
router.route("/videos").get(getLikedVideos)

export default router;