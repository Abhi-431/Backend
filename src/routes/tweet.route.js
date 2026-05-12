import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { addTweet, deleteTweet, getUserTweet, updateTweet } from "../controllers/tweet.controller.js";




const router=Router()
router.use(verifyJWT)


router.route("/").post(addTweet)
router.route("/user/:userId").get(getUserTweet)
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet)

export default router;